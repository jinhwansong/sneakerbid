import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
  UPLOAD_ALLOWED_MIMES,
  UPLOAD_MAX_FILE_SIZE,
} from '@/common/constants/upload.constants';
import { getOrCreateUploadDir } from '@/common/util/upload.folder';

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

    const port = this.config.get<number>('PORT', 5432) ?? 5432;
    const host = this.config.get<string>('HOST', 'localhost') ?? 'localhost';
    this.localBaseUrl = `http://${host}:${port}/uploads`;
  }

  async uploadImage(file: MemoryUploadedFile | undefined): Promise<string> {
    this.validateImage(file);

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${uuid()}${ext}`;

    if (this.useSupabase && this.supabase) {
      return this.uploadToSupabase(file.buffer, filename, file.mimetype);
    }

    return this.uploadToLocal(file.buffer, filename);
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

  private uploadToLocal(buffer: Buffer, filename: string): string {
    const dir = getOrCreateUploadDir('uploads');
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    return `${this.localBaseUrl}/${filename}`;
  }

  validateImage(file: UploadedFileInfo | undefined): void {
    if (!file) {
      throw new BadRequestException('이미지 파일이 필요합니다.');
    }
    const allowed = new Set(UPLOAD_ALLOWED_MIMES);
    if (!allowed.has(file.mimetype as (typeof UPLOAD_ALLOWED_MIMES)[number])) {
      throw new BadRequestException(
        '허용된 이미지 형식만 업로드 가능합니다. (JPEG, PNG, WebP, GIF)',
      );
    }
    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      throw new BadRequestException('파일 크기는 5MB 이하여야 합니다.');
    }
  }
}
