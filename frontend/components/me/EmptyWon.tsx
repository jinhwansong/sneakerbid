import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/common/Button';

export default function EmptyWon() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-bg-sub flex items-center justify-center mb-6">
        <CheckCircle2 size={36} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2">
        낙찰받은 경매가 없습니다
      </h3>
      <p className="text-sm text-text-muted max-w-sm">
        경매에서 낙찰받으면 여기에 표시됩니다.
      </p>
      <ButtonLink href="/auction" variant="outline" size="lg" className="mt-6">
        경매 둘러보기
      </ButtonLink>
    </div>
  );
}




