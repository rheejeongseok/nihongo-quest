'use client';

import { useEffect, useState } from 'react';
import { showToast } from '@/lib/toast';

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsInstalled(standalone);
    setIsIos(ios);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('서비스 워커 등록 실패:', error);
      });
    }

    const handleInstallPrompt = event => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsInstalled(false);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      showToast('니혼고퀘스트가 앱으로 설치되었습니다! 🌸');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled || (!installPrompt && !isIos)) return null;

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
      return;
    }

    showToast('Safari의 공유 버튼을 누른 뒤 “홈 화면에 추가”를 선택하세요.');
  };

  return (
    <button
      type="button"
      className="pwa-install-button"
      onClick={handleInstall}
      aria-label="니혼고퀘스트 앱 설치"
    >
      <span aria-hidden="true">📲</span>
      {isIos ? '홈 화면에 추가' : '앱으로 설치'}
    </button>
  );
}
