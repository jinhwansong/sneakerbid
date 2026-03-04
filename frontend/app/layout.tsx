import type { Metadata } from 'next';
import ThemeToggle from '@/components/common/ThemeToggle';
import { ThemeProvider } from 'next-themes';
import '@/style/globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GlobalToast from '@/components/common/GlobalToast';
import SSEReconnectBanner from '@/components/common/SSEReconnectBanner';
import GlobalLoadingIndicator from '@/components/common/GlobalLoadingIndicator';
import RootErrorBoundary from '@/components/common/RootErrorBoundary';
import QueryProvider from '@/components/providers/QueryProvider';
import { pretendard } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'LaceUp | 실시간 스니커즈 경매',
  description: 'Toss/KREAM 스타일의 실시간 스니커즈 경매 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <GlobalToast />
            <SSEReconnectBanner />
            <GlobalLoadingIndicator />
            <RootErrorBoundary>
              <div className="bg-bg-main">
                <Header />
                {children}
                <Footer />
              </div>
            </RootErrorBoundary>
            <ThemeToggle />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
