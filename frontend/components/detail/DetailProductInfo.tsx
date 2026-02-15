'use client';

import { AuctionItem } from '@/types/auction';

interface DetailProductInfoProps {
  item: AuctionItem;
}

export default function DetailProductInfo({ item }: DetailProductInfoProps) {
  const infoItems = [
    { label: 'Colorway', value: item.colorway },
    { label: 'Size', value: item.size != null ? `${item.size} mm` : null },
    { label: 'Style Code', value: item.styleCode },
    { label: 'Release', value: item.releaseYear?.toString() },
    { label: 'Condition', value: item.condition },
    { label: '제조국', value: item.origin },
    {
      label: '박스 포함',
      value:
        item.boxIncluded != null
          ? item.boxIncluded
            ? '포함'
            : '미포함'
          : null,
    },
  ].filter(({ value }) => value != null && value !== '');

  return (
    <div className="bg-bg-main rounded-xl border border-border-main overflow-hidden shadow-card">
      <div className="px-6 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-12 pt-4 border-t border-border-subtle">
          {infoItems.map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <dt className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                {label}
              </dt>
              <dd className="text-sm font-bold text-text-main">
                {value}
              </dd>
            </div>
          ))}
          {item.description && (
            <div className="col-span-2 sm:col-span-3 space-y-1">
              <dt className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                Description
              </dt>
              <dd className="text-sm font-medium text-text-sub leading-relaxed">
                {item.description} 
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
