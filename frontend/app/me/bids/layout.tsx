import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '내 입찰',
  description: '입찰중·낙찰·유찰 내역을 확인하세요.',
  path: '/me/bids',
});

export default function MyBidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
