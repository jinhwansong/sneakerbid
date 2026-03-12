import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '실시간 랭킹',
  description: '지금 이 시각 가장 핫한 스니커즈 경매를 확인하세요.',
  path: '/ranking',
});

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
