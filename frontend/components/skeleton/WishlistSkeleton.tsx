import { Skeleton } from '../common/Skeleton';

export default function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
      ))}
    </div>
  );
}
