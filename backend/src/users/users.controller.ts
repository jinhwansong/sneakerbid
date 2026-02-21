import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestUser, User } from '@/common/decorator/user.decorator';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자 정보를 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 정보' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@User() user: RequestUser): RequestUser {
    return user;
  }
}
