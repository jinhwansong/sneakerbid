import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guard/roles.guard';
import { RequestUser, User } from '@/common/decorator/user.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@Roles(UserRole.USER, UserRole.ADMIN)
@UseGuards(RolesGuard)
@ApiBearerAuth('access-token')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('me')
  @ApiOperation({
    summary: '내 찜 목록',
    description: '로그인 사용자의 찜한 경매 목록 조회',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyWishlist(@User() user: RequestUser) {
    return this.wishlistService.getMyWishlist(user);
  }

  @Patch(':auctionId')
  @ApiOperation({
    summary: '찜하기 토글',
    description: '찜 추가(없으면) 또는 해제(있으면). isWishlisted 반환',
  })
  @ApiParam({ name: 'auctionId', description: '경매 ID' })
  @ApiResponse({ status: 200, description: '{ isWishlisted: boolean }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  toggle(@Param('auctionId') auctionId: string, @User() user: RequestUser) {
    return this.wishlistService.toggle(auctionId, user);
  }
}
