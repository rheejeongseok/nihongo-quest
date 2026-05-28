'use client';

import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'zen', name: '젠 (Zen)', emoji: '🌸', color: '#557c55' },
  { id: 'cyber', name: '사이버 (Cyber)', emoji: '⚡', color: '#00f0ff' },
  { id: 'kawaii', name: '파스텔 (Kawaii)', emoji: '🍑', color: '#ff9494' },
  { id: 'academic', name: '클래식 (Classic)', emoji: '📜', color: '#1a4d80' }
];

export default function ClientThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState('zen');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('nihongo-theme') || 'zen';
    setCurrentTheme(savedTheme);
  }, []);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('nihongo-theme', themeId);
    setIsOpen(false);
  };

  const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* 셀렉터 버튼 */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="outline-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderColor: activeTheme.color,
          fontSize: '0.9rem',
          borderRadius: 'var(--custom-radius)',
          cursor: 'pointer'
        }}
      >
        <span>{activeTheme.emoji}</span>
        <span style={{ fontWeight: '700' }}>{activeTheme.name}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--custom-radius)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '6px',
          minWidth: '150px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 1000
        }}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => changeTheme(theme.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: currentTheme === theme.id ? 'var(--bg-secondary)' : 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: currentTheme === theme.id ? '700' : '500',
                borderRadius: 'calc(var(--custom-radius) - 6px)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentTheme !== theme.id) e.target.style.background = 'rgba(0,0,0,0.03)';
              }}
              onMouseLeave={(e) => {
                if (currentTheme !== theme.id) e.target.style.background = 'transparent';
              }}
            >
              <span>{theme.emoji}</span>
              <span>{theme.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
