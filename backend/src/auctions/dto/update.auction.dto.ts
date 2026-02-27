import {
  IsOptional,
  IsInt,
  Min,
  IsISO8601,
  IsString,
  IsUrl,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

import { AUCTION_BRANDS, AUCTION_SIZES } from '@/common/enum/auction.enum';

export class UpdateAuctionDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(AUCTION_BRANDS)
  brand?: (typeof AUCTION_BRANDS)[number];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(AUCTION_SIZES)
  size?: (typeof AUCTION_SIZES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  buyNowPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumIncrement?: number;

  @IsOptional()
  @IsISO8601()
  endTime?: string;
}
