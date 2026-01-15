import type { Metadata } from "next";
import { Toast } from '@/components/common/Toast';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { ThemeProvider } from 'next-themes';
import "@/style/globals.css";
import { Header } from "@/components/layout/Header";
import { OnboardingModal } from "@/components/features/OnboardingModal";
import Footer from "@/components/layout/Footer";

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
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-pretendard">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toast />
          <OnboardingModal />
          <div className="bg-bg-main">
            <Header />
            {children}
            <Footer />
          </div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
