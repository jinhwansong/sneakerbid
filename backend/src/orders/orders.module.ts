import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EventsModule } from '@/events/events.module';
import { AuctionsModule } from '@/auctions/auctions.module';

@Module({
  imports: [EventsModule, AuctionsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
