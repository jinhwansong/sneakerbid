import { Heart } from 'lucide-react';

export default function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-bg-sub flex items-center justify-center mb-6">
        <Heart size={36} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2">찜한 경매가 없습니다</h3>
      <p className="text-sm text-text-muted max-w-sm">
        관심 있는 경매를 찜하면 여기서 모아볼 수 있어요.
      </p>
    </div>
  );
}
