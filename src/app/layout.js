import "./globals.css";

export const metadata = {
  title: "NihongoQuest | 일본어 공부 퀴즈 아레나",
  description:
    "4대 감성 테마와 함께 게임하듯 일본어 기초부터 JLPT까지 정복하는 최고급 학습 플랫폼",
};

export default function RootLayout({ children }) {
  // 새로고침 시 로컬 스토리지에 저장된 테마를 불러와 깜빡임(Flicker) 없이 즉시 입히는 인라인 차단 스크립트
  const themeInitScript = `
    (function() {
      try {
        var savedTheme = localStorage.getItem('nihongo-theme') || 'zen';
        document.documentElement.setAttribute('data-theme', savedTheme);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Header />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </body>
    </html>
  );
}

// 헤더 컴포넌트 (테마 스위처 바인딩)
import ClientThemeSelector from "./ClientThemeSelector";

function Header() {
  return (
    <header className="header-glass">
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "76px",
        }}
      >
        {/* 로고 */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            color: "#ff6b6b",
          }}
        >
          <span style={{ fontSize: "1.8rem", animation: "pulse 3s infinite" }}>
            🌸
          </span>
          <span
            style={{
              fontSize: "1.4rem",
              fontWeight: "800",
              letterSpacing: "-0.5px",
            }}
          >
            Nihongo<span style={{ color: "var(--accent-color)" }}>Quest</span>
          </span>
        </a>

        {/* 오른쪽 네비게이션 및 테마 셀렉터 */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <nav
            style={{
              display: "flex",
              gap: "20px",
              fontWeight: "600",
              fontSize: "0.95rem",
            }}
          >
            <a
              href="/"
              style={{ color: "var(--text-primary)", textDecoration: "none" }}
            >
              메인
            </a>
            <a
              href="/wrong-notes"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
            >
              오답노트
            </a>
            <a
              href="/bookmarks"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
            >
              단어장
            </a>
          </nav>

          {/* 실시간 4대 테마 전환 셀렉터 */}
          <ClientThemeSelector />
        </div>
      </div>
    </header>
  );
}
