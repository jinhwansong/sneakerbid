import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetBotEnabledDto {
  @ApiProperty({ description: '봇 활성화 여부' })
  @IsBoolean()
  enabled: boolean;
}
