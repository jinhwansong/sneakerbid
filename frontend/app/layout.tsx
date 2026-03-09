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
      <head>
        {/* F5 새로고침 시 테마 플래시 방지: CSS 로드 전에 테마 클래스 적용 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : (theme === 'system' || !theme) && sysDark ? 'dark' : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme
          disableTransitionOnChange
        >
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
