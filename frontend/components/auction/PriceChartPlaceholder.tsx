import React from 'react';

export const PriceChartPlaceholder: React.FC = () => {
  return (
    <div className="w-full h-12 flex items-end gap-[2px] opacity-40 group-hover:opacity-100 transition-opacity">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="bg-brand-primary/30 w-full rounded-t-[1px]"
          style={{
            height: `${Math.max(20, Math.random() * 100)}%`,
          }}
        />
      ))}
    </div>
  );
};
