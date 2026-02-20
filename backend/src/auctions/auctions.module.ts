import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { EventsModule } from '@/events/events.module';

@Module({
  imports: [EventsModule],
  providers: [AuctionsService],
  controllers: [AuctionsController],
})
export class AuctionsModule {}
