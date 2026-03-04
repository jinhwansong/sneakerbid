import { BadRequestException, Injectable } from '@nestjs/common';
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

/** Server-detected MIME → safe extension for allowed image types */
const MIME_TO_EXT: Record<(typeof UPLOAD_ALLOWED_MIMES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** multer 업로드 파일 (검증용 최소 필드) */
export interface UploadedFileInfo {
  mimetype: string;
  size: number;
}

/** memoryStorage 파일 (buffer 포함) */
export interface MemoryUploadedFile extends UploadedFileInfo {
  buffer: Buffer;
  originalname: string;
}

const BUCKET_NAME = 'uploads';

@Injectable()
export class UploadService {
  private readonly supabase: SupabaseClient | null = null;
  private readonly useSupabase: boolean;
  private readonly localBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.useSupabase = Boolean(supabaseUrl && supabaseKey);

    if (this.useSupabase) {
      this.supabase = createClient(supabaseUrl!, supabaseKey!, {
        auth: { persistSession: false },
      });
    }

    const port = this.config.get<number>('PORT', 3000);
    const host = this.config.get<string>('HOST', 'localhost');
    this.localBaseUrl = `http://${host}:${port}/uploads`;
  }

  async uploadImage(file: MemoryUploadedFile | undefined): Promise<string> {
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

    const ext = MIME_TO_EXT[detected.mime as (typeof UPLOAD_ALLOWED_MIMES)[number]];
    const filename = `${uuid()}.${ext}`;

    if (this.useSupabase && this.supabase) {
      return this.uploadToSupabase(file.buffer, filename, detected.mime);
    }

    return await this.uploadToLocal(file.buffer, filename);
  }

  private async uploadToSupabase(
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    if (!this.supabase) throw new BadRequestException('Storage not configured.');

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
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

  private async uploadToLocal(buffer: Buffer, filename: string): Promise<string> {
    const dir = getOrCreateUploadDir('uploads');
    const filePath = path.join(dir, filename);
    await fs.promises.writeFile(filePath, buffer);
    return `${this.localBaseUrl}/${filename}`;
  }

  private validateImage(file: UploadedFileInfo | undefined): void {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }
    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
    }
  }
}
