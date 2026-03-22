import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const MY_SELLING_STATUSES = ['all', 'ongoing', 'closed'] as const;
export type MySellingStatus = (typeof MY_SELLING_STATUSES)[number];

export class GetMySellingQueryDto {
  @ApiPropertyOptional({
    description: '필터 (all: 전체, ongoing: 진행중, closed: 종료됨)',
    enum: MY_SELLING_STATUSES,
  })
  @IsOptional()
  @IsIn(MY_SELLING_STATUSES)
  status?: MySellingStatus;
}
