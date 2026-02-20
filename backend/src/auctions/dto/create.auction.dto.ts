import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsInt,
  Min,
  IsISO8601,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AUCTION_BRANDS, AUCTION_SIZES } from '@/common/enum/auction.enum';

export class CreateAuctionDto {
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsString()
  @IsIn(AUCTION_BRANDS)
  @IsNotEmpty()
  brand: (typeof AUCTION_BRANDS)[number];

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsUrl()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(AUCTION_SIZES)
  size: (typeof AUCTION_SIZES)[number];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  startPrice: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  buyNowPrice: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumIncrement: number;

  @IsISO8601()
  endTime: string;
}
