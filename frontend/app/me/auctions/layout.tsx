import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '내 경매',
  description: '등록한 경매 목록을 확인하고 수정·삭제할 수 있습니다.',
  path: '/me/auctions',
});

export default function MyAuctionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
