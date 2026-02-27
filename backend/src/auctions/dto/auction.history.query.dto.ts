import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export const AUCTION_HISTORY_PERIODS = ['1m', '3m', '6m', 'all'] as const;
export type AuctionHistoryPeriod = (typeof AUCTION_HISTORY_PERIODS)[number];

export class AuctionHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(AUCTION_HISTORY_PERIODS)
  period?: AuctionHistoryPeriod;

  @IsOptional()
  @IsString()
  search?: string;
}
