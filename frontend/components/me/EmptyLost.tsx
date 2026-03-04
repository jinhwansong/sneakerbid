import React from 'react';
import { XCircle } from 'lucide-react';
import { ButtonLink } from '../common/Button';

export default function EmptyLost() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-bg-sub flex items-center justify-center mb-6">
        <XCircle size={36} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-main mb-2">
        유찰된 경매가 없습니다
      </h3>
      <p className="text-sm text-text-muted max-w-sm">
        다른 경매에 도전해보세요.
      </p>
      <ButtonLink href="/auction" variant="outline" size="lg" className="mt-6">
        경매 둘러보기
      </ButtonLink>
    </div>
  );
}


