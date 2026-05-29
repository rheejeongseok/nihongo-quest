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

// 헤더 컴포넌트 가져오기
import Header from "./Header";
