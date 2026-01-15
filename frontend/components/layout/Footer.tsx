import Link from 'next/link';

const footerLinks = [
  { label: '서비스 소개', href: '#' },
  { label: '이용약관', href: '#' },
  { label: '개인정보처리방침', href: '#' },
  { label: '고객센터', href: '#' },
];

const socialLinks = [
  { label: 'Instagram', href: '#' },
  { label: 'Kakao', href: '#' },
  { label: 'YouTube', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border-main bg-bg-main">
      <div className="max-w-7xl mx-auto px-5 py-16">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-lg font-black text-text-main tracking-tight">
                SNEAKER<span className="text-brand-primary">BID</span>
              </h2>
              <p className="text-xs text-text-muted mt-2">
                실시간 스니커즈 경매 플랫폼 · Guest-First UX
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-status-active animate-pulse" />
              <span className="text-[11px] font-bold text-text-muted">
                Simulation Engine Active
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-text-sub">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-text-main transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex gap-4 text-xs font-semibold text-text-muted">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-text-main transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-border-main/50 text-[11px] text-text-muted">
            <span>© 2026 SNEAKERBID. All rights reserved.</span>
            <span>본 프로젝트는 포트폴리오 용도로 제작되었습니다.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
