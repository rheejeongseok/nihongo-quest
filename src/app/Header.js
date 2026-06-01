'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import ClientThemeSelector from "./ClientThemeSelector";

export default function Header() {
  const pathname = usePathname();
  const [username, setUsername] = useState('니혼고마스터');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputName, setInputName] = useState('');
  const [mounted, setMounted] = useState(false);

  // 1. 컴포넌트 마운트 시 로컬스토리지 닉네임 로드
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
    }
  }, []);

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

        {/* 우측 유틸리티 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* ⚡ 실시간 Supabase 계정 동기화 닉네임 칩 */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="glass-neon-btn header-sync-chip"
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '800',
              borderRadius: '20px',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'linear-gradient(135deg, rgba(255,148,148,0.2) 0%, rgba(177,159,251,0.2) 100%)',
              color: 'var(--text-primary)',
              textShadow: '0 0 5px rgba(255,148,148,0.4)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            <span className="pulse-dot"></span>
            <span>☁️ {username}</span>
          </button>

          {/* 테마 셀렉터 */}
          <div className="header-theme-wrapper">
            <ClientThemeSelector />
          </div>
        </div>
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
            maxWidth: '460px',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'center',
            padding: '32px'
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
                  padding: '12px 16px',
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="outline-btn"
                style={{ padding: '10px 20px', fontSize: '0.85rem', flex: 1 }}
              >
                취소
              </button>
              <button 
                onClick={handleSaveUsername}
                className="glow-btn"
                style={{ padding: '10px 24px', fontSize: '0.85rem', flex: 1 }}
              >
                연동 적용 ➔
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
