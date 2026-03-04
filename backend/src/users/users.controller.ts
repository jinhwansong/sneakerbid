import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestUser, User } from '@/common/decorator/user.decorator';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자 정보와 활동 통계를 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 정보' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getMe(@User() user: RequestUser) {
    const me = await this.usersService.getMeWithStats(user.id);
    if (!me) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return me;
  }
}
