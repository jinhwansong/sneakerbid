import type { UserByIdResult } from '@/common/database/db.types';

export type MeWithStats = NonNullable<UserByIdResult> & {
  stats: {
    bidCount: number;
    wonCount: number;
    soldCount: number;
  };
};
