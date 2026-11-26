import "./globals.css";
import "./dashboard.css";
import "./header.css";
import "./simple-ui.css";
import "./pages.css";

export const metadata = {
  title: "NihongoQuest | 일본어 공부 퀴즈 아레나",
  description:
    "4대 감성 테마와 함께 게임하듯 일본어 기초부터 JLPT까지 정복하는 최고급 학습 플랫폼",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "니혼고퀘스트"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#557c55"
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
        {/* 마이독 테마 글꼴. 글꼴 파일은 그 글꼴을 쓰는 테마일 때만 내려받습니다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="simple-ui" suppressHydrationWarning>
        <Header />
        <main className="app-main">{children}</main>
        <AppToast />
        <PwaInstallPrompt />
        <ModalDragController />
      </body>
    </html>
  );
}

// 헤더 컴포넌트 가져오기
import Header from "./Header";
import AppToast from "./AppToast";
import PwaInstallPrompt from "./PwaInstallPrompt";
import ModalDragController from "./ModalDragController";
