import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsInt,
  Min,
  IsISO8601,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AUCTION_BRANDS, AUCTION_SIZES } from '@/common/enum/auction.enum';

export class CreateAuctionDto {
  @ApiProperty({ description: '스니커즈 모델명', example: 'Dunk Low' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({
    description: '브랜드',
    enum: AUCTION_BRANDS,
    example: 'Nike',
  })
  @IsString()
  @IsIn(AUCTION_BRANDS)
  @IsNotEmpty()
  brand: (typeof AUCTION_BRANDS)[number];

  @ApiProperty({ description: '컬러웨이', example: 'Black White' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ description: '상품 설명', example: '데드스탁 상태' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '이미지 URL',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: '사이즈 (mm)',
    enum: AUCTION_SIZES,
    example: '260',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(AUCTION_SIZES)
  size: (typeof AUCTION_SIZES)[number];

  @ApiProperty({ description: '시작가 (원)', example: 10000, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startPrice: number;

  @ApiPropertyOptional({
    description: '즉시 구매가 (원, 선택)',
    example: 150000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  buyNowPrice?: number;

  @ApiProperty({ description: '최소 입찰 단위 (원)', example: 1000, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minimumIncrement: number;

  @ApiProperty({
    description: '경매 종료 시각 (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsISO8601()
  endTime: string;
}
