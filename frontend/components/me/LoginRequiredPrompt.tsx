'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';

export default function LoginRequiredPrompt() {
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-main flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-sub font-medium mb-4">로그인이 필요합니다.</p>
        <Button onClick={() => router.push('/login')}>로그인하기</Button>
      </div>
    </main>
  );
}
