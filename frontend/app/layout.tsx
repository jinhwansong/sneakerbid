import type { Metadata } from "next";
import { Toast } from '@/components/common/Toast';
import "./globals.css";

export const metadata: Metadata = {
  title: "SNEAKERBID | 실시간 스니커즈 경매",
  description: "Toss/KREAM 스타일의 실시간 스니커즈 경매 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-pretendard">
        <Toast />
        {children}
      </body>
    </html>
  );
}
