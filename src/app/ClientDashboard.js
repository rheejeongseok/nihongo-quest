'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';

export default function ClientDashboard({ initialStages, initialUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSyncHeaders = (extra = {}) => {
    const username = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
    return {
      'x-nihongo-username': encodeURIComponent(username),
      ...extra
    };
  };

  // 실시간 유저 정보 로드
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user', {
          headers: getSyncHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser({
            username: typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터',
            points: 0,
            currentStreak: 0,
            maxStreak: 0,
            badges: '["초보자"]'
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setUserLoading(false);
      }
    }
    loadUser();
  }, []);

  const parsedBadges = user && user.badges ? JSON.parse(user.badges) : ["초보자"];

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
        const r1 = await fetch('/api/wrong-notes', {
          headers: getSyncHeaders()
        });
        const d1 = await r1.json();
        if (d1.success) setWrongCount(d1.wrongAnswers.length);
        
        const r2 = await fetch('/api/bookmarks', {
          headers: getSyncHeaders()
        });
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

  // NHK 딕테이션 및 즉시 수확 전용 상태들
  const { speak } = useJapaneseSpeech();
  const [dictatingNews, setDictatingNews] = useState(null);
  const [dictationInputs, setDictationInputs] = useState({});
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationCorrects, setDictationCorrects] = useState({});
  const [harvestedWords, setHarvestedWords] = useState({});
  const [harvestingWord, setHarvestingWord] = useState('');

  // 📅 JLPT D-Day 연산 전용 상태 및 유틸
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [examInfo, setExamInfo] = useState({ type: '', dateStr: '' });
  const [isRegistrationPeriod, setIsRegistrationPeriod] = useState(false);

  useEffect(() => {
    // 특정 연도의 특정 월 첫째 주 일요일 반환 유틸
    const getFirstSundayOfMonth = (year, monthIndex) => {
      const date = new Date(year, monthIndex, 1);
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
      }
      return date;
    };

    // 다음 시험일 계산
    const getNextJlptExamDate = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const julyExam = getFirstSundayOfMonth(currentYear, 6); // 7월
      julyExam.setHours(13, 10, 0, 0);
      
      const decExam = getFirstSundayOfMonth(currentYear, 11); // 12월
      decExam.setHours(13, 10, 0, 0);
      
      if (now < julyExam) {
        return { date: julyExam, type: '7월 시험' };
      }
      if (now < decExam) {
        return { date: decExam, type: '12월 시험' };
      }
      const nextJulyExam = getFirstSundayOfMonth(currentYear + 1, 6);
      nextJulyExam.setHours(13, 10, 0, 0);
      return { date: nextJulyExam, type: '내년 7월 시험' };
    };

    const exam = getNextJlptExamDate();
    setExamInfo({
      type: exam.type,
      dateStr: exam.date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    });

    // 원서 접수 달 감지 (7월 시험: 4월 접수, 12월 시험: 9월 접수)
    const month = new Date().getMonth() + 1;
    if ((exam.type === '7월 시험' && month === 4) || (exam.type === '12월 시험' && month === 9)) {
      setIsRegistrationPeriod(true);
    }

    // 1초 주기의 카운트다운 타이머 기동
    const timer = setInterval(() => {
      const difference = exam.date.getTime() - Date.now();
      
      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // 🌾 단어 즉시 수확기 처리
  const handleHarvestWord = async (wordObj) => {
    if (harvestingWord || harvestedWords[wordObj.word]) return;
    setHarvestingWord(wordObj.word);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          word: wordObj.word,
          meaning: wordObj.meaning,
          reading: wordObj.reading
        })
      });
      const data = await res.json();
      if (data.success) {
        setHarvestedWords(prev => ({ ...prev, [wordObj.word]: true }));
        setBookmarkCount(prev => prev + 1);
        alert(`🌾 N1 단어 즉시 수확 성공!\n[${wordObj.word}] 단어가 나의 단어장에 완벽히 수집되었습니다!`);
      } else {
        alert("수확 실패: " + data.error);
      }
    } catch (e) {
      alert("수확 실패 네트워크 에러: " + e.message);
    } finally {
      setHarvestingWord('');
    }
  };

  // 🎧 딕테이션 제출 채점 처리
  const handleDictationSubmit = (newsItem) => {
    const corrects = {};
    let allCorrect = true;
    
    newsItem.n1Words.forEach((wordObj, idx) => {
      const val = (dictationInputs[idx] || '').trim();
      const isCorrect = val === wordObj.word || val === wordObj.reading;
      corrects[idx] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setDictationCorrects(corrects);
    setDictationChecked(true);

    if (allCorrect) {
      alert("🎉 퍼펙트! 모든 N1 시사 빈칸을 정확하게 받아적으셨습니다! (+50pts 보너스)");
      if (user) {
        setUser(prev => prev ? { ...prev, points: prev.points + 50 } : null);
      }
    } else {
      alert("✍️ 채점 완료! 일부 빈칸을 확인해보세요. 오답 단어는 즉시 수확하여 공부할 수 있습니다!");
    }
  };

  // 모달 팝업 상태 관리
  const [selectedStage, setSelectedStage] = useState(null);
  const [chosenJlpt, setChosenJlpt] = useState('N1'); // 대분류 기본값: N1
  const [chosenDifficulty, setChosenDifficulty] = useState('EASY'); // 소분류 기본값: EASY

  // 스테이지별 이모지 및 색상 매핑
  const categoryMeta = {
    CHARACTERS: { emoji: '🌸', color: '#ff9494', label: '문자 정복', mobileTitle: '문자어휘' },
    VOCAB: { emoji: '🍱', color: '#ffb37e', label: '어휘 마스터', mobileTitle: '어휘마스터' },
    GRAMMAR: { emoji: '⚙️', color: '#a6cf98', label: '문법 조사', mobileTitle: '문법조사' },
    LISTENING: { emoji: '🎧', color: '#90b4fc', label: '청해 배틀', mobileTitle: '청해배틀' },
    WORDLE: { emoji: '🧩', color: '#b19ffb', label: '단어 워들', mobileTitle: '단어워들' },
    ASSEMBLY: { emoji: '⚔️', color: '#ffd32a', label: '문장 조립', mobileTitle: '문장조립' },
    MOCK_EXAM: { emoji: '📝', color: '#ff5e7e', label: '모의고사', mobileTitle: '모의고사' }
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

  // 🏟️ 드로워 메뉴에서 아레나 모달 열기 - 커스텀 이벤트 및 URL 쿼리 파라미터 수신
  useEffect(() => {
    const allStagesList = [
      ...initialStages,
      {
        id: "virtual-stage-5-uuid",
        stageNumber: 5,
        title: "경어랑 조사 문장 조립",
        category: "ASSEMBLY",
        difficulty: "HARD"
      },
      {
        id: "virtual-stage-6-uuid",
        stageNumber: 6,
        title: "실전 15분 모의고사",
        category: "MOCK_EXAM",
        difficulty: "HARD"
      }
    ];

    // 1) 드로워 메뉴 클릭 이벤트 수신
    const handleOpenArenaModal = (e) => {
      const stageIndex = e.detail?.stageIndex ?? 0;
      const stage = allStagesList[stageIndex];
      if (stage) {
        openDifficultyModal(stage);
      }
    };
    window.addEventListener('open-arena-modal', handleOpenArenaModal);

    // 2) 다른 페이지에서 드로워 메뉴 클릭 후 넘어온 경우 파라미터 감지
    const openArenaParam = searchParams.get('openArena');
    if (openArenaParam !== null) {
      const stageIndex = parseInt(openArenaParam, 10);
      const stage = allStagesList[stageIndex];
      if (stage) {
        openDifficultyModal(stage);
        // 모달을 띄웠으니 주소창의 쿼리 파라미터를 깔끔하게 초기화하여 메인 URL로 복원
        router.replace('/');
      }
    }

    return () => {
      window.removeEventListener('open-arena-modal', handleOpenArenaModal);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStages, searchParams]);

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
    
    card.style.transform = `perspective(62.5rem) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.008)`;
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return;
    }
    const card = e.currentTarget;
    card.style.transform = `perspective(62.5rem) rotateX(0deg) rotateY(0deg) scale(1)`;
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

      {/* 📅 실시간 JLPT N1 D-Day 카운트다운 & 접수 안내 보드 */}
      <div className="glass-premium-card rainbow-border dday-countdown-card" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
        style={{
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))', animation: 'float 3s infinite' }}>📅</span>
          <div>
            <h4 className='count-title' style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              JLPT N1 합격 D-Day 카운트다운
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(84, 160, 255, 0.1)',
                color: '#54a0ff',
                padding: '2px 8px',
                borderRadius: '100px',
                border: '1px solid rgba(84, 160, 255, 0.2)',
                fontWeight: '800'
              }}>
                {examInfo.type}
              </span>
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
              목표 시험 일시: <strong style={{ color: 'var(--accent-color)' }}>{examInfo.dateStr} 13:10</strong>
            </p>
          </div>
        </div>

        {/* 째깍째깍 초시계 수치 */}
        <div className='count-timer' style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[
            { label: '일', val: timeLeft.days, color: 'var(--accent-color)' },
            { label: '시', val: timeLeft.hours, color: '#ff9f43' },
            { label: '분', val: timeLeft.minutes, color: '#1dd1a1' },
            { label: '초', val: timeLeft.seconds, color: '#ff5e7e' }
          ].map((t, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                minWidth: '54px',
                height: '54px',
                background: 'var(--bg-secondary)',
                border: `2px solid ${t.color}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: '950',
                color: t.color,
                boxShadow: `0 0 10px ${t.color}22`
              }}>
                {String(t.val).padStart(2, '0')}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', marginTop: '4px' }}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* 원서 접수 기간 연동 배너 */}
        {isRegistrationPeriod && (
          <div className="fade-in" style={{
            width: '100%',
            background: 'linear-gradient(95deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 94, 126, 0.15) 100%)',
            border: '1.5px solid #ff6b6b',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)',
            animation: 'pulse 1.5s infinite'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚨 긴급 알림: 현재 JLPT N1 공식 원서 접수 기간입니다!
            </span>
            <a 
              href="https://www.jlpt.or.kr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="glow-btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                background: '#ff6b6b',
                boxShadow: 'none',
                cursor: 'pointer'
              }}
            >
              공식 접수처 바로가기 🔗
            </a>
          </div>
        )}
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
              {userLoading ? (
                <span className="card-skeleton-pulse">사용자 로드 중...</span>
              ) : (
                `👋 어서오세요, ${user?.username || '학습자'}님!`
              )}
            </h3>
            <p className="card-desc">
              {userLoading ? "실시간 클라우드 프로필을 동기화하고 있습니다..." : "오늘도 즐거운 일본어 모험이 당신을 기다립니다."}
            </p>
          </div>
          <div className="card-footer-group">
            <div>
              <span className="card-stat-label">누적 포인트</span>
              <span className="card-stat-value">
                {userLoading ? "..." : user?.points} <span className="card-stat-unit">pts</span>
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
                {userLoading ? "..." : user?.currentStreak} <span className="card-stat-unit-text">일째 연속</span>
              </span>
              <span className="card-stat-label-small">
                최대 기록: {userLoading ? "..." : user?.maxStreak}일 연속 학습
              </span>
            </div>
            {/* 스트릭 잔디 심기 미니 연출 */}
            <div className="streak-grass-container">
              {[1, 2, 3, 4, 5].map((day) => (
                <div 
                  key={day}
                  className={`streak-grass-node ${(!userLoading && day <= (user?.currentStreak || 0)) ? 'active' : 'inactive'}`}
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

                      {/* 딕테이션 버튼 그룹 */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => speak(item.description)}
                          className="outline-btn"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          🔊 뉴스 발음 전체 청취 (Dictation)
                        </button>
                        
                        <button
                          onClick={() => {
                            if (dictatingNews === idx) {
                              setDictatingNews(null);
                            } else {
                              setDictatingNews(idx);
                              setDictationInputs({});
                              setDictationChecked(false);
                              setDictationCorrects({});
                            }
                          }}
                          className="outline-btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: dictatingNews === idx ? 'var(--accent-color)' : 'var(--card-border)',
                            color: dictatingNews === idx ? 'var(--accent-color)' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          🎧 N1 뉴스 딕테이션 {dictatingNews === idx ? '종료' : '훈련 시작'}
                        </button>
                      </div>

                      {/* 딕테이션 훈련 슬롯 활성화 */}
                      {dictatingNews === idx && (
                        <div className="fade-in" style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1.5px dashed var(--card-border)',
                          padding: '20px',
                          borderRadius: '12px',
                          marginBottom: '18px'
                        }}>
                          <h5 style={{ fontWeight: '900', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--accent-color)' }}>
                            ✍️ N1 실시간 뉴스 받아쓰기 (Dictation Arena)
                          </h5>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.6' }}>
                            아래 뉴스 원문을 귀로 잘 청취하고, N1 단어가 들어갈 빈칸 [ 빈칸 ]을 맞춰 받아 적으세요!
                          </p>

                          {/* 빈칸 변환 원문 렌더링 */}
                          <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '14px 18px',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            lineHeight: '1.8',
                            marginBottom: '16px',
                            borderLeft: '4px solid var(--accent-color)'
                          }}>
                            {(() => {
                              let text = item.description;
                              item.n1Words.forEach((wordObj, wIdx) => {
                                text = text.replaceAll(wordObj.word, `[ 빈칸 ${wIdx + 1} ]`);
                              });
                              return text;
                            })()}
                          </div>

                          {/* 주관식 빈칸 기입 란 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {item.n1Words.map((wordObj, wIdx) => {
                              const isInputCorrect = dictationCorrects[wIdx];
                              return (
                                <div key={wIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                    [빈칸 {wIdx + 1}] 힌트: {wordObj.meaning} [{wordObj.reading}]
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="한자 또는 히라가나..."
                                    disabled={dictationChecked}
                                    value={dictationInputs[wIdx] || ''}
                                    onChange={(e) => setDictationInputs(prev => ({ ...prev, [wIdx]: e.target.value }))}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '0.85rem',
                                      border: `2px solid ${dictationChecked ? (isInputCorrect ? 'var(--accent-color)' : '#ff6b6b') : 'var(--card-border)'}`,
                                      borderRadius: '6px',
                                      background: 'var(--card-bg)',
                                      color: 'var(--text-primary)',
                                      outline: 'none',
                                      flexGrow: 1,
                                      maxWidth: '220px'
                                    }}
                                  />
                                  {dictationChecked && (
                                    <span style={{
                                      fontSize: '0.8rem',
                                      fontWeight: '800',
                                      color: isInputCorrect ? 'var(--accent-color)' : '#ff6b6b'
                                    }}>
                                      {isInputCorrect ? '✓ 정답!' : `✗ 오답 (정답: ${wordObj.word})`}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* 채점 및 제출 단추 */}
                          {!dictationChecked ? (
                            <button
                              onClick={() => handleDictationSubmit(item)}
                              className="glow-btn"
                              style={{ marginTop: '16px', padding: '8px 20px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              🔍 딕테이션 채점 및 제출
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setDictationChecked(false);
                                setDictationInputs({});
                                setDictationCorrects({});
                              }}
                              className="outline-btn"
                              style={{ marginTop: '16px', padding: '8px 20px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              🔄 다시 훈련하기
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="nhk-news-analysis-box">
                        {/* 1. N1 핵심 어휘집 */}
                        <div className="nhk-analysis-subsect">
                          <h5 className="nhk-subsect-title">🌸 N1 필수 시사 어휘</h5>
                          <div className="nhk-words-grid">
                            {item.n1Words && item.n1Words.length > 0 ? (
                              item.n1Words.map((wordObj, wIdx) => (
                                <div key={wIdx} className="nhk-word-chip-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="nhk-word-badge">{wordObj.word}</span>
                                    <div className="nhk-word-details">
                                      <span className="nhk-word-reading">[{wordObj.reading}]</span>
                                      <span className="nhk-word-meaning">{wordObj.meaning}</span>
                                    </div>
                                  </div>
                                  
                                  {/* 🌾 단어 즉시 수확 뱃지 */}
                                  <button
                                    onClick={() => handleHarvestWord(wordObj)}
                                    disabled={harvestedWords[wordObj.word] || harvestingWord === wordObj.word}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      borderRadius: '100px',
                                      border: '1.5px solid var(--card-border)',
                                      cursor: 'pointer',
                                      background: harvestedWords[wordObj.word] ? 'rgba(29, 209, 161, 0.1)' : 'rgba(84, 160, 255, 0.05)',
                                      color: harvestedWords[wordObj.word] ? '#1dd1a1' : 'var(--text-secondary)',
                                      borderColor: harvestedWords[wordObj.word] ? '#1dd1a1' : 'var(--card-border)',
                                      fontWeight: '800',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {harvestedWords[wordObj.word] ? '수확 완료! ✅' : harvestingWord === wordObj.word ? '🌾...' : '🌾 수확'}
                                  </button>
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

      {/* 🚀 모바일 전용 아레나 팝업 트리거 단축 버튼 (하단 플로팅 고정 고도화 - React Portal로 스태킹 컨텍스트 완벽 이탈) */}
      {mounted && createPortal(
        <div className="mobile-only animate-scale mo-arena-btn" style={{ 
          position: 'fixed', 
          bottom: '1.25rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '90%', 
          maxWidth: '26.25rem', 
          zIndex: 999999 
        }}>
          <button
            onClick={() => {
              // 기본값으로 첫 번째 스테이지가 선택된 채로 모달을 띄워줌
              setSelectedStage(initialStages[0]);
            }}
            className="glass-neon-btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.9375rem 1.25rem',
              fontSize: '0.92rem',
              borderRadius: '100px',
              boxShadow: 'var(--neon-glow)',
              backdropFilter: 'blur(0.75rem)',
              WebkitBackdropFilter: 'blur(0.75rem)',
              background: 'var(--card-bg)',
              border: '1.5px solid var(--accent-color)'
            }}
          >
            🏟️ N1 실전 아레나 챌린지 시작하기 ➔
          </button>
        </div>,
        document.body
      )}

      {/* 2. 대망의 5대 카테고리 독립형 실전 아레나 (PC 전용으로 모바일 은폐) */}
      <div className="arena-section-container pc-only">
        <h2 className="arena-section-title">
          🏟️ N1 실전 아레나 (N1 Premium Arenas)
        </h2>
        
        <div className="arena-cards-grid">
          {[...initialStages, {
            id: "virtual-stage-5-uuid",
            stageNumber: 5,
            title: "⚔️ 경어랑 조사 문장 조립",
            category: "ASSEMBLY",
            difficulty: "HARD",
            desc: "N1 킬러 경어와 격식 표현 단어 카드를 결합하여 유려한 격식 비즈니스 문장을 직조합니다."
          }, {
            id: "virtual-stage-6-uuid",
            stageNumber: 6,
            title: "📝 실전 15분 모의고사",
            category: "MOCK_EXAM",
            difficulty: "HARD",
            desc: "문자·어휘·문법 총 15문항을 N1 황금비율로 무작위 셔플 추출하여 15분 실전 모의고사를 극복합니다."
          }].map((stage) => {
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
                    {stage.desc || "5,000+개 N1 최고난도 기출 풀에서 무작위 라이브 추출"}
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

      {/* ==================== [3.0 JLPT 5대 아레나 실시간 통합 변경 + 상중하 난이도 조절 우아한 모달 팝업] ==================== */}
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
            maxWidth: '38.75rem',
            width: '92%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'center',
            padding: '1.5rem'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🏟️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '4px' }}>
              N1 실전 아레나 챌린지
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              도전하실 아레나 코스와 세부 난이도를 선택해 주세요!
            </p>

            {/* 1. 5대 아레나 실시간 코스 변환기 그리드 */}
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              🎯 코스 선택
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(6.25rem, 1fr))', gap: '0.375rem', marginBottom: '1.25rem' }}>
              {[...initialStages, {
                id: "virtual-stage-5-uuid",
                stageNumber: 5,
                title: "경어랑 조사 문장 조립",
                category: "ASSEMBLY",
                difficulty: "HARD"
              }, {
                id: "virtual-stage-6-uuid",
                stageNumber: 6,
                title: "실전 15분 모의고사",
                category: "MOCK_EXAM",
                difficulty: "HARD"
              }].map((stage) => {
                const meta = categoryMeta[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
                const isSelected = selectedStage.id === stage.id;
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
                      {meta.mobileTitle || stage.title}
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
                onClick={handleStartPlay}
                className="glow-btn"
                style={{ padding: '0.625rem 1.5rem', fontSize: '0.82rem', flex: 1 }}
              >
                아레나 입장 ➔
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
