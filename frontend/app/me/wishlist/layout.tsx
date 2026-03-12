import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '찜 목록',
  description: '관심 경매를 모아보세요.',
  path: '/me/wishlist',
});

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
