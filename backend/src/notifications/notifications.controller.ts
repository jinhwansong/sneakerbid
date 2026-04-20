import { Controller, Get, Param, Patch, Query, Sse } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventsService } from '@/events/events.service';
import { User } from '@/common/decorator/user.decorator';
import type { RequestUser } from '@/common/decorator/user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200 })
  list(
    @User() user: RequestUser,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 30;
    return this.notificationsService.list(
      user,
      Number.isFinite(l) ? l : 30,
      cursor?.trim() || undefined,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '미읽음 개수' })
  unreadCount(@User() user: RequestUser) {
    return this.notificationsService.unreadCount(user);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '알림 전체 읽음' })
  markAllRead(@User() user: RequestUser) {
    return this.notificationsService.markAllRead(user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  markRead(@User() user: RequestUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user, id);
  }

  @Sse('stream')
  @ApiOperation({
    summary: '알림 실시간 스트림 (SSE)',
    description: '로그인 쿠키 필요. 새 알림 시 이벤트 전송',
  })
  streamNotifications(@User() user: RequestUser): Observable<MessageEvent> {
    return this.eventsService.streamNotifications(user.id);
  }
}
