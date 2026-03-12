import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '내 프로필',
  description: '계정 정보와 활동 현황을 확인하세요.',
  path: '/me',
});

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
