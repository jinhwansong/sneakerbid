import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestUser, User } from '@/common/decorator/user.decorator';
import { Public } from '@/common/decorator/public.decorator';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { UsersService } from './users.service';
import { ReviewsService } from '@/reviews/reviews.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

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

  @Get('me/seller-dashboard')
  @ApiOperation({
    summary: '판매자 대시보드',
    description: '조회수·입찰·매출·낙찰률 등 판매 요약',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  async getSellerDashboard(@User() user: RequestUser) {
    return this.usersService.getSellerDashboard(user.id);
  }

  @Get(':userId/reviews')
  @Public()
  @ApiOperation({ summary: '사용자에 대한 공개 리뷰 목록' })
  @ApiResponse({ status: 200, description: 'OK' })
  async getUserReviews(@Param('userId') userId: string) {
    return this.reviewsService.listPublicForUser(userId);
  }
}
