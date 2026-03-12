import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-5">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-text-muted/30 mb-4">404</p>
        <h1 className="text-xl font-bold text-text-main mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm text-text-muted mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-text-inverse hover:opacity-90 transition-opacity"
          >
            <Home size={18} />
            홈으로
          </Link>
          <Link
            href="/auction"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-main px-6 py-3 text-sm font-bold text-text-main hover:bg-bg-sub transition-colors"
          >
            <Search size={18} />
            경매 둘러보기
          </Link>
        </div>
      </div>
    </main>
  );
}
