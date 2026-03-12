import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { cn } from '@/lib/util/cn';

/** 내 경매 목록 빈 상태 */
export default function EmptyMyAuctions() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-bg-sub flex items-center justify-center mb-6">
        <Package size={36} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2">등록한 경매가 없습니다</h3>
      <p className="text-sm text-text-muted mb-8 max-w-sm">
        스니커즈를 등록하고 경매를 시작해보세요.
      </p>
      <Link
        href="/me/auctions/create"
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold transition-all',
          'bg-text-main text-bg-main hover:brightness-110 shadow-lg shadow-black/5',
          'px-6 py-3.5 text-base rounded-2xl'
        )}
      >
        <Plus size={20} />
        경매 등록
      </Link>
    </div>
  );
}
