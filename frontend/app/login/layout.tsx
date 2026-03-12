import { createMetadata } from '@/lib/constants/metadata';

export const metadata = createMetadata({
  title: '로그인',
  description: 'Google 또는 카카오로 로그인하여 경매에 참여하세요.',
  path: '/login',
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
