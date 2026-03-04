'use client';

import React, { useMemo, useState } from 'react';
import AuctionCard from '@/components/auction/AuctionCard';
import { Button } from '@/components/common/Button';
import Dropdown from '@/components/common/Dropdown';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/util/cn';
import { BRANDS, SIZES, SORT_OPTIONS } from '@/constants';
import VirtualizedList from '@/components/common/VirtualizedList';
import {
  useAuctionList,
  auctionListPagesToItems,
} from '@/hooks/query/useAuctionList';

export default function AuctionListPage() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useAuctionList({
    brand: selectedBrand,
    size: selectedSize,
    sort: sortBy,
  });

  const displayItems = auctionListPagesToItems(data);
  const itemRows = useMemo(() => {
    const rows: (typeof displayItems)[] = [];
    const chunkSize = 3;
    for (let i = 0; i < displayItems.length; i += chunkSize) {
      rows.push(displayItems.slice(i, i + chunkSize));
    }
    return rows;
  }, [displayItems]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrand((prev) => (prev === brand ? null : brand));
  };

  const handleSizeToggle = (size: number) => {
    setSelectedSize((prev) => (prev === size ? null : size));
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleFilterReset = () => {
    setSelectedBrand(null);
    setSelectedSize(null);
  };
  return (
    <>
      <main className="max-w-7xl mx-auto px-5 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
            경매 탐색
          </h1>
          <p className="text-text-sub font-medium">
            실시간으로 진행 중인 모든 스니커즈 경매를 확인하세요.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-10 sticky top-28 self-start overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">
                브랜드
              </h3>
              <div className="flex flex-wrap gap-2">
                {BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => handleBrandToggle(brand)}
                    className={cn(
                      'px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer',
                      selectedBrand === brand
                        ? 'bg-text-main text-bg-main border-text-main shadow-lg shadow-black/5'
                        : 'bg-bg-main text-text-sub border-border-main hover:border-text-muted',
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">
                사이즈 (mm)
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={cn(
                      'h-10 text-xs font-bold rounded-xl border transition-all cursor-pointer',
                      selectedSize === size
                        ? 'bg-text-main text-bg-main border-text-main shadow-lg shadow-black/5'
                        : 'bg-bg-main text-text-sub border-border-main hover:border-text-muted',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Filters Summary (Reset) */}
            {(selectedBrand || selectedSize) && (
              <button
                onClick={handleFilterReset}
                className="flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline underline-offset-4"
              >
                <X size={14} />
                필터 초기화
              </button>
            )}
          </aside>

          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-bold text-text-sub">
                전체{' '}
                <span className="text-text-main">{displayItems.length}</span>
                개
              </span>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden h-10 px-4 rounded-xl gap-2"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <SlidersHorizontal size={16} />
                  필터
                </Button>

                <Dropdown
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onSelect={handleSortChange}
                />
              </div>
            </div>

            <VirtualizedList
              data={itemRows}
              loading={isLoading || isFetchingNextPage}
              hasMore={hasNextPage ?? false}
              loadMore={() => fetchNextPage()}
              renderItem={(row, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                >
                  {row.map((item) => (
                    <AuctionCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            />

            
          </div>
        </div>
      </main>

      {isFilterOpen && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-bg-main rounded-t-[24px] sm:rounded-t-[32px] p-6 sm:p-8 flex flex-col gap-6 sm:gap-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-black text-text-main">필터</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 -mr-2 text-text-sub"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-8 sm:space-y-10">
              <div className="space-y-4">
                <h3 className="text-xs sm:text-sm font-bold text-text-main uppercase tracking-wider">
                  브랜드
                </h3>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => handleBrandToggle(brand)}
                      className={cn(
                        'px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl border transition-all',
                        selectedBrand === brand
                          ? 'bg-text-main text-bg-main border-text-main'
                          : 'bg-bg-main text-text-sub border-border-main',
                      )}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs sm:text-sm font-bold text-text-main uppercase tracking-wider">
                  사이즈
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={cn(
                        'h-9 sm:h-10 text-xs font-bold rounded-xl border transition-all',
                        selectedSize === size
                          ? 'bg-text-main text-bg-main border-text-main'
                          : 'bg-bg-main text-text-sub border-border-main',
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" fullWidth size="lg" onClick={handleFilterReset}>
                초기화
              </Button>
              <Button fullWidth size="lg" onClick={() => setIsFilterOpen(false)}>
                적용하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
