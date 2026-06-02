'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { getExampleSentence } from '@/utils/exampleSentences';

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const { speak } = useJapaneseSpeech();

  // ⚡ 스마트 크로스 동기화 상태
  const [backupCode, setBackupCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSyncHubExpanded, setIsSyncHubExpanded] = useState(false); // 👈 접기 토글 상태 추가

  // 🍿 상세 예문 모달 상태
  const [selectedWord, setSelectedWord] = useState(null);
  const [mounted, setMounted] = useState(false);

  // --- 🗂️ 3D 플래시 카드 상태 관리 ---
  const [isFlashCardMode, setIsFlashCardMode] = useState(false);
  const [cardQueue, setCardQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [memorizedIds, setMemorizedIds] = useState([]);
  const [sessionTotalCount, setSessionTotalCount] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 플래시 카드 모드 온오프 처리
  const handleToggleFlashcardMode = (enable) => {
    if (enable) {
      if (bookmarks.length === 0) {
        alert("암기할 단어가 없습니다! 먼저 단어를 추가해 주세요.");
        return;
      }
      // 단어장 단어 셔플하여 큐 생성
      const shuffled = [...bookmarks].sort(() => Math.random() - 0.5);
      setCardQueue(shuffled);
      setCurrentCardIndex(0);
      setCardFlipped(false);
      setMemorizedIds([]);
      setSessionTotalCount(shuffled.length);
      setIsFlashCardMode(true);
    } else {
      setIsFlashCardMode(false);
    }
  };

  // 카드 뒤집기
  const handleCardClick = () => {
    const nextFlipped = !cardFlipped;
    setCardFlipped(nextFlipped);
    
    // 뒤집어서 뒷면(뜻/예문)이 보일 때 자동으로 TTS 음성 출력 연동
    if (nextFlipped && cardQueue[currentCardIndex]) {
      speak(cardQueue[currentCardIndex].word);
    }
  };

  // 파티클 생성 함수 (미세 폭죽 연출)
  const spawnParticles = (clientX, clientY) => {
    const emojis = ['💚', '✨', '🎉', '🍀', '🌸', '💫'];
    const newParticles = Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      return {
        id: Date.now() + i + Math.random(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: clientX || window.innerWidth / 2,
        y: clientY || window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // 약간 위로 솟구치게
        alpha: 1,
        scale: Math.random() * 0.7 + 0.6
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
  };

  // 파티클 프레임 업데이트 효과
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.35, // 중력
            alpha: p.alpha - 0.03
          }))
          .filter(p => p.alpha > 0)
      );
    }, 25);
    return () => clearInterval(timer);
  }, [particles]);

  // 완벽히 외웠음! 처리
  const handleMemorized = (e) => {
    e.stopPropagation();
    if (!cardQueue[currentCardIndex]) return;
    
    // 마우스 클릭 위치 구해서 폭죽 터뜨리기
    const clientX = e.clientX;
    const clientY = e.clientY;
    spawnParticles(clientX, clientY);

    const currentWord = cardQueue[currentCardIndex];
    if (!memorizedIds.includes(currentWord.id)) {
      setMemorizedIds(prev => [...prev, currentWord.id]);
    }

    // 카드 초기화 후 다음 카드로 진행
    setCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(prev => prev + 1);
    }, 250); // 부드러운 전환을 위한 딜레이
  };

  // 아직 헷갈림! 처리
  const handleConfused = (e) => {
    e.stopPropagation();
    if (!cardQueue[currentCardIndex]) return;

    const currentWord = cardQueue[currentCardIndex];
    // 해당 단어를 큐 맨 뒤에 다시 이관하여 반복 훈련 처리
    setCardQueue(prev => [...prev, currentWord]);
    
    // 카드 초기화 후 다음 카드로 진행
    setCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(prev => prev + 1);
    }, 250);
  };

  const getSyncHeaders = (extra = {}) => {
    const username = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
    return {
      'x-nihongo-username': encodeURIComponent(username),
      ...extra
    };
  };

  // 1. 단어장 단어 로드
  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch('/api/bookmarks', {
          headers: getSyncHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.bookmarks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  // 2. 단어 삭제 처리
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { 
        method: 'DELETE',
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 📥 [EXPORT] 단어장 백업 코드 생성 및 클립보드 복사
  const handleExportCode = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/sync?type=bookmarks', {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success && data.backupCode) {
        setBackupCode(data.backupCode);
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.backupCode);
          showToast("단어장 백업 코드가 복사되었습니다! 📋");
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = data.backupCode;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          showToast("단어장 백업 코드가 복사되었습니다! 📋");
        }
      } else {
        alert("백업 코드 생성 실패: " + (data.error || "데이터가 없습니다."));
      }
    } catch (e) {
      alert("백업 네트워크 에러: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  // 📤 [IMPORT] 붙여넣은 백업 코드로 단어장 스마트 병합
  const handleImportCode = async () => {
    if (!inputCode.trim()) {
      alert("주입할 단어장 백업 코드를 입력해 주세요!");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/sync?type=bookmarks', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ backupCode: inputCode.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setInputCode('');
        alert(`🎉 단어장 병합 완료!\n신규 단어 ${data.addedCount}개가 정상적으로 추가 통합되었습니다!`);
        window.location.reload();
      } else {
        alert("주입 실패: " + data.error);
      }
    } catch (e) {
      alert("주입 네트워크 에러: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  // 📄 [FILE EXPORT] 단어장 JSON 파일 다운로드
  const handleJsonExport = async () => {
    try {
      const res = await fetch('/api/sync?type=bookmarks', {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success && data.rawJson) {
        const jsonStr = JSON.stringify(data.rawJson, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nihongo_quest_vocabulary_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("단어장 JSON 파일이 다운로드되었습니다! 💾");
      } else {
        alert("백업 파일 추출 실패");
      }
    } catch (e) {
      alert("파일 백업 에러: " + e.message);
    }
  };

  // 📄 [FILE IMPORT] 단어장 JSON 파일 선택 주입
  const handleJsonImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target.result);
        setImporting(true);
        const res = await fetch('/api/sync?type=bookmarks', {
          method: 'POST',
          headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ rawJson })
        });
        const data = await res.json();
        if (data.success) {
          alert(`🎉 파일 병합 성공!\n신규 단어 ${data.addedCount}개가 단어장에 통합되었습니다!`);
          window.location.reload();
        } else {
          alert("파일 주입 실패: " + data.error);
        }
      } catch (parseErr) {
        alert("올바르지 않은 단어장 JSON 파일 형식입니다.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>⭐</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>단어장을 열고 정렬하는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1280px', padding: '40px 24px' }}>
      
      {/* 뒤로가기 및 헤더 */}
      <div style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div>
          <h1 style={{ fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            ⭐ 나의 일본어 단어장 (Vocabulary)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            퀴즈 도중 눈에 띈 어려운 단어들을 나만의 비밀 단어장에 모으고 소리내어 복습하는 공간
          </p>
        </div>
        
        {/* 🗂️ 3D 플래시 카드 암기 모드 토글 */}
        {bookmarks.length > 0 && (
          <div className="flashcard-toggle-wrapper glass-premium-card" style={{ 
            padding: '12px 20px', 
            borderRadius: '16px', 
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              🗂️ 3D 플래시 카드 암기 모드
            </span>
            <label className="flashcard-switch">
              <input 
                type="checkbox" 
                checked={isFlashCardMode} 
                onChange={(e) => handleToggleFlashcardMode(e.target.checked)} 
              />
              <span className="flashcard-slider"></span>
            </label>
          </div>
        )}
      </div>

      {isFlashCardMode ? (
        /* ==========================================
           🗂️ 3D 플래시 카드 암기 모드 컨텐츠
           ========================================== */
        <div className="flashcard-mode-section fade-in" style={{ paddingBottom: '60px' }}>
          
          {/* 1. 진행 스탯 바 */}
          <div className="flashcard-progress-container glass-premium-card" style={{ padding: '20px 24px', borderRadius: '16px', marginBottom: '24px' }}>
            <div className="flashcard-stat-text">
              <span>🚀 JLPT N1 단어 완벽 소탕 진행중</span>
              <span style={{ color: 'var(--accent-color)' }}>
                {memorizedIds.length} / {sessionTotalCount} 개 암기 완료 ({sessionTotalCount > 0 ? Math.round((memorizedIds.length / sessionTotalCount) * 100) : 0}%)
              </span>
            </div>
            <div className="flashcard-progress-bar-bg">
              <div 
                className="flashcard-progress-bar-fill" 
                style={{ width: `${sessionTotalCount > 0 ? (memorizedIds.length / sessionTotalCount) * 100 : 0}%` }}
              ></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0 0 0', textAlign: 'center' }}>
              완벽히 외운 단어는 영구 제외되며, 헷갈리는 단어는 큐의 맨 뒤로 이동해 무한 순환합니다.
            </p>
          </div>

          {currentCardIndex < cardQueue.length ? (
            /* 훈련 진행 중 */
            <div>
              {/* 3D 카드 영역 */}
              <div className="flashcard-container">
                <div 
                  className={`flashcard ${cardFlipped ? 'flipped' : ''}`}
                  onClick={handleCardClick}
                >
                  {/* 앞면: 단어명 & 읽기 */}
                  <div className="flashcard-face flashcard-front">
                    <span className="flashcard-tag">JLPT N1 VOCAB</span>
                    
                    <div style={{ textAlign: 'center' }}>
                      <h2 className="flashcard-word">{cardQueue[currentCardIndex].word}</h2>
                      <p className="flashcard-reading">「{cardQueue[currentCardIndex].reading}」</p>
                    </div>

                    <div className="flashcard-hint-text">
                      <span>💡 탭하여 의미 및 예문 확인</span>
                    </div>
                  </div>

                  {/* 뒷면: 한글 뜻 & 문장 예문 */}
                  <div className="flashcard-face flashcard-back" onClick={(e) => e.stopPropagation()}>
                    <span className="flashcard-tag" style={{ color: '#ffb37e', borderColor: 'rgba(255,179,126,0.3)', background: 'rgba(255,179,126,0.1)' }}>
                      MEANING & EXAMPLE
                    </span>

                    <div style={{ width: '100%', textAlign: 'center', marginTop: '10px' }}>
                      <h3 className="flashcard-meaning">{cardQueue[currentCardIndex].meaning}</h3>
                      <button 
                        onClick={() => speak(cardQueue[currentCardIndex].word)}
                        className="outline-btn"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', margin: '8px auto 0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        🔊 발음 재생
                      </button>
                    </div>

                    {/* 실전 예문 */}
                    <div className="flashcard-example-box">
                      <p className="flashcard-example-jp">
                        {getExampleSentence(cardQueue[currentCardIndex].word, cardQueue[currentCardIndex].meaning).sentence}
                      </p>
                      <p className="flashcard-example-kr">
                        {getExampleSentence(cardQueue[currentCardIndex].word, cardQueue[currentCardIndex].meaning).translation}
                      </p>
                      <button
                        onClick={() => speak(getExampleSentence(cardQueue[currentCardIndex].word, cardQueue[currentCardIndex].meaning).sentence)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-color)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          marginTop: '6px',
                          textDecoration: 'underline'
                        }}
                      >
                        🔊 예문 듣기
                      </button>
                    </div>

                    <div className="flashcard-hint-text" style={{ animation: 'none', cursor: 'pointer' }} onClick={handleCardClick}>
                      <span>👈 카드를 다시 뒤집기</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제어 버튼 영역 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', maxWidth: '580px', margin: '0 auto' }}>
                <button 
                  onClick={handleConfused}
                  className="outline-btn"
                  style={{ 
                    flex: 1, 
                    padding: '16px 24px', 
                    borderRadius: '16px', 
                    fontSize: '1rem', 
                    fontWeight: '800',
                    color: '#ffb37e',
                    borderColor: 'rgba(255, 179, 126, 0.4)',
                    background: 'rgba(255, 179, 126, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(255, 179, 126, 0.1)'
                  }}
                >
                  🧡 아직 헷갈림 (순환 학습)
                </button>

                <button 
                  onClick={handleMemorized}
                  className="glow-btn"
                  style={{ 
                    flex: 1, 
                    padding: '16px 24px', 
                    borderRadius: '16px', 
                    fontSize: '1rem', 
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                    boxShadow: '0 4px 20px rgba(46, 204, 113, 0.3)',
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  💚 완벽히 외웠음 (큐 제거)
                </button>
              </div>
            </div>
          ) : (
            /* 훈련 종료 세션 */
            <div className="premium-card fade-in" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '580px', margin: '40px auto' }}>
              <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '20px', animation: 'bounceSlow 2s infinite' }}>🏆</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px', color: 'var(--accent-color)' }}>
                단어장 완벽 소탕 완료!
              </h2>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: '700', marginBottom: '24px' }}>
                축하합니다! 현재 단어장에 등록된 모든 단어를 완벽히 암기하셨습니다.
              </p>

              <div className="glass-premium-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '32px', textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-secondary)' }}>📊 학습 세션 레포트</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                  <span>고유 단어 수</span>
                  <span style={{ fontWeight: '700' }}>{sessionTotalCount} 개</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                  <span>헷갈림 극복 추가 훈련</span>
                  <span style={{ fontWeight: '700', color: '#ffb37e' }}>{cardQueue.length - sessionTotalCount} 회</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid var(--card-border)', paddingTop: '10px', marginTop: '10px' }}>
                  <span style={{ fontWeight: '800' }}>최종 암기 성공률</span>
                  <span style={{ fontWeight: '800', color: '#2ecc71' }}>100% (만점 보장)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleToggleFlashcardMode(true)} 
                  className="glow-btn"
                  style={{ flex: 1.2, padding: '14px 24px', fontSize: '0.95rem' }}
                >
                  🔄 다시 훈련하기
                </button>
                <button 
                  onClick={() => setIsFlashCardMode(false)} 
                  className="outline-btn"
                  style={{ flex: 1, padding: '14px 24px', fontSize: '0.95rem' }}
                >
                  📖 단어 리스트로 가기
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ==========================================
           📖 기존 단어장 목록 및 동기화 허브
           ========================================== */
        <>
          {/* ⚡ 단어장 전용 크로스 동기화 센터 */}
          <div className="glass-premium-card rainbow-border sync-hub-premium-card" style={{ marginBottom: '32px' }}>
            <div 
              className={isSyncHubExpanded ? "sync-hub-header expanded" : "sync-hub-header"}
              onClick={() => setIsSyncHubExpanded(!isSyncHubExpanded)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="sync-hub-icon">⭐</span>
                <div className="sync-hub-title-box">
                  <h3 className="sync-hub-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    단어장 데이터 동기화 센터
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px', background: isSyncHubExpanded ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)', color: isSyncHubExpanded ? '#2ecc71' : '#f1c40f', fontWeight: '800' }}>
                      {isSyncHubExpanded ? "펼침" : "접힘"}
                    </span>
                  </h3>
                  <p className="sync-hub-desc" style={{ margin: '4px 0 0 0' }}>폰과 컴퓨터를 오가며 나만의 비밀 단어장 데이터를 추출하고 중복 없이 머지(Merge)하세요!</p>
                </div>
              </div>
              <span style={{ fontSize: '0.9rem', transition: 'transform 0.3s ease', transform: isSyncHubExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-secondary)', paddingRight: '8px' }}>
                ▼
              </span>
            </div>

            {isSyncHubExpanded && (
              <div className="sync-hub-grid" style={{ marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '20px', animation: 'fadeIn 0.3s ease' }}>
                {/* 백업 */}
                <div className="sync-hub-section export-section">
                  <h4 className="sync-section-title">📤 단어장 백업 코드 추출</h4>
                  <p className="sync-section-desc">현재 단어 데이터를 텍스트 코드로 압축 복사하거나 파일로 다운로드합니다.</p>
                  <div className="sync-action-buttons">
                    <button onClick={handleExportCode} disabled={exporting} className="glass-neon-btn export-code-btn">
                      {exporting ? "⏳ 코드 생성 중..." : "📋 백업 코드 복사"}
                    </button>
                    <button onClick={handleJsonExport} className="outline-btn file-export-btn">
                      💾 JSON 파일 저장
                    </button>
                  </div>
                  {backupCode && (
                    <div className="backup-code-preview fade-in">
                      <span className="code-label">생성된 백업 코드:</span>
                      <input 
                        type="text" 
                        readOnly 
                        value={backupCode} 
                        onClick={(e) => {
                          e.target.select();
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(backupCode);
                            showToast("코드가 다시 복사되었습니다! 📋");
                          }
                        }}
                        className="backup-code-input"
                      />
                    </div>
                  )}
                </div>

                {/* 주입 */}
                <div className="sync-hub-section import-section">
                  <h4 className="sync-section-title">📥 다른 기기 단어장 가져오기</h4>
                  <p className="sync-section-desc">다른 기기에서 복사한 단어장 코드를 입력하거나 파일을 올려서 중복 없이 병합합니다.</p>
                  <div className="import-inputs-wrapper">
                    <div className="code-import-box">
                      <input 
                        type="text"
                        placeholder="단어장 백업 코드를 붙여넣으세요..."
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        className="sync-import-text-input"
                      />
                      <button onClick={handleImportCode} disabled={importing || !inputCode.trim()} className="glass-neon-btn import-code-action-btn">
                        {importing ? "⏳ 병합 중..." : "⚡ 코드 주입"}
                      </button>
                    </div>
                    <div className="file-import-box">
                      <span className="file-import-label">JSON 백업 파일 복구:</span>
                      <label className="file-upload-custom-btn">
                        📁 파일 선택...
                        <input type="file" accept=".json" onChange={handleJsonImport} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {bookmarks.length === 0 ? (
            /* 단어장이 비어 있을 때의 웰컴 카드 */
            <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
              <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '16px' }}>📖</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>단어장이 비어 있습니다!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                퀴즈 플레이 도중 마음에 드는 단어나 헷갈리는 문자를 보면 <strong>[나의 단어장 추가]</strong>를 꾹 눌러보세요.
              </p>
              <Link href="/" passHref legacyBehavior>
                <a className="glow-btn" style={{ padding: '12px 30px', textDecoration: 'none' }}>
                  퀴즈 풀고 단어 수집하러 가기 ➔
                </a>
              </Link>
            </div>
          ) : (
            /* 단어장 리스트 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ borderBottom: '1.5px solid var(--card-border)', paddingBottom: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                  저장된 소중한 영단어/일어단어: 총 {bookmarks.length}개
                </span>
              </div>

              <div className="vocabulary-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {bookmarks.map((item) => (
                  <div 
                    key={item.id} 
                    className="premium-card wrong-note-card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '20px 24px',
                      minHeight: '110px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setSelectedWord(item)}
                  >
                    <div>
                      {/* 단어의 요미가나 표기 */}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        {item.reading}
                      </span>
                      
                      {/* 단어 본문 */}
                      <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {item.word}
                      </h4>
                      
                      {/* 단어 뜻 */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700', marginTop: '6px' }}>
                        {item.meaning}
                      </p>
                    </div>

                    {/* 제어 버튼 */}
                    <div className="wrong-btn-actions" 
                      style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()} // 💡 모달 팝업 버블링 차단!
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // 💡 버블링 차단!
                          speak(item.word);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--card-border)',
                          color: 'var(--text-primary)',
                          borderRadius: 'var(--custom-radius)',
                          cursor: 'pointer',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        🔊 재생
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // 💡 버블링 차단!
                          handleDelete(item.id);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: 'rgba(255, 107, 107, 0.08)',
                          border: '1px solid rgba(255, 107, 107, 0.2)',
                          color: '#ff6b6b',
                          borderRadius: 'var(--custom-radius)',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        🗑️ 제거
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}
        </>
      )}

      {/* 🔮 동기화 피드백용 플로팅 토스트 메시지 연출 */}
      {toastMessage && (
        <div className="sync-toast-message-floating fade-in">
          <span className="sync-toast-icon">📢</span>
          <span className="sync-toast-text">{toastMessage}</span>
        </div>
      )}

      {/* 🔮 [단어 디테일 예문 보기 프리미엄 모달] */}
      {selectedWord && mounted && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="premium-card animate-scale modal-premium-content" style={{
            maxWidth: '520px',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'left',
            padding: '36px',
            position: 'relative'
          }}>
            {/* 상단 닫기 아이콘 */}
            <button 
              onClick={() => setSelectedWord(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: '900'
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
              ⭐ 단어 상세 정보
            </span>

            {/* 일본어 표기 및 요미가나 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                {selectedWord.word}
              </h2>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                [{selectedWord.reading}]
              </span>
            </div>

            {/* 한글 뜻 */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              borderLeft: '4px solid var(--accent-color)',
              marginBottom: '24px' 
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>
                한글 의미
              </span>
              <p style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: '800', margin: '4px 0 0 0' }}>
                {selectedWord.meaning}
              </p>
            </div>

            {/* 🍱 찰떡 매칭 예시 문장 영역 */}
            <div style={{
              background: 'rgba(255, 179, 126, 0.05)',
              border: '1px solid rgba(255, 179, 126, 0.25)',
              borderRadius: 'var(--custom-radius)',
              padding: '20px',
              marginBottom: '28px'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#ffb37e', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                📝 학습용 실전 예시 문장
              </span>
              
              {/* 일본어 예문 */}
              <p style={{ 
                fontSize: '1.1rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                lineHeight: '1.6',
                marginBottom: '10px',
                wordBreak: 'break-all'
              }}>
                {getExampleSentence(selectedWord.word, selectedWord.meaning).sentence}
              </p>

              {/* 한국어 번역 */}
              <p style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'var(--text-secondary)', 
                lineHeight: '1.5',
                margin: 0
              }}>
                {getExampleSentence(selectedWord.word, selectedWord.meaning).translation}
              </p>
            </div>

            {/* 하단 제어 버튼 모음 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => speak(selectedWord.word)}
                className="outline-btn"
                style={{ padding: '12px 20px', fontSize: '0.9rem', flex: 1, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
              >
                🔊 단어 듣기
              </button>
              
              <button 
                onClick={() => speak(getExampleSentence(selectedWord.word, selectedWord.meaning).sentence)}
                className="glow-btn"
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '0.9rem', 
                  flex: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, #ff9494 100%)'
                }}
              >
                📢 예문 전체 듣기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🎆 미세 폭죽 파티클 애니메이션 레이어 */}
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.x}px`,
            top: `${p.y}px`,
            fontSize: '1.5rem',
            pointerEvents: 'none',
            transform: `translate(-50%, -50%) scale(${p.scale})`,
            opacity: p.alpha,
            zIndex: 99999,
            transition: 'opacity 0.05s ease-out'
          }}
        >
          {p.emoji}
        </span>
      ))}

    </div>
  );
}
