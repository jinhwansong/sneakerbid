import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guard/roles.guard';
import { RequestUser, User } from '@/common/decorator/user.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('me')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 주문 목록',
    description: '로그인 사용자의 주문 목록',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyOrders(@User() user: RequestUser) {
    return this.ordersService.getMyOrders(user);
  }

  @Post('buy-now/:auctionId')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '즉시 구매',
    description: '즉시 구매가로 경매 종료 후 주문 생성',
  })
  @ApiParam({ name: 'auctionId', description: '경매 ID' })
  @ApiResponse({ status: 201, description: '주문 생성됨' })
  @ApiResponse({ status: 400, description: '이미 종료/본인 경매 등' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  buyNow(@Param('auctionId') auctionId: string, @User() user: RequestUser) {
    return this.ordersService.buyNow(auctionId, user);
  }

  @Post(':orderId/pay')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '결제', description: '주문 결제 (시뮬레이션)' })
  @ApiParam({ name: 'orderId', description: '주문 ID' })
  @ApiResponse({ status: 200, description: '결제 완료' })
  @ApiResponse({ status: 400, description: '이미 결제됨/본인 주문 아님 등' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  payOrder(@Param('orderId') orderId: string, @User() user: RequestUser) {
    return this.ordersService.payOrder(orderId, user);
  }
}
