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
import { AuctionsService } from './auctions.service';
import { Public } from '@/common/decorator/public.decorator';
import { AuctionHistoryQueryDto } from './dto/auction.history.query.dto';
import { AuctionListQueryDto } from './dto/auction.list.query.dto';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserRole } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guard/roles.guard';
import { CreateAuctionDto } from './dto/create.auction.dto';
import { RequestUser, User } from '@/common/decorator/user.decorator';
import { UpdateAuctionDto } from './dto/update.auction.dto';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}
  @Get('main')
  @Public()
  getMainAuctions() {
    return this.auctionsService.getMainAuctions();
  }

  @Get('history')
  @Public()
  getHistory(@Query() query: AuctionHistoryQueryDto) {
    return this.auctionsService.getTradeHistory(query);
  }

  @Get()
  @Public()
  getList(@Query() query: AuctionListQueryDto) {
    return this.auctionsService.listAuctions(query);
  }

  @Get(':id')
  @Public()
  getById(@Param('id') auctionId: string) {
    return this.auctionsService.getAuctionById(auctionId);
  }

  @Post()
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
  createAuction(@Body() dto: CreateAuctionDto, @User() user: RequestUser) {
    return this.auctionsService.createAuction(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.USER)
  @UseGuards(RolesGuard)
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
  deleteAuction(@Param('id') auctionId: string, @User() user: RequestUser) {
    return this.auctionsService.deleteAuction(auctionId, user);
  }
}
