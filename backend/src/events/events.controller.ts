import { Controller, Param, Sse } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '@/common/decorator/public.decorator';

@Controller('events')
@Public()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('auction/:auctionId')
  streamAuction(
    @Param('auctionId') auctionId: string,
  ): Observable<MessageEvent> {
    return this.eventsService.streamAuction(auctionId);
  }
}
