import { IsOptional, IsString, IsIn, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import {
  AUCTION_BRANDS,
  SORT_OPTIONS,
  AUCTION_SIZES,
} from '@/common/enum/auction.enum';

export class AuctionListQueryDto {
  @IsOptional()
  @IsIn(AUCTION_BRANDS)
  @IsString()
  brand?: (typeof AUCTION_BRANDS)[number];

  @IsOptional()
  @IsIn(AUCTION_SIZES)
  @IsString()
  size?: (typeof AUCTION_SIZES)[number];

  @IsOptional()
  @IsIn(['OPEN', 'CLOSED'])
  status?: 'OPEN' | 'CLOSED';

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: (typeof SORT_OPTIONS)[number];

  @IsOptional()
  @IsUUID()
  afterId?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
