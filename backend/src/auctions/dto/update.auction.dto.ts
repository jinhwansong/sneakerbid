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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AUCTION_BRANDS, AUCTION_SIZES } from '@/common/enum/auction.enum';

export class UpdateAuctionDto {
  @ApiPropertyOptional({ description: '이미지 URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '모델명 (name)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '브랜드', enum: AUCTION_BRANDS })
  @IsOptional()
  @IsString()
  @IsIn(AUCTION_BRANDS)
  brand?: (typeof AUCTION_BRANDS)[number];

  @ApiPropertyOptional({ description: '컬러웨이' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: '상품 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '사이즈 (mm)', enum: AUCTION_SIZES })
  @IsOptional()
  @IsString()
  @IsIn(AUCTION_SIZES)
  size?: (typeof AUCTION_SIZES)[number];

  @ApiPropertyOptional({ description: '시작가 (원)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startPrice?: number;

  @ApiPropertyOptional({ description: '즉시 구매가 (원)', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  buyNowPrice?: number;

  @ApiPropertyOptional({ description: '최소 입찰 단위 (원)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumIncrement?: number;

  @ApiPropertyOptional({
    description: '경매 종료 시각 (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  endTime?: string;
}
