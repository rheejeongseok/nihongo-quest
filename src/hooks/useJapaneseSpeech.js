'use client';

import { useCallback, useState, useEffect } from 'react';

export function useJapaneseSpeech() {
  const [voice, setVoice] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // 일본어 목소리(ja-JP) 우선 매핑
      const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
      setVoice(jpVoice || null);
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback((text, rate = 0.85) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn("이 브라우저는 음성 합성을 지원하지 않습니다.");
      return;
    }

    // 재생 중인 기존 음성 정지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = rate; // 학습 편의를 위해 약간 느리고 선명하게 발음
    
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }, [voice]);

  return { speak, hasSupport: typeof window !== 'undefined' && 'speechSynthesis' in window };
}
