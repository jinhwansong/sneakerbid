import { Controller, Param, Sse } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '@/common/decorator/public.decorator';

@ApiTags('Events')
@Controller('events')
@Public()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('auction/:auctionId')
  @ApiOperation({
    summary: '경매 실시간 스트림',
    description: 'SSE로 해당 경매의 입찰/하트비트 이벤트 수신',
  })
  @ApiParam({ name: 'auctionId', description: '경매 ID' })
  @ApiResponse({ status: 200, description: 'SSE 스트림 (text/event-stream)' })
  streamAuction(
    @Param('auctionId') auctionId: string,
  ): Observable<MessageEvent> {
    return this.eventsService.streamAuction(auctionId);
  }

  @Sse('history')
  @ApiOperation({
    summary: '거래내역 실시간 스트림',
    description: 'SSE로 새 체결(newDeal) 이벤트 수신',
  })
  @ApiResponse({ status: 200, description: 'SSE 스트림 (text/event-stream)' })
  streamHistory(): Observable<MessageEvent> {
    return this.eventsService.streamHistory();
  }
}
