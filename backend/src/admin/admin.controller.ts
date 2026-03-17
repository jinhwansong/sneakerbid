import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SetBotEnabledDto } from './dto/set-bot-enabled.dto';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guard/roles.guard';

@ApiTags('Admin')
@Controller('admin')
@Roles(UserRole.ADMIN)
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('bots')
  @ApiOperation({
    summary: '봇 목록',
    description: '모든 봇 목록 (enabled 상태 포함)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getBots() {
    return this.adminService.getBots();
  }

  @Patch('bots/:botId/enabled')
  @ApiOperation({
    summary: '봇 on/off',
    description: '봇 활성화/비활성화 토글',
  })
  @ApiParam({ name: 'botId', description: '봇 ID' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: '봇 없음' })
  setBotEnabled(
    @Param('botId', new ParseUUIDPipe()) botId: string,
    @Body() dto: SetBotEnabledDto,
  ) {
    return this.adminService.setBotEnabled(botId, dto.enabled);
  }

  @Get('stats/timeline')
  @ApiOperation({
    summary: '대시보드 차트용 시계열',
    description: '일별 결제 금액·건수, 유저 신규 가입 (최근 N일)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: '조회 기간 (일, 기본 14)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getDashboardTimeline(@Query('days') days?: string) {
    const parsed = days ? parseInt(days, 10) : 14;
    const validDays = Number.isNaN(parsed) ? 14 : parsed;
    const daysNumClamped = Math.min(Math.max(validDays, 1), 90);
    return this.adminService.getDashboardTimeline(daysNumClamped);
  }

  @Get('settlement')
  @ApiOperation({
    summary: '정산 현황/집계',
    description: '결제 완료 금액, 경매 종료 수, PENDING 주문 수 등',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getSettlementStats() {
    return this.adminService.getSettlementStats();
  }

  @Post('auctions/:auctionId/force-close')
  @ApiOperation({
    summary: '경매 강제 종료',
    description: '관리자 전용. endTime 무관하게 즉시 종료',
  })
  @ApiParam({ name: 'auctionId', description: '경매 ID' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: '경매 없음 또는 이미 종료' })
  forceCloseAuction(@Param('auctionId', new ParseUUIDPipe()) auctionId: string) {
    return this.adminService.forceCloseAuction(auctionId);
  }

  @Get('auctions/:auctionId/bid-history')
  @ApiOperation({
    summary: '가격 변동 차트용 입찰 히스토리',
    description: 'Recharts 등 차트용. bidPrice, createdAt 시계열',
  })
  @ApiParam({ name: 'auctionId', description: '경매 ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '최대 건수 (기본 200)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getBidHistoryForChart(
    @Param('auctionId', new ParseUUIDPipe()) auctionId: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? parseInt(limit, 10) : 200;
    const limitNum = Number.isNaN(parsed) ? 200 : parsed;
    const clamped = Math.min(Math.max(limitNum, 1), 500);
    return this.adminService.getBidHistoryForChart(auctionId, clamped);
  }
}
