'use client';

import { usePathname } from 'next/navigation';
import ClientThemeSelector from "./ClientThemeSelector";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header-glass">
      <div className="container header-container">
        {/* 그라데이션 프리미엄 로고 */}
        <a href="/" className="header-logo">
          <span className="logo-emoji">🌸</span>
          <span className="logo-text">
            Nihongo<span className="logo-highlight">Quest</span>
          </span>
        </a>

        {/* 네비게이션 칩 캡슐 */}
        <nav className="header-nav">
          <a 
            href="/" 
            className={`nav-item ${pathname === '/' ? 'active' : ''}`}
          >
            메인
          </a>
          <a 
            href="/wrong-notes" 
            className={`nav-item ${pathname === '/wrong-notes' ? 'active' : ''}`}
          >
            오답노트
          </a>
          <a 
            href="/bookmarks" 
            className={`nav-item ${pathname === '/bookmarks' ? 'active' : ''}`}
          >
            단어장
          </a>
        </nav>

        {/* 테마 셀렉터 */}
        <div className="header-theme-wrapper">
          <ClientThemeSelector />
        </div>
      </div>
    </header>
  );
}
