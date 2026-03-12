import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '거래 내역',
  description: '내 경매 낙찰·유찰·판매 완료 내역을 확인하세요.',
  path: '/history',
});

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
