import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import {
  UPLOAD_ALLOWED_MIMES,
  UPLOAD_MAX_FILE_SIZE,
} from '@/common/constants/upload.constants';
import { getOrCreateUploadDir } from '@/common/util/upload.folder';
import { UploadFile } from './upload.types';

/** Server-detected MIME → safe extension for allowed image types */
const MIME_TO_EXT: Record<(typeof UPLOAD_ALLOWED_MIMES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const BUCKET_NAME = 'upload';

@Injectable()
export class UploadService {
  private readonly supabase: SupabaseClient | null = null;
  private readonly useSupabase: boolean;
  private readonly localBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';

    this.useSupabase = Boolean(supabaseUrl && supabaseKey);

    if (isProduction && !this.useSupabase) {
      throw new Error(
        '프로덕션에서는 SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다. Supabase Storage를 사용하세요.',
      );
    }

    if (this.useSupabase) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      }) as SupabaseClient;
    }

    const port = this.config.get<number>('PORT', 3000);
    const host = this.config.get<string>('HOST', 'localhost');
    this.localBaseUrl = `http://${host}:${port}/upload`;
  }

  async uploadImage(
    file: UploadFile | undefined,
    userId: string,
  ): Promise<string> {
    this.validateImage(file);

    const detected = await fileTypeFromBuffer(file.buffer);
    const allowedMimes = new Set(UPLOAD_ALLOWED_MIMES);
    if (
      !detected ||
      !allowedMimes.has(detected.mime as (typeof UPLOAD_ALLOWED_MIMES)[number])
    ) {
      throw new BadRequestException(
        '허용된 이미지 형식만 업로드 가능합니다. (JPEG, PNG, WebP, GIF)',
      );
    }

    const ext =
      MIME_TO_EXT[detected.mime as (typeof UPLOAD_ALLOWED_MIMES)[number]];
    const filename = `${uuid()}.${ext}`;
    const storagePath = `temp/${userId}/${filename}`;

    if (this.useSupabase && this.supabase) {
      return this.uploadToSupabase(
        file.buffer,
        storagePath,
        detected.mime,
      );
    }

    return await this.uploadToLocal(file.buffer, storagePath);
  }

  private async uploadToSupabase(
    buffer: Buffer,
    storagePath: string,
    mimetype: string,
  ): Promise<string> {
    if (!this.supabase)
      throw new BadRequestException('Storage not configured.');

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`업로드 실패: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
    return publicUrl;
  }

  private async uploadToLocal(
    buffer: Buffer,
    storagePath: string,
  ): Promise<string> {
    const dir = getOrCreateUploadDir('upload');
    const filePath = path.join(dir, storagePath);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return `${this.localBaseUrl}/${storagePath}`;
  }

  /**
   * URL이 사용자 소유 temp 폴더(temp/{userId}/)에 있는지 검증.
   * 삭제 허용 시 true.
   */
  verifyOwnershipOrTemp(url: string, userId: string): boolean {
    if (!url || typeof url !== 'string' || !userId) return false;
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      const uploadPrefix = '/upload/';
      const idx = pathname.indexOf(uploadPrefix);
      if (idx === -1) return false;
      const afterUpload = pathname.slice(idx + uploadPrefix.length);
      const expectedPrefix = `temp/${userId}/`;
      return afterUpload.startsWith(expectedPrefix);
    } catch {
      return false;
    }
  }

  /** 업로드된 이미지 삭제 (orphan 정리용). 소유권 검증 후에만 삭제. */
  async deleteImage(url: string, userId: string): Promise<void> {
    if (!url || typeof url !== 'string') return;

    if (!this.verifyOwnershipOrTemp(url, userId)) {
      throw new ForbiddenException('해당 이미지를 삭제할 권한이 없습니다.');
    }

    const pathAfterUpload = this.extractPathAfterUpload(url);
    if (!pathAfterUpload) return;

    if (this.useSupabase && this.supabase) {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([pathAfterUpload]);
      if (error) {
        console.warn('[UploadService] deleteImage failed:', error.message);
      }
      return;
    }

    const dir = getOrCreateUploadDir('upload');
    const filePath = path.join(dir, pathAfterUpload);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn('[UploadService] deleteImage (local) failed:', err);
    }
  }

  /** URL에서 upload/ 이후 경로 추출 (Supabase path 또는 로컬 상대경로) */
  private extractPathAfterUpload(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      const uploadPrefix = '/upload/';
      const idx = pathname.indexOf(uploadPrefix);
      if (idx === -1) return null;
      return pathname.slice(idx + uploadPrefix.length) || null;
    } catch {
      return null;
    }
  }

  private validateImage(
    file: UploadFile | undefined,
  ): asserts file is UploadFile {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }
    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
    }
  }
}
