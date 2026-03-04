import { IsIn, IsOptional } from 'class-validator';

export const MY_SELLING_STATUSES = ['all', 'ongoing', 'closed'] as const;
export type MySellingStatus = (typeof MY_SELLING_STATUSES)[number];

export class GetMySellingQueryDto {
  @IsOptional()
  @IsIn(MY_SELLING_STATUSES)
  status?: MySellingStatus;
}
