'use client';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { THEMES, CONCEPTS, JLPT_REGISTRATION_LINKS, getStagesList } from '@/data/uiCatalog.mjs';

export default function MobileDrawer({setIsDrawerOpen, setIsModalOpen, username, targetLevel, handleToggleTargetLevel, currentTheme, currentConcept, isDrawerThemeOpen, setIsDrawerThemeOpen, isDrawerConceptOpen, setIsDrawerConceptOpen, changeTheme, changeConcept, router, pathname}) {
return createPortal(
        <div className="mobile-drawer-overlay fade-in" onClick={() => setIsDrawerOpen(false)}>
          <div className="mobile-drawer-content quest-drawer slide-left" onClick={(e) => e.stopPropagation()}>
            
            {/* 드로워 헤더 */}
            <div className="drawer-header">
              <span className="drawer-logo">NihongoQuest</span>
              <button onClick={() => setIsDrawerOpen(false)} className="drawer-close-btn" aria-label="메뉴 닫기">✕</button>
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

            {/* ⚡ 글로벌 등급 차원 전환 섹션 (모바일) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">⚡ 글로벌 학습 등급</span>
              <div className="drawer-track-switch" role="group" aria-label="학습 트랙 선택" style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '2rem',
                padding: '3px',
                width: '100%',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <button
                  onClick={() => handleToggleTargetLevel('N1')}
                  aria-pressed={targetLevel === 'N1'}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0',
                    borderRadius: '1.5rem',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: targetLevel === 'N1' ? 'var(--accent-color, #00f0ff)' : 'transparent',
                    color: targetLevel === 'N1' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: targetLevel === 'N1' ? '0 2px 8px rgba(0, 240, 255, 0.4)' : 'none'
                  }}
                >
                  ⚡ N1 마스터
                </button>
                <button
                  onClick={() => handleToggleTargetLevel('BEGINNER')}
                  aria-pressed={targetLevel === 'BEGINNER'}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0',
                    borderRadius: '1.5rem',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                    background: targetLevel === 'BEGINNER' ? '#557c55' : 'transparent',
                    color: targetLevel === 'BEGINNER' ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: targetLevel === 'BEGINNER' ? '0 2px 8px rgba(85, 124, 85, 0.4)' : 'none'
                  }}
                >
                  🌱 초보 스타터
                </button>
              </div>
            </div>

            {/* 테마 셀렉터 섹션 (공간 효율을 극대화한 명품 커스텀 셀렉트박스 대개조) */}
            <div className="drawer-section">
              <span className="drawer-sec-label">🎨 인터페이스 테마</span>
              
              <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                {/* 1. 커스텀 셀렉트 트리거 바 */}
                <button
                  onClick={() => setIsDrawerThemeOpen(!isDrawerThemeOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: `1.5px solid ${THEMES.find(t => t.id === currentTheme)?.color || 'var(--card-border)'}`,
                    borderRadius: 'var(--custom-radius)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    boxShadow: `0 2px 10px rgba(0, 0, 0, 0.05), 0 0 8px ${THEMES.find(t => t.id === currentTheme)?.color}15`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{THEMES.find(t => t.id === currentTheme)?.emoji}</span>
                    <span>{THEMES.find(t => t.id === currentTheme)?.name}</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    opacity: 0.8,
                    transform: isDrawerThemeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                    display: 'inline-block'
                  }}>
                    ▼
                  </span>
                </button>

                {/* 2. 유려하게 슬라이드 드롭되는 테마 셀렉트 보드 */}
                {isDrawerThemeOpen && (
                  <div 
                    className="fade-in"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.375rem)',
                      left: 0,
                      right: 0,
                      background: 'var(--card-bg)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 'var(--custom-radius)',
                      boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.25)',
                      padding: '0.375rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      zIndex: 1100,
                      maxHeight: '16.5rem',
                      overflowY: 'auto'
                    }}
                  >
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          changeTheme(t.id);
                          setIsDrawerThemeOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.625rem 0.75rem',
                          background: currentTheme === t.id ? 'var(--bg-secondary)' : 'transparent',
                          border: '1px solid transparent',
                          borderRadius: 'calc(var(--custom-radius) - 4px)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'inherit',
                          fontWeight: currentTheme === t.id ? '700' : '500',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem' }}>{t.emoji}</span>
                          <span>{t.name}</span>
                        </div>
                        {currentTheme === t.id && (
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: t.color, 
                            borderRadius: '50%',
                            boxShadow: `0 0 6px ${t.color}`
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 비주얼 컨셉 셀렉터 섹션 (공간 효율을 극대화한 명품 커스텀 셀렉트박스 패밀리룩) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">🕹️ 비주얼 컨셉 모드</span>
              
              <div style={{ position: 'relative', marginTop: '0.375rem' }}>
                {/* 1. 커스텀 셀렉트 트리거 바 */}
                <button
                  onClick={() => setIsDrawerConceptOpen(!isDrawerConceptOpen)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 'var(--custom-radius)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{CONCEPTS.find(c => c.id === currentConcept)?.emoji}</span>
                    <span>{CONCEPTS.find(c => c.id === currentConcept)?.name}</span>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    opacity: 0.8,
                    transform: isDrawerConceptOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                    display: 'inline-block'
                  }}>
                    ▼
                  </span>
                </button>

                {/* 2. 유려하게 슬라이드 드롭되는 컨셉 셀렉트 보드 */}
                {isDrawerConceptOpen && (
                  <div 
                    className="fade-in"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.375rem)',
                      left: 0,
                      right: 0,
                      background: 'var(--card-bg)',
                      border: '1.5px solid var(--card-border)',
                      borderRadius: 'var(--custom-radius)',
                      boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.25)',
                      padding: '0.375rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      zIndex: 1100,
                      maxHeight: '16.5rem',
                      overflowY: 'auto'
                    }}
                  >
                    {CONCEPTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          changeConcept(c.id);
                          setIsDrawerConceptOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.625rem 0.75rem',
                          background: currentConcept === c.id ? 'var(--bg-secondary)' : 'transparent',
                          border: '1px solid transparent',
                          borderRadius: 'calc(var(--custom-radius) - 4px)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'inherit',
                          fontWeight: currentConcept === c.id ? '700' : '500',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem' }}>{c.emoji}</span>
                          <span>{c.name}</span>
                        </div>
                        {currentConcept === c.id && (
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: 'var(--accent-color)', 
                            borderRadius: '50%',
                            boxShadow: '0 0 6px var(--accent-color)'
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
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
                {JLPT_REGISTRATION_LINKS.map(link => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="drawer-nav-item tools-item" onClick={() => setIsDrawerOpen(false)}>
                    📝 {link.label} ↗
                  </a>
                ))}
                {targetLevel === 'BEGINNER' && <Link href="/?practiceWriting=1" className="drawer-nav-item tools-item" onClick={() => setIsDrawerOpen(false)}>
                  🌱 문자 비법서·손글씨 연습 ➔
                </Link>}
              </nav>
            </div>

            {/* 🏟️ N1 실전 아레나 바로입장 퀵 그리드 (모바일 전용) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">🏟️ {targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 바로입장</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginTop: '0.25rem' }}>
                {getStagesList(targetLevel).map((course, stageIndex) => ({
                  stageIndex, emoji: course.emoji, label: course.title,
                  bg: 'var(--bg-secondary)', color: course.color
                })).map(({ stageIndex, emoji, label, bg, color, full }) => (
                  <button
                    key={stageIndex}
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
                      window.dispatchEvent(new CustomEvent('open-arena-modal', {
                        detail: { stageIndex, selectCourse: false }
                      }));
                    }}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 네비게이션 메뉴 섹션 */}
            {targetLevel === 'N1' && <div className="arena-practice-actions">
              <button className="outline-btn" onClick={() => { setIsDrawerOpen(false); router.push('/play/5?jlptLevel=N1&category=WORDLE'); }}>🧩 어휘 워들 복습</button>
            </div>}
            <div className="drawer-section" style={{ marginTop: '16px' }}>
              <span className="drawer-sec-label">🧭 빠른 탐색 이동</span>
              <nav className="drawer-nav">
                <Link href="/" className={`drawer-nav-item ${pathname === '/' ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                  🏠 메인 대시보드
                </Link>
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
);
}
