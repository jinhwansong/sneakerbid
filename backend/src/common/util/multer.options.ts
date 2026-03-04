import { BadRequestException } from '@nestjs/common';
import multer, { memoryStorage } from 'multer';
import {
  UPLOAD_ALLOWED_MIMES,
  UPLOAD_MAX_FILE_SIZE,
} from '@/common/constants/upload.constants';

const ALLOWED_UPLOAD_MIMES = new Set(UPLOAD_ALLOWED_MIMES);

/** Supabase Storage 사용 시 memoryStorage 필요. 로컬 fallback도 buffer 기반 처리 */
export function createMulterOptions(): multer.Options {
  return {
    storage: memoryStorage(),
    limits: { fileSize: UPLOAD_MAX_FILE_SIZE },
    fileFilter: (
      _req: Express.Request,
      file: { mimetype: string },
      cb: (error: Error | null, accept: boolean) => void,
    ) => {
      if (
        ALLOWED_UPLOAD_MIMES.has(
          file.mimetype as (typeof UPLOAD_ALLOWED_MIMES)[number],
        )
      ) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException(
            '허용된 이미지 형식만 업로드 가능합니다. (JPEG, PNG, WebP, GIF)',
          ) as unknown as Error,
          false,
        );
      }
    },
  };
}
