import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '헬스/환영 메시지' })
  @ApiResponse({ status: 200, description: 'OK' })
  getHello(): string {
    return this.appService.getHello();
  }
}
