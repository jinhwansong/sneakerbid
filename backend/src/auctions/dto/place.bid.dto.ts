import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceBidDto {
  @ApiProperty({
    description: '입찰 금액 (원). 현재가 + minimumIncrement 이상이어야 함',
    example: 11000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bidPrice: number;
}
