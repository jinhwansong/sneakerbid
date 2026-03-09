import Link from 'next/link';

interface AuctionNotFoundProps {
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AuctionNotFound({
  message = '경매를 찾을 수 없습니다.',
  backHref = '/me/auctions',
  backLabel = '내 경매로 돌아가기',
}: AuctionNotFoundProps) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main">
      <div className="max-w-6xl mx-auto px-5 py-8 md:py-16">
        <p className="text-text-muted">{message}</p>
        <Link
          href={backHref}
          className="text-sm text-text-main hover:underline mt-4 inline-block"
        >
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
