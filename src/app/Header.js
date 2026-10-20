'use client';

import { useState, useEffect } from 'react';
import MobileDrawer from './components/MobileDrawer';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { JLPT_REGISTRATION_LINKS, THEMES, CONCEPTS, getStagesList } from '@/data/uiCatalog.mjs';
import AccountModal from './components/AccountModal';
import ArenaEntryModal from './components/ArenaEntryModal';
import { showToast } from '@/lib/toast';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('니혼고마스터');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerThemeOpen, setIsDrawerThemeOpen] = useState(false);
  const [isDrawerConceptOpen, setIsDrawerConceptOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [inputName, setInputName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('zen');
  const [currentConcept, setCurrentConcept] = useState('glass');

  // 🏟️ 글로벌 아레나 모달 상태
  const [selectedStage, setSelectedStage] = useState(null);
  const [showCourseSelection, setShowCourseSelection] = useState(true);
  const [chosenDifficulty, setChosenDifficulty] = useState('EASY');

  // ⚡ 글로벌 등급 차원 전환 상태
  const [targetLevel, setTargetLevel] = useState('N1');

  // 1. 컴포넌트 마운트 시 로컬스토리지 닉네임, 등급 및 테마/컨셉 로드
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

      // 글로벌 학습 등급 로드
      const savedLevel = localStorage.getItem('nihongo_quest_target_level') || 'N1';
      setTargetLevel(savedLevel);

      const savedTheme = localStorage.getItem('nihongo-theme') || (savedLevel === 'BEGINNER' ? 'zen' : 'cyber');
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const savedConcept = localStorage.getItem('nihongo-concept') || (savedLevel === 'BEGINNER' ? 'eco' : 'glass');
      setCurrentConcept(savedConcept);
      document.documentElement.setAttribute('data-concept', savedConcept);
    }
  }, []);

  const handleToggleTargetLevel = (level) => {
    if (typeof window !== 'undefined') {
      if (level === targetLevel) {
        setIsDrawerOpen(false);
        return;
      }

      localStorage.setItem('nihongo_quest_target_level', level);
      setTargetLevel(level);
      setIsDrawerOpen(false);
      setSelectedStage(null);
      window.location.assign('/');
    }
  };

  const getStageTitle = (stage) => {
    if (!stage) return "";
    return stage.title;
  };

  // 🏟️ 드로워 메뉴나 외부에서 아레나 모달 열기 이벤트 수신
  useEffect(() => {
    if (!mounted) return;

    const handleOpenArenaModal = (e) => {
      setShowCourseSelection(e.detail?.selectCourse !== false);
      const stageIndex = e.detail?.stageIndex ?? 0;
      const stages = getStagesList(targetLevel);
      const stage = stages[stageIndex];
      if (stage) {
        if (stage.category === 'CALLIGRAPHY') {
          setSelectedStage(null);
          window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
          return;
        }
        if (targetLevel === 'N1' && e.detail?.selectCourse === false) {
          setSelectedStage(null);
          router.push(stage.href || `/play/${stage.stageNumber}?jlptLevel=N1&category=${stage.category}`);
          return;
        }
        setSelectedStage(stage);
        setChosenDifficulty('EASY');
      }
    };
    window.addEventListener('open-arena-modal', handleOpenArenaModal);

    // 2) URL 파라미터 ?openArena=X 감지
    const params = new URLSearchParams(window.location.search);
    const openArenaParam = params.get('openArena');
    if (openArenaParam !== null) {
      const stageIndex = parseInt(openArenaParam, 10);
      const stages = getStagesList(targetLevel);
      const stage = stages[stageIndex];
      if (stage) {
        if (stage.category === 'CALLIGRAPHY') {
          setSelectedStage(null);
          window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
        } else if (targetLevel === 'N1') {
          router.push(stage.href || `/play/${stage.stageNumber}?jlptLevel=N1&category=${stage.category}`);
        } else {
          setSelectedStage(stage);
          setChosenDifficulty('EASY');
        }
        // 주소창 파라미터 초기화
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }

    return () => {
      window.removeEventListener('open-arena-modal', handleOpenArenaModal);
    };
  }, [mounted, targetLevel, router]);

  // 1.2 모바일 드로워 오픈 시 뒷배경 바디 스크롤 고정 및 속성 마킹
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : 'unset';
    if (isDrawerOpen) {
      document.body.setAttribute('data-drawer-open', 'true');
    } else {
      document.body.removeAttribute('data-drawer-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-drawer-open');
    };
  }, [isDrawerOpen]);

  // 글로벌 아레나 모달 개폐 상태를 타 컴포넌트(ClientDashboard 등)에 전송하여 UI 조율
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('arena-modal-state', { detail: { open: !!selectedStage } }));
    }
  }, [selectedStage]);

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
      showToast("사용할 닉네임을 입력해 주세요!", 'error');
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

  // 4. 비주얼 컨셉 직접 변경 헬퍼
  const changeConcept = (conceptId) => {
    setCurrentConcept(conceptId);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-concept', conceptId);
      localStorage.setItem('nihongo-concept', conceptId);
    }
  };

  return (
    <header className="header-glass site-header">
      <div className="container header-container">
        {/* 간결한 책 모양 심벌과 단색 워드마크 */}
        <Link href="/" className="header-logo">
          <svg className="brand-mark" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 7C10 4 6 5 3 6v16c4-1 7-1 11 2 4-3 7-3 11-2V6c-3-1-7-2-11 1Zm0 0v17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="logo-text">NihongoQuest</span>
        </Link>

        {/* 네비게이션 칩 캡슐 (PC 전용) */}
        <nav className="header-nav pc-only" aria-label="주요 메뉴">
          <Link
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`nav-item ${pathname === '/' ? 'active' : ''}`}
          >
            메인
          </Link>
          <Link href="/wrong-notes" aria-current={pathname === '/wrong-notes' ? 'page' : undefined} className={`nav-item ${pathname === '/wrong-notes' ? 'active' : ''}`}>
            오답노트
          </Link>
          <Link href="/bookmarks" aria-current={pathname === '/bookmarks' ? 'page' : undefined} className={`nav-item ${pathname === '/bookmarks' ? 'active' : ''}`}>
            단어장
          </Link>
        </nav>

        {/* 우측 유틸리티 영역 (PC 전용) */}
        <div className="header-btns pc-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* ⚡ 글로벌 등급 전환 캡슐 기어 */}
          <div className="target-level-pill-switch" role="group" aria-label="학습 트랙 선택">
            {[['N1', 'N1 마스터'], ['BEGINNER', '초보 스타터']].map(([level, label]) =>
              <button key={level} type="button" aria-pressed={targetLevel === level} onClick={() => handleToggleTargetLevel(level)}>{label}</button>)}
          </div>

          {/* ⚡ 실시간 Supabase 계정 동기화 닉네임 칩 */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="header-premium-btn sync-chip"
            title="학습 계정 변경"
          >
            <span className="account-avatar" aria-hidden="true">{username.slice(0, 1)}</span>
            <span className="account-name">{username}</span>
          </button>

					{/* 🛠️ [PC 전용 설정 및 학습 도구 통합 드롭다운] */}
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="header-premium-btn"
              aria-expanded={isToolsOpen}
              style={{
                borderColor: THEMES.find(t => t.id === currentTheme)?.color || 'var(--card-border)',
                boxShadow: isToolsOpen ? 'var(--neon-glow)' : 'none'
              }}
            >
              <span className="tools-label-full">설정 & 학습 도구</span>
              <span className="tools-label-short">학습 도구</span>
              <svg className="tools-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
                          fontWeight: currentTheme === t.id ? '700' : '500',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span>{t.emoji}</span>
                        <span>{t.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 비주얼 컨셉 변경 섹션 */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>🕹️</span> 비주얼 컨셉 모드
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                    {CONCEPTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => changeConcept(c.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          padding: '0.4375rem 0.375rem',
                          border: currentConcept === c.id ? `1.5px solid var(--accent-color)` : '1.5px solid var(--card-border)',
                          background: currentConcept === c.id ? 'var(--bg-secondary)' : 'transparent',
                          color: 'var(--text-primary)',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.75rem',
                          fontWeight: currentConcept === c.id ? '700' : '500',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name.split(' ')[0]}</span>
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
                    <Link href="/wrong-notes" className="tools-dropdown-item" onClick={() => setIsToolsOpen(false)}>
                      📓 오답노트 ➔
                    </Link>
                    <Link href="/bookmarks" className="tools-dropdown-item" onClick={() => setIsToolsOpen(false)}>
                      ⭐ 단어장 ➔
                    </Link>
                    {targetLevel === 'BEGINNER' && <Link href="/?practiceWriting=1" className="tools-dropdown-item" onClick={() => setIsToolsOpen(false)}>
                      🌱 문자 비법서·손글씨 연습 ➔
                    </Link>}
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
                    {JLPT_REGISTRATION_LINKS.map(link => (
                      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                        className="tools-dropdown-item" onClick={() => setIsToolsOpen(false)}>
                        📝 {link.label} ↗
                      </a>
                    ))}
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
          aria-expanded={isDrawerOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* 🔮 [계정 동기화 닉네임 교체 모달] */}
      {isModalOpen && mounted && <AccountModal inputName={inputName} setInputName={setInputName} setIsModalOpen={setIsModalOpen} handleSaveUsername={handleSaveUsername} />}

      {/* 🔮 [모바일 전용 사이드 드로워 메뉴] */}
      {isDrawerOpen && mounted && <MobileDrawer setIsDrawerOpen={setIsDrawerOpen} setIsModalOpen={setIsModalOpen} username={username} targetLevel={targetLevel} handleToggleTargetLevel={handleToggleTargetLevel} currentTheme={currentTheme} currentConcept={currentConcept} isDrawerThemeOpen={isDrawerThemeOpen} setIsDrawerThemeOpen={setIsDrawerThemeOpen} isDrawerConceptOpen={isDrawerConceptOpen} setIsDrawerConceptOpen={setIsDrawerConceptOpen} changeTheme={changeTheme} changeConcept={changeConcept} router={router} pathname={pathname} />}

      {/* ==================== [글로벌 실시간 N1 실전 아레나 난이도/급수 통합 모달] ==================== */}
      {selectedStage && mounted && <ArenaEntryModal selectedStage={selectedStage} setSelectedStage={setSelectedStage} showCourseSelection={showCourseSelection} targetLevel={targetLevel} chosenDifficulty={chosenDifficulty} setChosenDifficulty={setChosenDifficulty} getStageTitle={getStageTitle} router={router} />}
    </header>
  );
}
