import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PlaceBidDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bidPrice: number;
}
