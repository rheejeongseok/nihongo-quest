'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

const THEMES = [
  { id: 'zen', name: '젠 (Zen)', emoji: '🌸', color: '#557c55' },
  { id: 'cyber', name: '사이버 (Cyber)', emoji: '⚡', color: '#00f0ff' },
  { id: 'kawaii', name: '파스텔 (Kawaii)', emoji: '🍑', color: '#ff9494' },
  { id: 'academic', name: '클래식 (Classic)', emoji: '📜', color: '#1a4d80' }
];

export default function Header() {
  const pathname = usePathname();
  const [username, setUsername] = useState('니혼고마스터');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [inputName, setInputName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('zen');

  // 1. 컴포넌트 마운트 시 로컬스토리지 닉네임 및 테마 로드
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nihongo_quest_username');
      if (saved) {
        setUsername(saved);
        setInputName(saved);
      } else {
        localStorage.setItem('nihongo_quest_username', '니혼고마스터');
        setInputName('니혼고마스터');
      }

      const savedTheme = localStorage.getItem('nihongo-theme') || 'zen';
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // 1.2 모바일 드로워 오픈 시 뒷배경 바디 스크롤 고정 및 속성 마킹
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-drawer-open', 'true');
    } else {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-drawer-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-drawer-open');
    };
  }, [isDrawerOpen]);

  // 외부 클릭 시 학습도구 드롭다운 닫기 처리
  useEffect(() => {
    if (!isToolsOpen) return;
    const handleClose = () => setIsToolsOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isToolsOpen]);

  // 2. 닉네임 저장 및 새로고침 반영
  const handleSaveUsername = () => {
    const trimmed = inputName.trim();
    if (!trimmed) {
      alert("사용할 닉네임을 입력해 주세요!");
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('nihongo_quest_username', trimmed);
      setUsername(trimmed);
      setIsModalOpen(false);
      // 데이터가 새로 주입/로드되도록 즉시 페이지 새로고침
      window.location.reload();
    }
  };

  // 3. 테마 직접 변경 헬퍼
  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
      localStorage.setItem('nihongo-theme', themeId);
    }
  };

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

        {/* 네비게이션 칩 캡슐 (PC 전용) */}
        <nav className="header-nav pc-only">
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

        {/* 우측 유틸리티 영역 (PC 전용) */}
        <div className="header-btns pc-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* ⚡ 실시간 Supabase 계정 동기화 닉네임 칩 */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="header-premium-btn sync-chip"
          >
            <span className="pulse-dot"></span>
            <span>☁️ {username}</span>
          </button>

					{/* 🛠️ [PC 전용 설정 및 학습 도구 통합 드롭다운] */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="header-premium-btn"
              style={{
                borderColor: THEMES.find(t => t.id === currentTheme)?.color || 'var(--card-border)',
                boxShadow: isToolsOpen ? 'var(--neon-glow)' : 'none'
              }}
            >
              <span>🛠️ 설정 & 학습 도구</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
            </button>

            {isToolsOpen && (
              <div className="tools-dropdown fade-in" style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--custom-radius)',
                boxShadow: '0 0.75rem 1.875rem rgba(0,0,0,0.15)',
                padding: '0.875rem',
                minWidth: '15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                zIndex: 1000
              }}>
                {/* 테마 선택 섹션 */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>🎨</span> 인터페이스 테마
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => changeTheme(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          padding: '0.4375rem 0.375rem',
                          border: currentTheme === t.id ? `1.5px solid ${t.color}` : '1.5px solid var(--card-border)',
                          background: currentTheme === t.id ? 'var(--bg-secondary)' : 'transparent',
                          color: 'var(--text-primary)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.75rem',
                          fontWeight: currentTheme === t.id ? '900' : '600',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 구분선 */}
                <div style={{ height: '1.2px', background: 'var(--card-border)', opacity: 0.7 }}></div>

                {/* 일본어 학습 도구 섹션 */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>📖</span> 일본어 학습 도구
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <a 
                      href="https://ja.dict.naver.com/#/main" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tools-dropdown-item"
                      onClick={() => setIsToolsOpen(false)}
                    >
                      📖 네이버 일어사전 ➔
                    </a>
                    <a 
                      href="https://papago.naver.com/?sk=ja&tk=ko" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tools-dropdown-item"
                      onClick={() => setIsToolsOpen(false)}
                    >
                      🦜 파파고 일-한 번역 ➔
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🍔 모바일 전용 햄버거 메뉴 트리거 */}
        <button 
          onClick={() => setIsDrawerOpen(true)} 
          className="mobile-menu-trigger mobile-only"
          aria-label="메뉴 열기"
        >
          ☰
        </button>
      </div>

      {/* 🔮 [계정 동기화 닉네임 교체 모달] */}
      {isModalOpen && mounted && createPortal(
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
            maxWidth: '28.75rem',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>☁️</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px' }}>
              크로스 클라우드 동기화 계정
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.6' }}>
              고유 닉네임 하나만 입력하면 모바일 폰, 태블릿, PC 간에 나의 단어장과 오답노트가 **실시간으로 완전 공유 및 영구 백업**됩니다!
            </p>

            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="나만의 고유 닉네임 입력..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--custom-radius)',
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--card-border)',
                  color: 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveUsername();
                }}
              />
            </div>

            {/* 모달 버튼 */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="outline-btn"
                style={{ padding: '0.625rem 1.25rem', fontSize: '0.85rem', flex: 1 }}
              >
                취소
              </button>
              <button 
                onClick={handleSaveUsername}
                className="glow-btn"
                style={{ padding: '0.625rem 1.5rem', fontSize: '0.85rem', flex: 1 }}
              >
                연동 적용 ➔
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 🔮 [모바일 전용 사이드 드로워 메뉴] */}
      {isDrawerOpen && mounted && createPortal(
        <div className="mobile-drawer-overlay fade-in" onClick={() => setIsDrawerOpen(false)}>
          <div className="mobile-drawer-content slide-left" onClick={(e) => e.stopPropagation()}>
            
            {/* 드로워 헤더 */}
            <div className="drawer-header">
              <span className="drawer-logo">🌸 NihongoQuest</span>
              <button onClick={() => setIsDrawerOpen(false)} className="drawer-close-btn">✕</button>
            </div>

            {/* 동기화 계정 섹션 */}
            <div className="drawer-section">
              <span className="drawer-sec-label">☁️ 클라우드 동기화 계정</span>
              <button 
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsModalOpen(true);
                }}
                className="glass-neon-btn drawer-sync-chip"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--custom-radius)'
                }}
              >
                <span className="pulse-dot"></span>
                <span>☁️ {username}</span>
              </button>
            </div>

            {/* 테마 셀렉터 섹션 */}
            <div className="drawer-section">
              <span className="drawer-sec-label">🎨 인터페이스 테마</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.6875rem 0.5rem',
                      border: currentTheme === t.id ? `1.5px solid ${t.color}` : '1.5px solid var(--card-border)',
                      background: currentTheme === t.id ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.02)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--custom-radius)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      fontWeight: currentTheme === t.id ? '900' : '600',
                      transition: 'all 0.2s ease',
                      boxShadow: currentTheme === t.id ? `0 0 0.625rem ${t.color}20` : 'none'
                    }}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 유용한 학습 도구 섹션 (모바일 전용) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">🛠️ 일본어 학습 도구</span>
              <nav className="drawer-nav">
                <a 
                  href="https://ja.dict.naver.com/#/main" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="drawer-nav-item tools-item"
                  style={{
                    background: 'rgba(85, 124, 85, 0.04)',
                    border: '1.2px solid rgba(85, 124, 85, 0.15)',
                    color: 'var(--accent-color)'
                  }}
                >
                  📖 네이버 일본어 사전 ➔
                </a>
                <a 
                  href="https://papago.naver.com/?sk=ja&tk=ko" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="drawer-nav-item tools-item"
                  style={{
                    background: 'rgba(255, 179, 126, 0.04)',
                    border: '1.2px solid rgba(255, 179, 126, 0.15)',
                    color: '#ffb37e'
                  }}
                >
                  🦜 파파고 일-한 번역기 ➔
                </a>
              </nav>
            </div>

            {/* 🏟️ N1 실전 아레나 바로입장 퀵 그리드 (모바일 전용) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">🏟️ N1 실전 아레나 바로입장</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginTop: '0.25rem' }}>
                {[
                  { idx: 0, emoji: '🌸', label: '문자 정복', bg: 'rgba(255, 148, 148, 0.09)', color: '#ff9494' },
                  { idx: 1, emoji: '🍱', label: '어휘 마스터', bg: 'rgba(255, 179, 126, 0.09)', color: '#ffb37e' },
                  { idx: 2, emoji: '⚙️', label: '문법 조사', bg: 'rgba(166, 207, 152, 0.09)', color: '#a6cf98' },
                  { idx: 3, emoji: '🎧', label: '청해 배틀', bg: 'rgba(144, 180, 252, 0.09)', color: '#90b4fc' },
                  { idx: 4, emoji: '🧩', label: '단어 워들', bg: 'rgba(177, 159, 251, 0.09)', color: '#b19ffb', full: true },
                ].map(({ idx, emoji, label, bg, color, full }) => (
                  <button
                    key={idx}
                    className="drawer-nav-item"
                    style={{
                      padding: '0.625rem 0.5rem',
                      fontSize: '0.75rem',
                      justifyContent: 'center',
                      background: bg,
                      border: 'none',
                      color,
                      fontWeight: '800',
                      ...(full ? { gridColumn: '1 / 3' } : {})
                    }}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      window.dispatchEvent(new CustomEvent('open-arena-modal', { detail: { stageIndex: idx } }));
                    }}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 네비게이션 메뉴 섹션 */}
            <div className="drawer-section" style={{ marginTop: '16px' }}>
              <span className="drawer-sec-label">🧭 빠른 탐색 이동</span>
              <nav className="drawer-nav">
                <a href="/" className={`drawer-nav-item ${pathname === '/' ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                  🏠 메인 대시보드
                </a>
                <a href="/wrong-notes" className={`drawer-nav-item ${pathname === '/wrong-notes' ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                  📓 스마트 오답노트
                </a>
                <a href="/bookmarks" className={`drawer-nav-item ${pathname === '/bookmarks' ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                  ⭐ 나의 비밀단어장
                </a>
              </nav>
            </div>

            {/* 드로워 푸터 */}
            <div className="drawer-footer">
              <p>오늘도 즐거운 일본어 모험! 🌸</p>
              <span className="version-label">v1.2 Premium Sync</span>
            </div>

          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
