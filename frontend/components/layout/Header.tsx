import { Button } from '@/components/common/Button';

export const Header = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-bg-main/80 backdrop-blur-md border-b border-border-main">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black tracking-tighter text-text-main">
            SNEAKER<span className="text-brand-primary">BID</span>
          </h1>
          <div className="hidden md:flex gap-6">
            {['경매', '거래내역', '랭킹', '이벤트'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-semibold text-text-sub hover:text-text-main transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-brand-primary/5 rounded-full border border-brand-primary/10 mr-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-active opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-active"></span>
            </span>
            <span className="text-[10px] font-bold text-brand-primary">SIMULATION ENGINE ACTIVE</span>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-0.5 mr-2">
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
              GUEST MODE
            </span>
            <span className="text-[10px] text-text-muted">
              입찰 내역은 브라우저에 임시 저장됩니다
            </span>
          </div>
          <Button
            variant="ghost"
            size="md"
            className="text-text-sub font-semibold"
          >
            로그인
          </Button>
        </div>
      </div>
    </nav>
  );
};
