import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import {
  AuctionRepository,
  BidRepository,
  BotRepository,
  OrderRepository,
  WishlistRepository,
} from './repositories';

@Global()
@Module({
  providers: [
    DatabaseService,
    AuctionRepository,
    BidRepository,
    BotRepository,
    OrderRepository,
    WishlistRepository,
  ],
  exports: [
    DatabaseService,
    AuctionRepository,
    BidRepository,
    BotRepository,
    OrderRepository,
    WishlistRepository,
  ],
})
export class DatabaseModule {}
