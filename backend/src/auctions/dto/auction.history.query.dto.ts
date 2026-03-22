import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const AUCTION_HISTORY_PERIODS = ['1m', '3m', '6m', 'all'] as const;
export type AuctionHistoryPeriod = (typeof AUCTION_HISTORY_PERIODS)[number];

export class AuctionHistoryQueryDto {
  @ApiPropertyOptional({
    description: '최대 조회 건수',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: '기간 필터 (1m: 1개월, 3m: 3개월, 6m: 6개월, all: 전체)',
    enum: AUCTION_HISTORY_PERIODS,
  })
  @IsOptional()
  @IsIn(AUCTION_HISTORY_PERIODS)
  period?: AuctionHistoryPeriod;

  @ApiPropertyOptional({
    description: '브랜드/모델명 검색',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
