import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createMulterOptions } from '@/common/util/multer.options';
import { UploadService } from './upload.service';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guard/roles.guard';
import type { MemoryMulterFile } from './upload.types';

const MULTER_OPTIONS = createMulterOptions();

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '이미지 업로드',
    description:
      '경매 상품 이미지 업로드. Supabase Storage 또는 로컬에 저장 후 URL 반환',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
  async uploadImage(
    @UploadedFile() file: MemoryMulterFile | undefined,
  ): Promise<{ url: string }> {
    const url = await this.uploadService.uploadImage(file);
    return { url };
  }
}
