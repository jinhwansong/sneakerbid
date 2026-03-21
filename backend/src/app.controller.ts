import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '@/common/decorator/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '헬스/환영 메시지' })
  @ApiResponse({ status: 200, description: 'OK' })
  getHello(): string {
    return this.appService.getHello();
  }
}
