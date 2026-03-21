import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AuctionsService } from './auctions.service';
import { Public } from '@/common/decorator/public.decorator';
import { OptionalAuth } from '@/common/decorator/optional-auth.decorator';
import { AuctionHistoryQueryDto } from './dto/auction.history.query.dto';
import { AuctionListQueryDto } from './dto/auction.list.query.dto';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guard/roles.guard';
import { CreateAuctionDto } from './dto/create.auction.dto';
import { GetMySellingQueryDto } from './dto/get.my.selling.query.dto';
import { PlaceBidDto } from './dto/place.bid.dto';
import { RequestUser, User } from '@/common/decorator/user.decorator';
import { UpdateAuctionDto } from './dto/update.auction.dto';

@ApiTags('Auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get('main')
  @OptionalAuth()
  @ApiOperation({
    summary: '메인 경매 목록',
    description: '메인에 노출할 경매 목록. 로그인 시 isWishlisted 포함',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getMainAuctions(@User() user?: RequestUser) {
    return this.auctionsService.getMainAuctions(user);
  }

  @Get('stats')
  @Public()
  @ApiOperation({
    summary: '실시간 마켓 지표',
    description:
      'LiveStats용: 입찰자 수, 진행 경매 수, 24h 거래액, 평균 입찰 속도',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getLiveStats() {
    return this.auctionsService.getLiveStats();
  }

  @Get('history')
  @Public()
  @ApiOperation({
    summary: '거래 내역',
    description: '기간/검색 조건별 거래 내역',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: '1m | 3m | 6m | all',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '브랜드/모델명 검색',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getHistory(@Query() query: AuctionHistoryQueryDto) {
    return this.auctionsService.getTradeHistory(query);
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({
    summary: '경매 목록',
    description: '필터/페이지네이션 경매 목록. 로그인 시 isWishlisted 포함',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getList(@Query() query: AuctionListQueryDto, @User() user?: RequestUser) {
    return this.auctionsService.listAuctions(query, user);
  }

  @Get('me/bidding')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 입찰 경매 목록',
    description:
      '로그인 사용자가 입찰한 경매 목록 (ongoing: 진행중, closed: 종료됨, all: 전체)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'ongoing | closed | all (기본: ongoing)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyBidding(
    @User() user: RequestUser,
    @Query('status') status?: 'ongoing' | 'closed' | 'all',
  ) {
    return this.auctionsService.getMyBiddingAuctions(user, status ?? 'ongoing');
  }

  @Get('me/selling')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 경매 등록 목록',
    description: '로그인 사용자가 등록한 경매 목록',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'all | ongoing | closed',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMySelling(
    @User() user: RequestUser,
    @Query() query: GetMySellingQueryDto,
  ) {
    return this.auctionsService.getMySellingAuctions(
      user,
      query.status ?? 'all',
    );
  }

  @Get(':id')
  @OptionalAuth()
  @ApiOperation({
    summary: '경매 상세',
    description: '경매 단건 상세 조회. 로그인 시 isWishlisted 포함',
  })
  @ApiParam({ name: 'id', description: '경매 ID' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  getById(@Param('id') auctionId: string, @User() user?: RequestUser) {
    return this.auctionsService.getAuctionById(auctionId, user);
  }

  @Get(':id/bids')
  @Public()
  @ApiOperation({ summary: '입찰 목록', description: '해당 경매의 입찰 내역' })
  @ApiParam({ name: 'id', description: '경매 ID' })
  @ApiResponse({ status: 200, description: 'OK' })
  getBids(@Param('id') id: string) {
    return this.auctionsService.getBids(id);
  }

  @Post()
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '경매 등록',
    description: '로그인 사용자 경매 생성',
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createAuction(@Body() dto: CreateAuctionDto, @User() user: RequestUser) {
    return this.auctionsService.createAuction(dto, user.id);
  }

  @Post(':auctionId/bids')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '입찰', description: '경매에 입찰 (bidPrice)' })
  @ApiParam({ name: 'auctionId', description: '경매 ID' })
  @ApiResponse({ status: 201, description: '입찰 성공' })
  @ApiResponse({ status: 400, description: '입찰 금액 부족/종료된 경매 등' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  placeBid(
    @Param('auctionId') auctionId: string,
    @Body() dto: PlaceBidDto,
    @User() user: RequestUser,
  ) {
    return this.auctionsService.placeBid(auctionId, dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '경매 수정', description: '본인 경매만 수정 가능' })
  @ApiParam({ name: 'id', description: '경매 ID' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  patchAuctions(
    @Param('id') auctionId: string,
    @Body() updateDto: UpdateAuctionDto,
    @User() user: RequestUser,
  ) {
    return this.auctionsService.patchAuctions(auctionId, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '경매 삭제',
    description: '본인 또는 ADMIN만 삭제 가능',
  })
  @ApiParam({ name: 'id', description: '경매 ID' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  deleteAuction(@Param('id') auctionId: string, @User() user: RequestUser) {
    return this.auctionsService.deleteAuction(auctionId, user);
  }
}
