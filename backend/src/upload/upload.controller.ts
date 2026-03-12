import {
  Body,
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
import { RequestUser, User } from '@/common/decorator/user.decorator';
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
    @User() user: RequestUser,
    @UploadedFile() file: MemoryMulterFile | undefined,
  ): Promise<{ url: string }> {
    const url = await this.uploadService.uploadImage(file, user.id);
    return { url };
  }

  @Post('delete')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '이미지 삭제',
    description: '업로드된 이미지 삭제 (orphan 정리용)',
  })
  @ApiBody({ schema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } })
  async deleteImage(
    @User() user: RequestUser,
    @Body('url') url: string,
  ): Promise<{ ok: boolean }> {
    await this.uploadService.deleteImage(url, user.id);
    return { ok: true };
  }
}
