'use client';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { THEMES, CONCEPTS, JLPT_REGISTRATION_LINKS, getStagesList } from '@/data/uiCatalog.mjs';

// 테마·컨셉 고르기: 지금 고른 항목을 보여 주는 버튼과, 누르면 펼쳐지는 목록
function DrawerSelect({ items, currentId, open, setOpen, onPick, color }) {
  const current = items.find(item => item.id === currentId);
  return (
    <div className="drawer-select">
      <button onClick={() => setOpen(!open)} className={`drawer-select-trigger${color ? ' themed' : ''}`} aria-expanded={open} style={color ? { '--select-color': color } : undefined}>
        <div className="drawer-select-current">
          <span className="drawer-select-emoji">{current?.emoji}</span>
          <span>{current?.name}</span>
        </div>
        <span className={`drawer-select-arrow${open ? ' open' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="fade-in drawer-select-list">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { onPick(item.id); setOpen(false); }}
              className={`drawer-select-option${currentId === item.id ? ' selected' : ''}`}
              aria-pressed={currentId === item.id}
            >
              <div className="drawer-select-option-name">
                <span className="drawer-select-option-emoji">{item.emoji}</span>
                <span>{item.name}</span>
              </div>
              {currentId === item.id && <span className="drawer-select-dot" style={item.color ? { '--dot-color': item.color } : undefined} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileDrawer({setIsDrawerOpen, setIsModalOpen, username, targetLevel, handleToggleTargetLevel, currentTheme, currentConcept, isDrawerThemeOpen, setIsDrawerThemeOpen, isDrawerConceptOpen, setIsDrawerConceptOpen, changeTheme, changeConcept, router, pathname}) {
  const close = () => setIsDrawerOpen(false);
  return createPortal(
    <div className="mobile-drawer-overlay fade-in" onClick={close}>
      <div className="mobile-drawer-content quest-drawer slide-left" onClick={(e) => e.stopPropagation()}>

        <div className="drawer-header">
          <span className="drawer-logo">NihongoQuest</span>
          <button onClick={close} className="drawer-close-btn" aria-label="메뉴 닫기">✕</button>
        </div>

        {/* 학습 계정 */}
        <div className="drawer-section">
          <span className="drawer-sec-label">☁️ 클라우드 동기화 계정</span>
          <button onClick={() => { close(); setIsModalOpen(true); }} className="glass-neon-btn drawer-sync-chip">
            <span className="pulse-dot"></span>
            <span>☁️ {username}</span>
          </button>
        </div>

        {/* 학습 등급 */}
        <div className="drawer-section spaced">
          <span className="drawer-sec-label">⚡ 글로벌 학습 등급</span>
          <div className="drawer-track-switch" role="group" aria-label="학습 트랙 선택">
            <button onClick={() => handleToggleTargetLevel('N1')} aria-pressed={targetLevel === 'N1'} className="drawer-track n1">⚡ N1 마스터</button>
            <button onClick={() => handleToggleTargetLevel('BEGINNER')} aria-pressed={targetLevel === 'BEGINNER'} className="drawer-track beginner">🌱 초보 스타터</button>
          </div>
        </div>

        <div className="drawer-section">
          <span className="drawer-sec-label">🎨 인터페이스 테마</span>
          <DrawerSelect items={THEMES} currentId={currentTheme} open={isDrawerThemeOpen} setOpen={setIsDrawerThemeOpen} onPick={changeTheme} color={THEMES.find(t => t.id === currentTheme)?.color} />
        </div>

        <div className="drawer-section spaced">
          <span className="drawer-sec-label">🕹️ 비주얼 컨셉 모드</span>
          <DrawerSelect items={CONCEPTS} currentId={currentConcept} open={isDrawerConceptOpen} setOpen={setIsDrawerConceptOpen} onPick={changeConcept} />
        </div>

        {/* 학습 도구 */}
        <div className="drawer-section spaced">
          <span className="drawer-sec-label">🛠️ 일본어 학습 도구</span>
          <nav className="drawer-nav">
            <a href="https://ja.dict.naver.com/#/main" target="_blank" rel="noopener noreferrer" className="drawer-nav-item tools-item dictionary">
              📖 네이버 일본어 사전 ➔
            </a>
            <a href="https://papago.naver.com/?sk=ja&tk=ko" target="_blank" rel="noopener noreferrer" className="drawer-nav-item tools-item papago">
              🦜 파파고 일-한 번역기 ➔
            </a>
            {JLPT_REGISTRATION_LINKS.map(link => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="drawer-nav-item tools-item" onClick={close}>
                📝 {link.label} ↗
              </a>
            ))}
            {targetLevel === 'BEGINNER' && <Link href="/?practiceWriting=1" className="drawer-nav-item tools-item" onClick={close}>
              🌱 문자 비법서·손글씨 연습 ➔
            </Link>}
          </nav>
        </div>

        {/* 아레나 바로 입장 */}
        <div className="drawer-section spaced">
          <span className="drawer-sec-label">🏟️ {targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 바로입장</span>
          <div className="drawer-arena-grid">
            {getStagesList(targetLevel).map((course, stageIndex) => (
              <button
                key={stageIndex}
                className="drawer-nav-item drawer-arena-item"
                style={{ '--course-color': course.color }}
                onClick={() => {
                  close();
                  window.dispatchEvent(new CustomEvent('open-arena-modal', { detail: { stageIndex, selectCourse: false } }));
                }}
              >
                {course.emoji} {course.title}
              </button>
            ))}
          </div>
        </div>

        {targetLevel === 'N1' && <div className="arena-practice-actions">
          <button className="outline-btn" onClick={() => { close(); router.push('/play/5?jlptLevel=N1&category=WORDLE'); }}>🧩 어휘 워들 복습</button>
        </div>}
        <div className="drawer-section wide-gap">
          <span className="drawer-sec-label">🧭 빠른 탐색 이동</span>
          <nav className="drawer-nav">
            <Link href="/" className={`drawer-nav-item ${pathname === '/' ? 'active' : ''}`} onClick={close}>
              🏠 메인 대시보드
            </Link>
            <a href="/wrong-notes" className={`drawer-nav-item ${pathname === '/wrong-notes' ? 'active' : ''}`} onClick={close}>
              📓 스마트 오답노트
            </a>
            <a href="/bookmarks" className={`drawer-nav-item ${pathname === '/bookmarks' ? 'active' : ''}`} onClick={close}>
              ⭐ 나의 비밀단어장
            </a>
          </nav>
        </div>

        <div className="drawer-footer">
          <p>오늘도 즐거운 일본어 모험! 🌸</p>
          <span className="version-label">v1.2 Premium Sync</span>
        </div>

      </div>
    </div>,
    document.body
  );
}
