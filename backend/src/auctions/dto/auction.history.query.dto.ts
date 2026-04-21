import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const AUCTION_HISTORY_PERIODS = ['1d', '3d', '5d', 'all'] as const;
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
    description: '기간 필터 (1d: 최근 1일, 3d: 3일, 5d: 5일, all: 전체)',
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
