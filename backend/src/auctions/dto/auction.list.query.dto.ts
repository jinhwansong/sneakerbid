import { IsOptional, IsString, IsIn, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AUCTION_BRANDS,
  SORT_OPTIONS,
  AUCTION_SIZES,
} from '@/common/enum/auction.enum';

export class AuctionListQueryDto {
  @ApiPropertyOptional({ description: '브랜드 필터', enum: AUCTION_BRANDS })
  @IsOptional()
  @IsIn(AUCTION_BRANDS)
  @IsString()
  brand?: (typeof AUCTION_BRANDS)[number];

  @ApiPropertyOptional({ description: '사이즈 필터 (mm)', enum: AUCTION_SIZES })
  @IsOptional()
  @IsIn(AUCTION_SIZES)
  @IsString()
  size?: (typeof AUCTION_SIZES)[number];

  @ApiPropertyOptional({
    description: '경매 상태',
    enum: ['OPEN', 'CLOSED'],
  })
  @IsOptional()
  @IsIn(['OPEN', 'CLOSED'])
  status?: 'OPEN' | 'CLOSED';

  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: SORT_OPTIONS,
  })
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: (typeof SORT_OPTIONS)[number];

  @ApiPropertyOptional({
    description: '커서 페이지네이션 (이 ID 이후부터 조회)',
  })
  @IsOptional()
  @IsUUID()
  afterId?: string;

  @ApiPropertyOptional({
    description: '한 페이지당 개수',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
