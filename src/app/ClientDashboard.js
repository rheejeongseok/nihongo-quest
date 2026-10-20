'use client';

import { useState, useEffect, useRef } from 'react';
import CalligraphyPractice from './components/CalligraphyPractice';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import DashboardOverview from './components/DashboardOverview';
import ArenaCourseGrid from './components/ArenaCourseGrid';
import { showToast } from '@/lib/toast';
import ReadableText from './ReadableText';
import { N1_COURSES, N1_EXAM } from '@/data/n1Courses.mjs';
import { BEGINNER_COURSES } from '@/data/beginnerCourses.mjs';
import { getJlptRegistration } from '@/data/jlptSchedule.mjs';

import { pickBeginnerConversations } from '@/data/beginnerConversations.mjs';

export default function ClientDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [targetLevel, setTargetLevel] = useState('N1');
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);

  // --- 🌱 왕초보 손글씨 캔버스 전용 상태 및 Refs ---
  const [isCalligraphyModalOpen, setIsCalligraphyModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('nihongo_quest_target_level') || 'N1';
      setTargetLevel(savedLevel);
    }

    const handleModalState = (e) => {
      setIsArenaModalOpen(e.detail?.open ?? false);
    };
    window.addEventListener('arena-modal-state', handleModalState);

    const handleOpenCalligraphy = () => {
      setIsCalligraphyModalOpen(true);
    };
    window.addEventListener('open-calligraphy-modal', handleOpenCalligraphy);

    return () => {
      window.removeEventListener('arena-modal-state', handleModalState);
      window.removeEventListener('open-calligraphy-modal', handleOpenCalligraphy);
    };
  }, []);

  const getDynamicStages = () => targetLevel === 'BEGINNER' ? BEGINNER_COURSES : [...N1_COURSES, N1_EXAM];

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
      }
    }
    loadUser();
  }, []);

  // 🌸 실시간 일본 뉴스 브리핑 상태
  const [nhkNews, setNhkNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [newsSource, setNewsSource] = useState('');
  const [expandedNews, setExpandedNews] = useState(null);
  const [shouldLoadNews, setShouldLoadNews] = useState(false);
  const newsSectionRef = useRef(null);
  const newsModalRef = useRef(null);
  const newsModalCloseRef = useRef(null);

  // 뉴스 딕테이션 및 즉시 수확 전용 상태들
  const { speak } = useJapaneseSpeech();
  const [dictatingNews, setDictatingNews] = useState(null);
  const [dictationInputs, setDictationInputs] = useState({});
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationCorrects, setDictationCorrects] = useState({});
  const [harvestedWords, setHarvestedWords] = useState({});
  const [harvestingWord, setHarvestingWord] = useState('');

  const closeNewsModal = () => {
    setExpandedNews(null);
    setDictatingNews(null);
    setDictationInputs({});
    setDictationChecked(false);
    setDictationCorrects({});
  };

  const openNewsModal = (index) => {
    setExpandedNews(index);
    setDictatingNews(null);
    setDictationInputs({});
    setDictationChecked(false);
    setDictationCorrects({});
  };

  const moveNewsModal = (direction) => {
    if (nhkNews.length < 2 || expandedNews === null) return;
    openNewsModal((expandedNews + direction + nhkNews.length) % nhkNews.length);
  };

  useEffect(() => {
    if (expandedNews === null) return;

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeNewsModal();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = newsModalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => newsModalCloseRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.speechSynthesis?.cancel();
      previousActiveElement?.focus?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, expandedNews]);

  // 📅 JLPT D-Day 연산 전용 상태 및 유틸
  const [examInfo, setExamInfo] = useState({ type: '', dateStr: '' });
  const [registrationInfo, setRegistrationInfo] = useState({ status: '', label: '' });

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

    setRegistrationInfo(getJlptRegistration(exam.date));

  }, []);

  // 실시간 뉴스 로드 함수 (최초 로드 + 새로고침 버튼 공용)
  const fetchNhkNews = async (isRefresh = false) => {
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('nihongo_quest_target_level') || 'N1';
      if (savedLevel === 'BEGINNER') {
        setNhkNews(pickBeginnerConversations());
        setExpandedNews(null);
        setDictatingNews(null);
        setNewsSource('beginner');
        setNewsLoading(false);
        return;
      }
    }
    try {
      if (isRefresh) setNewsRefreshing(true);
      else setNewsLoading(true);
      const newsUrl = isRefresh ? '/api/nhk-news?refresh=true' : '/api/nhk-news';
      const res = await fetch(newsUrl);
      const data = await res.json();
      if (data.success) {
        setNhkNews(data.news);
        setNewsSource(data.source || 'premium-fallback');
        setExpandedNews(null); // 새로고침 시 열린 아코디언 닫기
        setDictatingNews(null);
      }
    } catch (e) {
      console.error("일본 뉴스 로드 에러:", e);
    } finally {
      setNewsLoading(false);
      setNewsRefreshing(false);
    }
  };

  // 뉴스 카드가 화면에 가까워졌을 때만 데이터 로드를 시작한다.
  useEffect(() => {
    if (shouldLoadNews) return;

    const newsSection = newsSectionRef.current;
    if (!newsSection || typeof IntersectionObserver === 'undefined') {
      setShouldLoadNews(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadNews(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(newsSection);
    return () => observer.disconnect();
  }, [shouldLoadNews]);

  // 관찰 지점에 도달한 뒤에만 뉴스 또는 초보 회화 데이터를 준비한다.
  useEffect(() => {
    if (!shouldLoadNews) return;
    fetchNhkNews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLevel, shouldLoadNews]);

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
        showToast(`🌾 ${targetLevel === 'BEGINNER' ? '기초' : 'N1'} 단어 즉시 수확 성공!\n[${wordObj.word}] 단어가 나의 단어장에 수집되었습니다.`);
      } else {
        showToast("수확 실패: " + data.error, 'error');
      }
    } catch (e) {
      showToast("수확 실패 네트워크 에러: " + e.message, 'error');
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
      showToast(`🎉 퍼펙트! 모든 ${targetLevel === 'BEGINNER' ? '기초 회화' : 'N1 시사'} 빈칸을 정확하게 받아적으셨습니다! (+50pts 보너스)`);
      if (user) {
        setUser(prev => prev ? { ...prev, points: prev.points + 50 } : null);
      }
    } else {
      showToast("✍️ 채점 완료! 일부 빈칸을 확인해보세요. 오답 단어는 즉시 수확하여 공부할 수 있습니다!");
    }
  };

  // 스테이지별 이모지 및 색상 매핑
  const categoryMeta = {
    CALLIGRAPHY: { emoji: '🌱', color: '#486b48', label: '손글씨 연습', mobileTitle: '글자쓰기' },
    CHARACTERS: { emoji: '🌸', color: '#ff9494', label: '문자 정복', mobileTitle: '문자어휘' },
    VOCAB: { emoji: '🍱', color: '#ffb37e', label: '어휘 마스터', mobileTitle: '어휘마스터' },
    GRAMMAR: { emoji: '⚙️', color: '#a6cf98', label: '문법 조사', mobileTitle: '문법조사' },
    LISTENING: { emoji: '🎧', color: '#90b4fc', label: '청해 배틀', mobileTitle: '청해배틀' },
    READING: { emoji: '📖', color: '#b19ffb', label: '독해', mobileTitle: '독해' },
    WORDLE: { emoji: '🧩', color: '#b19ffb', label: '단어 워들', mobileTitle: '단어워들' },
    ASSEMBLY: { emoji: '⚔️', color: '#ffd32a', label: '문장 조립', mobileTitle: '문장조립' },
    MOCK_EXAM: { emoji: '📝', color: '#ff5e7e', label: '모의고사', mobileTitle: '모의고사' }
  };


  const openDifficultyModal = (stage, selectCourse = false) => {
    if (stage.href) { router.push(stage.href); return; }
    if (stage.category === 'CALLIGRAPHY') {
      setIsCalligraphyModalOpen(true);
      return;
    }
    if (targetLevel === 'N1' && !selectCourse) {
      router.push(`/play/${stage.stageNumber}?jlptLevel=N1&category=${stage.category}`);
      return;
    }
    const allStagesList = getDynamicStages();
    const idx = allStagesList.findIndex(s => s.stageNumber === stage.stageNumber && s.category === stage.category);
    window.dispatchEvent(new CustomEvent('open-arena-modal', { detail: { stageIndex: idx !== -1 ? idx : 0, selectCourse } }));
  };

  // 🏟️ 다른 페이지에서 드로워 메뉴 클릭 후 넘어온 경우 파라미터 감지
  useEffect(() => {
    const allStagesList = getDynamicStages();
    if (searchParams.get('practiceWriting') === '1') {
      setIsCalligraphyModalOpen(true);
      router.replace('/');
      return;
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, targetLevel]);

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
    <div className="quest-dashboard">
      <div className="home-track-switch" role="group" aria-label="학습 트랙 선택">
        {[['N1', 'N1 마스터'], ['BEGINNER', '초보 스타터']].map(([level, label]) => <button key={level} type="button"
          aria-pressed={targetLevel === level} onClick={() => {
            if (targetLevel === level) return;
            localStorage.setItem('nihongo_quest_target_level', level);
            window.location.assign('/');
          }}>{label}</button>)}
      </div>
      <DashboardOverview targetLevel={targetLevel} examInfo={examInfo} registrationInfo={registrationInfo} handleMouseMove={handleMouseMove} handleMouseLeave={handleMouseLeave} />
      {/* PC와 모바일 모두 메인에서 코스를 직접 선택한다. */}
      <ArenaCourseGrid targetLevel={targetLevel} getDynamicStages={getDynamicStages} categoryMeta={categoryMeta} handleMouseMove={handleMouseMove} handleMouseLeave={handleMouseLeave} router={router} openDifficultyModal={openDifficultyModal} />

      {/* 뉴스 및 회화 브리핑 */}
      <div ref={newsSectionRef} className="glass-premium-card rainbow-border nhk-news-briefing-card">
        <div className="nhk-news-header">
          <div className="nhk-news-header-title-box">
            <span className="section-eyebrow">{targetLevel === 'BEGINNER' ? 'LISTEN & LEARN' : 'READ & DISCOVER'}</span>
            <h2 className="nhk-news-header-title">
              {targetLevel === 'BEGINNER' ? '일상 회화로 한 걸음 더' : '뉴스로 만나는 일본어'}
            </h2>
            <p className="nhk-news-header-desc">
              {targetLevel === 'BEGINNER'
                ? '일상회화 100개 중 무작위 5개로 연습해 보세요.'
                : '일본의 오늘을 읽으며, 문맥 속 어휘를 익혀 보세요.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`nhk-status-badge ${targetLevel === 'BEGINNER' || newsSource === 'the-news-api' ? 'realtime' : 'fallback'}`}>
              {newsLoading
                ? '불러오는 중'
                : targetLevel === 'BEGINNER'
                  ? '회화 5편'
                  : newsSource === 'the-news-api'
                    ? `오늘의 뉴스 ${nhkNews.length}편`
                    : newsSource === 'the-news-api-stale'
                      ? `보관 뉴스 ${nhkNews.length}편`
                    : newsSource === 'nhk-rss-fallback'
                      ? `NHK ${nhkNews.length}편`
                      : `학습 뉴스 ${nhkNews.length}편`}
            </span>
            {/* 뉴스와 초보 회화 모두 다른 학습 자료를 다시 뽑을 수 있다. */}
              <button
                onClick={() => fetchNhkNews(true)}
                disabled={newsLoading || newsRefreshing}
                title={targetLevel === 'BEGINNER' ? '회화 5개 다시 뽑기' : '저장된 뉴스에서 다시 뽑기'}
                aria-label={targetLevel === 'BEGINNER' ? '회화 5개 다시 뽑기' : '뉴스 다시 뽑기'}
                className="news-refresh-button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  border: '1.5px solid var(--card-border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: (newsLoading || newsRefreshing) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  animation: newsRefreshing ? 'spin 0.8s linear infinite' : 'none',
                  opacity: (newsLoading || newsRefreshing) ? 0.5 : 1
                }}
              >
                ↻
              </button>
          </div>
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
                  <button
                    type="button"
                     className="nhk-news-item-trigger"
                     onClick={() => openNewsModal(idx)}
                     aria-haspopup="dialog"
                     aria-expanded={isExpanded}
                  >
                    <div className="nhk-news-item-title-row">
                      <span className="news-item-number" aria-hidden="true">{String(idx + 1).padStart(2, '0')}</span>
                      <h4 className="nhk-news-item-title"><ReadableText text={item.title} /></h4>

                      <span className="nhk-toggle-arrow" aria-hidden="true">↗</span>
                    </div>
                    {idx === 0 && item.description && <p className="news-lead-description"><ReadableText text={item.description.replace(/<[^>]*>/g, '').slice(0, 140)} /></p>}
                    <div className="nhk-news-meta-row">
                      <span className="nhk-meta-date">
                        {item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '최신 시사'}
                      </span>
                      <span className="nhk-meta-category">
                        {targetLevel === 'BEGINNER' ? '초보 일상회화' : `${item.sourceName || '일본 뉴스'} · N1 사회시사`}
                      </span>
                    </div>
                  </button>

                  {/* 선택한 뉴스는 Portal 모달에서 학습 기능과 함께 표시 */}
                  {isExpanded && mounted && createPortal(
                    <div
                      className="news-detail-modal-overlay"
                      onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeNewsModal();
                      }}
                    >
                      <section
                        ref={newsModalRef}
                        className="news-detail-modal"
                        data-draggable-modal
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`news-modal-title-${idx}`}
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        <header data-modal-drag-handle className="news-detail-modal-header">
                          <div className="news-detail-modal-heading">
                            <span className="news-detail-modal-eyebrow">
                              {targetLevel === 'BEGINNER' ? '🌸 일상 회화 학습' : `📰 ${item.sourceName || '일본 뉴스'}`}
                            </span>
                            <h2 id={`news-modal-title-${idx}`}><ReadableText text={item.title} /></h2>
                            <div className="news-detail-modal-meta">
                              <span>
                                {item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : '최신 시사'}
                              </span>
                              <span>{targetLevel === 'BEGINNER' ? '초보 일상회화' : 'N1 사회시사'}</span>
                            </div>
                          </div>
                          <button
                            ref={newsModalCloseRef}
                            type="button"
                            className="news-detail-modal-close"
                            onClick={closeNewsModal}
                            aria-label="뉴스 상세 닫기"
                          >
                            ✕
                          </button>
                        </header>

                        <div className="news-detail-modal-body nhk-accordion-content fade-in">
                          {targetLevel !== 'BEGINNER' && (
                            <p className="news-detail-modal-notice">
                              API가 제공하는 일본어 기사 지문입니다. 전체 내용은 아래 원문 링크에서 확인할 수 있어요.
                            </p>
                          )}
                      <p className="nhk-news-raw-desc">
                        <strong>{targetLevel === 'BEGINNER' ? '[회화 지문]' : '[일본어 원문]'}</strong><br />
                        <ReadableText text={item.description} />
                      </p>

                      {/* 딕테이션 버튼 그룹 */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => speak(item.description)}
                          className="outline-btn"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          🔊 전체 지문 발음 청취 (TTS)
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
                          🎧 {targetLevel === 'BEGINNER' ? '기초 회화' : 'N1 뉴스'} 딕테이션 {dictatingNews === idx ? '종료' : '훈련 시작'}
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
                            ✍️ {targetLevel === 'BEGINNER' ? '왕초보 일상 회화' : 'N1 실시간 뉴스'} 받아쓰기
                          </h5>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.6' }}>
                            아래 지문을 귀로 잘 청취하고, 빈칸에 들어갈 기초 단어를 맞춰 적어 보세요!
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
                        {/* 1. 핵심 어휘집 */}
                        <div className="nhk-analysis-subsect">
                          <h5 className="nhk-subsect-title">🌸 {targetLevel === 'BEGINNER' ? '왕초보 필수 어휘' : 'N1 필수 시사 어휘'}</h5>
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
                          <h5 className="nhk-subsect-title">📓 한국어 번역 가이드</h5>
                          <p className="nhk-translation-text">{item.translation}</p>
                        </div>
                      </div>

                      {/* 하단 단독 원문 앵커 링크 */}
                      <div className="nhk-item-footer">
                        {nhkNews.length > 1 && (
                          <div className="news-detail-modal-navigation" aria-label="다른 뉴스 보기">
                            <button type="button" className="outline-btn" onClick={() => moveNewsModal(-1)}>
                              ← 이전 뉴스
                            </button>
                            <span>{idx + 1} / {nhkNews.length}</span>
                            <button type="button" className="outline-btn" onClick={() => moveNewsModal(1)}>
                              다음 뉴스 →
                            </button>
                          </div>
                        )}
                        <a
                          href={targetLevel === 'BEGINNER' ? 'https://ja.dict.naver.com/#/main' : item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nhk-raw-link-btn"
                        >
                          {targetLevel === 'BEGINNER' ? '네이버 일본어 사전 바로가기 🔗' : '기사 원문 보기 🔗'}
                        </a>
                      </div>
                        </div>
                      </section>
                    </div>,
                    document.body
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🚀 모바일 전용 아레나 팝업 트리거 단축 버튼 (하단 플로팅 고정 고도화 - React Portal로 스태킹 컨텍스트 완벽 이탈) */}
      {mounted && !isArenaModalOpen && createPortal(
        <div className="mobile-only animate-scale mo-arena-btn" style={{
          position: 'fixed',
          bottom: 'max(12px, env(safe-area-inset-bottom))',
          right: 'calc(max(12px, env(safe-area-inset-right)) + 60px)',
          zIndex: 4100
        }}>
          <button
            onClick={() => {
              const startStage = getDynamicStages()[0];
              openDifficultyModal(startStage, true);
            }}
            className="glass-neon-btn"
            aria-label="아레나 코스 선택"
            title="아레나 코스 선택"
            style={{
              width: '48px',
              height: '48px',
              justifyContent: 'center',
              padding: 0,
              fontSize: '1.4rem',
              borderRadius: '100px',
              boxShadow: 'var(--neon-glow)',
              backdropFilter: 'blur(0.75rem)',
              WebkitBackdropFilter: 'blur(0.75rem)',
              background: 'var(--card-bg)',
              border: '1.5px solid var(--accent-color)'
            }}
          >
            <span aria-hidden="true">🏟️</span>
          </button>
        </div>,
        document.body
      )}

      {/* ==================== [3.0 JLPT 5대 아레나 실시간 통합 변경 + 상중하 난이도 조절 우아한 모달 팝업] ==================== */}
      {/* 공통 Header.js 에서 관리하는 글로벌 아레나 모달이 렌더링되므로, 이 파일 내 중복 팝업은 완전 제거합니다. */}

      {/* 🎉 50음도 그리기 성공 축하 Confetti 포탈 렌더링 */}
      {mounted && <CalligraphyPractice open={isCalligraphyModalOpen} targetLevel={targetLevel} onClose={() => setIsCalligraphyModalOpen(false)} setUser={setUser} />}

    </div>
  );
}
