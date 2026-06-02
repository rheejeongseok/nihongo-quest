'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';

const THEMES = [
  { id: 'zen', name: '젠 (Zen)', emoji: '🌸', color: '#557c55' },
  { id: 'cyber', name: '사이버 (Cyber)', emoji: '⚡', color: '#00f0ff' },
  { id: 'kawaii', name: '파스텔 (Kawaii)', emoji: '🍑', color: '#ff9494' },
  { id: 'academic', name: '클래식 (Classic)', emoji: '📜', color: '#1a4d80' },
  { id: 'neon-dream', name: '네온드림 (Neon)', emoji: '🛸', color: '#00ffb9' },
  { id: 'nordic-frost', name: '오로라 (Frost)', emoji: '❄️', color: '#00f2fe' },
  { id: 'velvet-rose', name: '벨벳로즈 (Rose)', emoji: '🌹', color: '#ff6b8b' },
  { id: 'golden-sand', name: '샤인사하라 (Gold)', emoji: '🌟', color: '#d4af37' }
];

const CONCEPTS = [
  { id: 'glass', name: '오로라 판타지', emoji: '🌌' },
  { id: 'retro', name: '레트로 도트', emoji: '👾' },
  { id: 'heritage', name: '교토 헤리티지', emoji: '🏮' },
  { id: 'chalkboard', name: '추억의 칠판', emoji: '🏫' },
  { id: 'eco', name: '오가닉 미니멀', emoji: '🍃' }
];

const CATEGORY_META = {
  CALLIGRAPHY: { emoji: '🌱', color: '#486b48', label: '손글씨 연습', mobileTitle: '글자쓰기' },
  CHARACTERS: { emoji: '🌸', color: '#ff9494', label: '문자 정복', mobileTitle: '문자어휘' },
  VOCAB: { emoji: '🍱', color: '#ffb37e', label: '어휘 마스터', mobileTitle: '어휘마스터' },
  GRAMMAR: { emoji: '⚙️', color: '#a6cf98', label: '문법 조사', mobileTitle: '문법조사' },
  LISTENING: { emoji: '🎧', color: '#90b4fc', label: '청해 배틀', mobileTitle: '청해배틀' },
  WORDLE: { emoji: '🧩', color: '#b19ffb', label: '단어 워들', mobileTitle: '단어워들' },
  ASSEMBLY: { emoji: '⚔️', color: '#ffd32a', label: '문장 조립', mobileTitle: '문장조립' },
  MOCK_EXAM: { emoji: '📝', color: '#ff5e7e', label: '모의고사', mobileTitle: '모의고사' }
};

const getStagesList = (level) => {
  if (level === 'BEGINNER') {
    return [
      { id: "stage-calligraphy-uuid", stageNumber: 0, title: "문자 비법서 & 손글씨 연습", category: "CALLIGRAPHY" },
      { id: "stage-1-uuid", stageNumber: 1, title: "기초 문자", category: "CHARACTERS" },
      { id: "stage-2-uuid", stageNumber: 2, title: "기초 어휘", category: "VOCAB" },
      { id: "stage-3-uuid", stageNumber: 3, title: "기초 조사", category: "GRAMMAR" },
      { id: "stage-4-uuid", stageNumber: 4, title: "일상 회화", category: "LISTENING" },
      { id: "stage-5-uuid", stageNumber: 5, title: "기초 워들", category: "WORDLE" },
      { id: "virtual-stage-5-uuid", stageNumber: 5, title: "기초 문장 조립", category: "ASSEMBLY" },
      { id: "virtual-stage-6-uuid", stageNumber: 6, title: "초보 실력 진단", category: "MOCK_EXAM" }
    ];
  }
  return [
    { id: "stage-1-uuid", stageNumber: 1, title: "문자 정복", category: "CHARACTERS" },
    { id: "stage-2-uuid", stageNumber: 2, title: "어휘 마스터", category: "VOCAB" },
    { id: "stage-3-uuid", stageNumber: 3, title: "문법 조사", category: "GRAMMAR" },
    { id: "stage-4-uuid", stageNumber: 4, title: "청해 배틀", category: "LISTENING" },
    { id: "stage-5-uuid", stageNumber: 5, title: "단어 워들", category: "WORDLE" },
    { id: "virtual-stage-5-uuid", stageNumber: 5, title: "경어랑 조사 문장 조립", category: "ASSEMBLY" },
    { id: "virtual-stage-6-uuid", stageNumber: 6, title: "실전 15분 모의고사", category: "MOCK_EXAM" }
  ];
};

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
  const [chosenJlpt, setChosenJlpt] = useState('N1');
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
      localStorage.setItem('nihongo_quest_target_level', level);
      setTargetLevel(level);
      
      setIsDrawerOpen(false);
      window.location.reload(); // 즉각적인 0ms 전면 리프레시!
    }
  };

  const getStageTitle = (stage) => {
    if (!stage) return "";
    if (targetLevel === 'BEGINNER') {
      const beginnerTitles = {
        1: "기초 문자",
        2: "기초 어휘",
        3: "기초 조사",
        4: "일상 회화",
        5: stage.category === "ASSEMBLY" ? "기초 문장 조립" : "기초 워들",
        6: "초보 실력 진단"
      };
      // For virtual stage 6 (stageNumber 6 in beginner mode)
      if (stage.category === "MOCK_EXAM") return "초보 실력 진단";
      if (stage.category === "ASSEMBLY") return "기초 문장 조립";
      return beginnerTitles[stage.stageNumber] || stage.title;
    }
    return stage.title;
  };

  // 🏟️ 드로워 메뉴나 외부에서 아레나 모달 열기 이벤트 수신
  useEffect(() => {
    if (!mounted) return;

    const handleOpenArenaModal = (e) => {
      const stageIndex = e.detail?.stageIndex ?? 0;
      const stages = getStagesList(targetLevel);
      const stage = stages[stageIndex];
      if (stage) {
        if (stage.category === 'CALLIGRAPHY') {
          setSelectedStage(null);
          window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
          return;
        }
        setSelectedStage(stage);
        setChosenJlpt('N1');
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
        } else {
          setSelectedStage(stage);
          setChosenJlpt('N1');
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
  }, [mounted, targetLevel]);

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

  // 4. 비주얼 컨셉 직접 변경 헬퍼
  const changeConcept = (conceptId) => {
    setCurrentConcept(conceptId);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-concept', conceptId);
      localStorage.setItem('nihongo-concept', conceptId);
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
          {/* ⚡ 글로벌 등급 전환 캡슐 기어 */}
          <div className="target-level-pill-switch" style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--card-border)',
            borderRadius: '2rem',
            padding: '2px',
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => handleToggleTargetLevel('N1')}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '1.5rem',
                fontSize: '0.75rem',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: targetLevel === 'N1' ? 'var(--accent-color, #00f0ff)' : 'transparent',
                color: targetLevel === 'N1' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: targetLevel === 'N1' ? '0 2px 8px rgba(0, 240, 255, 0.4)' : 'none'
              }}
            >
              ⚡ N1 마스터
            </button>
            <button
              onClick={() => handleToggleTargetLevel('BEGINNER')}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '1.5rem',
                fontSize: '0.75rem',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: targetLevel === 'BEGINNER' ? '#557c55' : 'transparent',
                color: targetLevel === 'BEGINNER' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: targetLevel === 'BEGINNER' ? '0 2px 8px rgba(85, 124, 85, 0.4)' : 'none'
              }}
            >
              🌱 초보 스타터
            </button>
          </div>

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

            {/* ⚡ 글로벌 등급 차원 전환 섹션 (모바일) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">⚡ 글로벌 학습 등급</span>
              <div style={{
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
              </nav>
            </div>

            {/* 🏟️ N1 실전 아레나 바로입장 퀵 그리드 (모바일 전용) */}
            <div className="drawer-section" style={{ marginTop: '0.75rem' }}>
              <span className="drawer-sec-label">🏟️ {targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 바로입장</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginTop: '0.25rem' }}>
                {(targetLevel === 'BEGINNER' 
                  ? [
                      { stageIndex: 0, emoji: '🌱', label: '글자 쓰기 코스', bg: 'rgba(85, 124, 85, 0.09)', color: '#557c55'},
                      { stageIndex: 1, emoji: '🌸', label: '기초 문자 퀴즈', bg: 'rgba(255, 148, 148, 0.09)', color: '#ff9494' },
                      { stageIndex: 2, emoji: '🍱', label: '기초 어휘', bg: 'rgba(255, 179, 126, 0.09)', color: '#ffb37e' },
                      { stageIndex: 3, emoji: '⚙️', label: '기초 조사', bg: 'rgba(166, 207, 152, 0.09)', color: '#a6cf98' },
                      { stageIndex: 4, emoji: '🎧', label: '일상 회화', bg: 'rgba(144, 180, 252, 0.09)', color: '#90b4fc' },
                      { stageIndex: 5, emoji: '🧩', label: '기초 워들', bg: 'rgba(177, 159, 251, 0.09)', color: '#b19ffb' },
                      { stageIndex: 6, emoji: '⚔️', label: '기초 조립', bg: 'rgba(255, 211, 42, 0.09)', color: '#ffd32a' },
                      { stageIndex: 7, emoji: '📝', label: '실력 진단', bg: 'rgba(255, 94, 126, 0.09)', color: '#ff5e7e' }
                    ]
                  : [
                      { stageIndex: 0, emoji: '🌸', label: '문자 정복', bg: 'rgba(255, 148, 148, 0.09)', color: '#ff9494' },
                      { stageIndex: 1, emoji: '🍱', label: '어휘 마스터', bg: 'rgba(255, 179, 126, 0.09)', color: '#ffb37e' },
                      { stageIndex: 2, emoji: '⚙️', label: '문법 조사', bg: 'rgba(166, 207, 152, 0.09)', color: '#a6cf98' },
                      { stageIndex: 3, emoji: '🎧', label: '청해 배틀', bg: 'rgba(144, 180, 252, 0.09)', color: '#90b4fc' },
                      { stageIndex: 4, emoji: '🧩', label: '단어 워들', bg: 'rgba(177, 159, 251, 0.09)', color: '#b19ffb' },
                      { stageIndex: 5, emoji: '⚔️', label: '문장 조립', bg: 'rgba(255, 211, 42, 0.09)', color: '#ffd32a' },
                      { stageIndex: 6, emoji: '📝', label: '하프 모의', bg: 'rgba(255, 94, 126, 0.09)', color: '#ff5e7e' }
                    ]
                ).map(({ stageIndex, emoji, label, bg, color, full }) => (
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
                      if (stageIndex === 0 && targetLevel === 'BEGINNER') {
                        window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
                      } else {
                        const stages = getStagesList(targetLevel);
                        setSelectedStage(stages[stageIndex]);
                        setChosenJlpt('N1');
                        setChosenDifficulty('EASY');
                      }
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

      {/* ==================== [글로벌 실시간 N1 실전 아레나 난이도/급수 통합 모달] ==================== */}
      {selectedStage && mounted && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="premium-card animate-scale modal-premium-content" style={{
            maxWidth: '38.75rem',
            width: '92%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'center',
            padding: '1.5rem'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🏟️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '4px' }}>
              {targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 챌린지
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              도전하실 아레나 코스와 세부 난이도를 선택해 주세요!
            </p>

            {/* 1. 5대 아레나 실시간 코스 변환기 그리드 */}
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              🎯 코스 선택
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(6.25rem, 1fr))', gap: '0.375rem', marginBottom: '1.25rem' }}>
              {getStagesList(targetLevel).map((stage) => {
                const meta = CATEGORY_META[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
                const isSelected = selectedStage.stageNumber === stage.stageNumber && selectedStage.category === stage.category;
                const dynamicTitle = getStageTitle(stage);
                return (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedStage(stage)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.5rem 0.25rem',
                      borderRadius: '0.75rem',
                      background: isSelected ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? `2px solid ${meta.color}` : '1.5px solid var(--card-border)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 0.625rem ${meta.color}20` : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{meta.emoji}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '900', whiteSpace: 'nowrap' }}>
                      {dynamicTitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. 세부 난이도 선택 (쉬움 🌱, 보통 🍱, 어려움 ⚡) */}
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              ⚡ 난이도 설정
            </div>
            <div className="difficulty-btn-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.5rem',
              marginBottom: '1.75rem'
            }}>
              {['EASY', 'MEDIUM', 'HARD'].map((diff) => {
                const isActive = chosenDifficulty === diff;
                const labels = { EASY: '쉬움 🌱', MEDIUM: '보통 🍱', HARD: '어려움 ⚡' };
                const colors = { EASY: '#557c55', MEDIUM: '#ff9f43', HARD: '#ff6b6b' };

                return (
                  <button
                    key={diff}
                    onClick={() => setChosenDifficulty(diff)}
                    style={{
                      padding: '0.6875rem 0.25rem',
                      borderRadius: '0.625rem',
                      background: isActive ? colors[diff] : 'var(--bg-secondary)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      border: `1.5px solid ${isActive ? colors[diff] : 'var(--card-border)'}`,
                      fontFamily: 'inherit',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 0.25rem 0.625rem rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {labels[diff]}
                  </button>
                );
              })}
            </div>

            {/* 모달 제어 */}
            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setSelectedStage(null)}
                className="outline-btn"
                style={{ padding: '0.625rem 1.25rem', fontSize: '0.82rem', flex: 1 }}
              >
                닫기
              </button>
              <button 
                onClick={() => {
                  if (!selectedStage) return;
                  router.push(`/play/${selectedStage.stageNumber}?jlptLevel=${chosenJlpt}&difficulty=${chosenDifficulty}`);
                  setSelectedStage(null);
                }}
                className="glow-btn"
                style={{ padding: '0.625rem 1.5rem', fontSize: '0.82rem', flex: 1 }}
              >
                아레나 입장 ➔
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
