'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard({ initialStages, initialUser }) {
  const router = useRouter();

  // 유저 정보 기본값 매핑
  const user = initialUser || {
    username: '학습자님',
    points: 0,
    currentStreak: 5,
    maxStreak: 10,
    badges: '["초보자"]'
  };

  const parsedBadges = JSON.parse(user.badges);

  // 상시 동기화 로딩 상태
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // 🏆 [3.8.5 프리미엄 업적 콜렉션 상태]
  const [unlockedAchievements, setUnlockedAchievements] = useState({});

  // 🎯 스마트 복습 & 단어 카운트 실시간 상태
  const [wrongCount, setWrongCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const r1 = await fetch('/api/wrong-notes');
        const d1 = await r1.json();
        if (d1.success) setWrongCount(d1.wrongAnswers.length);
        
        const r2 = await fetch('/api/bookmarks');
        const d2 = await r2.json();
        if (d2.success) setBookmarkCount(d2.bookmarks.length);
      } catch (e) {
        console.error("복습 데이터 집계 에러:", e);
      }
    }
    fetchCounts();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nihongo_quest_achievements');
      if (saved) {
        setUnlockedAchievements(JSON.parse(saved));
      }
    } catch (e) {
      console.error("업적 로딩 에러:", e);
    }
  }, []);

  // 🌸 NHK 실시간 뉴스 브리핑 상태
  const [nhkNews, setNhkNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [expandedNews, setExpandedNews] = useState(null);

  // 실시간 뉴스 로드 (API에서 이미 랜덤 5개 반환)
  useEffect(() => {
    async function fetchNhkNews() {
      try {
        setNewsLoading(true);
        const res = await fetch('/api/nhk-news');
        const data = await res.json();
        if (data.success) {
          setNhkNews(data.news);
        }
      } catch (e) {
        console.error("NHK 뉴스 로드 에러:", e);
      } finally {
        setNewsLoading(false);
      }
    }
    fetchNhkNews();
  }, []);

  // 모달 팝업 상태 관리
  const [selectedStage, setSelectedStage] = useState(null);
  const [chosenJlpt, setChosenJlpt] = useState('N1'); // 대분류 기본값: N1
  const [chosenDifficulty, setChosenDifficulty] = useState('EASY'); // 소분류 기본값: EASY

  // 스테이지별 이모지 및 색상 매핑
  const categoryMeta = {
    CHARACTERS: { emoji: '🌸', color: '#ff9494', label: '문자 정복' },
    VOCAB: { emoji: '🍱', color: '#ffb37e', label: '어휘 마스터' },
    GRAMMAR: { emoji: '⚙️', color: '#a6cf98', label: '문법 조사' },
    LISTENING: { emoji: '🎧', color: '#90b4fc', label: '청해 배틀' },
    WORDLE: { emoji: '🧩', color: '#b19ffb', label: '단어 워들' }
  };

  // 상시 동기화 실행
  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncDone(true);
        setTimeout(() => {
          setSyncDone(false);
          window.location.reload();
        }, 1200);
      } else {
        alert("동기화 실패: " + data.error);
      }
    } catch (e) {
      alert("네트워크 에러: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const openDifficultyModal = (stage) => {
    setSelectedStage(stage);
    setChosenJlpt('N1');
    setChosenDifficulty('EASY');
  };

  const handleStartPlay = () => {
    if (!selectedStage) return;
    // 선택한 급수(N2/N1)와 세부 난이도(EASY/MEDIUM/HARD)를 동시에 쿼리 파라미터로 실어 라우팅 실행
    router.push(`/play/${selectedStage.stageNumber}?jlptLevel=${chosenJlpt}&difficulty=${chosenDifficulty}`);
    setSelectedStage(null); // 모달 닫기
  };

  // 🔮 [3.8.8 명품 글래스모피즘] 3D 입체 틸트 & 마우스 광택 실시간 좌표 핸들러
  const handleMouseMove = (e) => {
    // 모바일(768px 이하) 혹은 터치 기기에서는 스크롤 및 레이아웃을 위해 틸트 작동을 완전히 배제
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return;
    }

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = x / rect.width - 0.5;
    const yc = y / rect.height - 0.5;
    
    // 큰 카드 영역에서도 심한 요동 없이 우아하고 기품 있게 3도로 정밀 완화
    const rotateX = yc * -3; 
    const rotateY = xc * 3;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.008)`;
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return;
    }
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div>      {/* 0. 상시 데이터 동기화 패널 (최상단 노출) */}
      <div className="glass-premium-card rainbow-border sync-panel-premium" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        <div className="sync-panel-content">
          <span className="sync-panel-title">
            🌱 최신 자격증 문항 데이터 동기화
          </span>
          <span className="sync-panel-desc">
            실전 최고난도 JLPT N1 완벽 대비용 초대형 5000+개 퀴즈 풀로 초기화 및 갱신합니다.
          </span>
        </div>
        
        <button
          onClick={handleSyncData}
          disabled={syncing || syncDone}
          className="glass-neon-btn sync-panel-btn"
        >
          {syncing ? (
            <>⏳ 주입 중...</>
          ) : syncDone ? (
            <>🎉 성공! 새로고침 중...</>
          ) : (
            <>🌱 5000+ 문항 강제 동기화</>
          )}
        </button>
      </div>

      {/* 1. 상단 정보 대시보드 카드 그리드 */}
      <div className="dashboard-info-grid">
        
        {/* 프로필 및 포인트 카드 */}
        <div className="glass-premium-card rainbow-border info-card-wrapper" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-header-group">
            <h3 className="card-title">
              👋 어서오세요, {user.username}님!
            </h3>
            <p className="card-desc">
              오늘도 즐거운 일본어 모험이 당신을 기다립니다.
            </p>
          </div>
          <div className="card-footer-group">
            <div>
              <span className="card-stat-label">누적 포인트</span>
              <span className="card-stat-value">
                {user.points} <span className="card-stat-unit">pts</span>
              </span>
            </div>
            <span className="card-large-emoji">🏆</span>
          </div>
        </div>

        {/* 일일 학습 스트릭 카드 */}
        <div className="glass-premium-card rainbow-border info-card-wrapper" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-header-group">
            <h3 className="card-title">
              🔥 일일 학습 스트릭
            </h3>
            <p className="card-desc">
              매일 연속으로 학습을 이어가고 스트릭 불꽃을 꺼뜨리지 마세요!
            </p>
          </div>
          <div className="card-footer-group">
            <div>
              <span className="card-stat-value streak-color">
                {user.currentStreak} <span className="card-stat-unit-text">일째 연속</span>
              </span>
              <span className="card-stat-label-small">
                최대 기록: {user.maxStreak}일 연속 학습
              </span>
            </div>
            {/* 스트릭 잔디 심기 미니 연출 */}
            <div className="streak-grass-container">
              {[1, 2, 3, 4, 5].map((day) => (
                <div 
                  key={day}
                  className={`streak-grass-node ${day <= user.currentStreak ? 'active' : 'inactive'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 스마트 복습 & 단어 센터 (비로그인 환경 최적화 퀵 패스) */}
        <div className="glass-premium-card rainbow-border info-card-wrapper large-card" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-header-group">
            <h3 className="card-title">
              🎯 스마트 복습 & 단어 센터
            </h3>
            <p className="card-desc">
              틀린 오답을 복습하고, 퀴즈 도중 수집한 나만의 단어장을 한눈에 관리하세요.
            </p>
          </div>

          <div className="study-hub-box">
            <a href="/wrong-notes" className="study-hub-item wrong-hub">
              <span>📓 스마트 오답노트 복습</span>
              <span className="pulse-ani study-hub-badge wrong-badge">
                {wrongCount}개 대기
              </span>
            </a>

            <a href="/bookmarks" className="study-hub-item bookmark-hub">
              <span>⭐ 나의 일본어 단어장</span>
              <span className="study-hub-badge bookmark-badge">
                {bookmarkCount}개 단어
              </span>
            </a>
          </div>
        </div>

      </div>

      {/* 1.5. [N1 PREMIUM] NHK 랜덤 시사 & 사회 뉴스 브리핑 */}
      <div className="glass-premium-card rainbow-border nhk-news-briefing-card">
        <div className="nhk-news-header">
          <div className="nhk-news-header-title-box">
            <h2 className="nhk-news-header-title">
              📰 NHK 실시간 시사 & 사회 뉴스 브리핑
            </h2>
            <p className="nhk-news-header-desc">
              매번 랜덤으로 선별된 5개 뉴스로 N1 기출 한자 및 핵심 사회 어휘를 학습하세요
            </p>
          </div>
          <span className={`nhk-status-badge ${!newsLoading && nhkNews.length > 0 ? 'realtime' : 'fallback'}`}>
            {newsLoading ? "⏳ 로딩 중" : `🎲 랜덤 ${nhkNews.length}선`}
          </span>
        </div>

        {newsLoading ? (
          /* 스켈레톤 로더 */
          <div className="nhk-skeleton-container">
            {[1, 2, 3].map((n) => (
              <div key={n} className="nhk-skeleton-item">
                <div className="nhk-skeleton-line title" />
                <div className="nhk-skeleton-line desc" />
              </div>
            ))}
          </div>
        ) : (
          <div className="nhk-news-list">
            {nhkNews.map((item, idx) => {
              const isExpanded = expandedNews === idx;
              return (
                <div 
                  key={idx} 
                  className={`nhk-news-item ${isExpanded ? 'active' : ''}`}
                >
                  {/* 뉴스 제목 및 간략 보기 영역 */}
                  <div 
                    className="nhk-news-item-trigger"
                    onClick={() => setExpandedNews(isExpanded ? null : idx)}
                  >
                    <div className="nhk-news-item-title-row">
                      <span className="nhk-news-emoji">📰</span>
                      <h4 className="nhk-news-item-title">{item.title}</h4>
                      
                      <span className="nhk-toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    <div className="nhk-news-meta-row">
                      <span className="nhk-meta-date">
                        {item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '최신 시사'}
                      </span>
                      <span className="nhk-meta-category">N1 사회시사</span>
                    </div>
                  </div>

                  {/* 아코디언 콘텐츠 영역 (단어 정리 및 번역 제공) */}
                  {isExpanded && (
                    <div className="nhk-accordion-content fade-in">
                      <p className="nhk-news-raw-desc">
                        <strong>[일본어 원문]</strong><br />
                        {item.description}
                      </p>
                      
                      <div className="nhk-news-analysis-box">
                        {/* 1. N1 핵심 어휘집 */}
                        <div className="nhk-analysis-subsect">
                          <h5 className="nhk-subsect-title">🌸 N1 필수 시사 어휘</h5>
                          <div className="nhk-words-grid">
                            {item.n1Words && item.n1Words.length > 0 ? (
                              item.n1Words.map((wordObj, wIdx) => (
                                <div key={wIdx} className="nhk-word-chip-wrapper">
                                  <span className="nhk-word-badge">{wordObj.word}</span>
                                  <div className="nhk-word-details">
                                    <span className="nhk-word-reading">[{wordObj.reading}]</span>
                                    <span className="nhk-word-meaning">{wordObj.meaning}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="nhk-no-words">기출 어휘 분석 중...</p>
                            )}
                          </div>
                        </div>

                        {/* 2. 번역 가이드 */}
                        <div className="nhk-analysis-subsect translation-subsect">
                          <h5 className="nhk-subsect-title">📓 한국어 독해 번역 가이드</h5>
                          <p className="nhk-translation-text">{item.translation}</p>
                        </div>
                      </div>

                      {/* 하단 단독 원문 앵커 링크 */}
                      <div className="nhk-item-footer">
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="nhk-raw-link-btn"
                        >
                          NHK 공식 기사 원문 보기 🔗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. 대망의 5대 카테고리 독립형 실전 아레나 */}
      <div className="arena-section-container">
        <h2 className="arena-section-title">
          🏟️ N1 실전 아레나 (N1 Premium Arenas)
        </h2>
        
        <div className="arena-cards-grid">
          {initialStages.map((stage) => {
            const meta = categoryMeta[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
            
            return (
              <div 
                key={stage.id}
                className="glass-premium-card rainbow-border interactive-arena arena-card-wrapper"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.02), 0 0 20px ${meta.color}0a`
                }}
              >
                {/* 상단: 카테고리 정보 및 아이콘 */}
                <div className="arena-card-body-wrapper">
                  <div className="arena-card-top">
                    <span className="arena-card-emoji">{meta.emoji}</span>
                    <span 
                      className="arena-card-badge"
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}66`
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <h4 className="arena-card-title">
                    {stage.title}
                  </h4>
                  
                  <p className="arena-card-desc">
                    5,000+개 N1 최고난도 기출 풀에서 무작위 라이브 추출
                  </p>
                </div>

                {/* 하단: 입장 버튼 및 매칭 명세 */}
                <div className="arena-card-footer">
                  <span className="arena-card-footer-label">
                    독자 아레나 코스
                  </span>
                  <button 
                    onClick={() => openDifficultyModal(stage)}
                    className="glass-neon-btn arena-card-btn" 
                  >
                    아레나 입장 ➔
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== [3.0 JLPT 대분류 탭 + 상중하 난이도 조절 우아한 모달 팝업] ==================== */}
      {selectedStage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="premium-card animate-scale modal-premium-content" style={{
            maxWidth: '850px',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🎓</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>
              {selectedStage.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              최고난도 **JLPT N1** 실전 테스트입니다. 도전하고 싶은 **세부 난이도**를 선택해 주세요!
            </p>

            {/* 소분류: [쉬움 🌱] [보통 🍱] [어려움 ⚡] */}
            <div className="difficulty-btn-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              marginBottom: '32px'
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
                      padding: '12px 6px',
                      borderRadius: 'var(--custom-radius)',
                      background: isActive ? colors[diff] : 'var(--bg-secondary)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      border: `1.5px solid ${isActive ? colors[diff] : 'var(--card-border)'}`,
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {labels[diff]}
                  </button>
                );
              })}
            </div>

            {/* 모달 제어 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setSelectedStage(null)}
                className="outline-btn"
                style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              >
                닫기
              </button>
              <button 
                onClick={handleStartPlay}
                className="glow-btn"
                style={{ padding: '12px 32px', fontSize: '0.9rem' }}
              >
                모험 시작 ➔
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
