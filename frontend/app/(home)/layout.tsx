import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '홈',
  description: '실시간 스니커즈 경매 플랫폼 LaceUp. 인기 경매와 실시간 지표를 확인하세요.',
  path: '/',
});

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
