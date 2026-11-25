'use client';

import { useState, useEffect } from 'react';
import LearningBackupPanel from '@/app/components/LearningBackupPanel';
import { useLearningBackup } from '@/hooks/useLearningBackup';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';
import WordDetailModal from '@/app/components/WordDetailModal';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { getExampleSentence } from '@/utils/exampleSentences';
import ReadableText from '@/app/ReadableText';

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const { speak } = useJapaneseSpeech();

  // ⚡ 스마트 크로스 동기화 상태

  const [toastMessage, setToastMessage] = useState('');
  const [isSyncHubExpanded, setIsSyncHubExpanded] = useState(false); // 👈 접기 토글 상태 추가

  // 🍿 상세 예문 모달 상태
  const [selectedWord, setSelectedWord] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [targetLevel, setTargetLevel] = useState('N1');

  // --- 🗂️ 3D 플래시 카드 상태 관리 ---
  const [isFlashCardMode, setIsFlashCardMode] = useState(false);
  const [cardQueue, setCardQueue] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [memorizedIds, setMemorizedIds] = useState([]);
  const [sessionTotalCount, setSessionTotalCount] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setMounted(true);
    setTargetLevel(localStorage.getItem('nihongo_quest_target_level') === 'BEGINNER' ? 'BEGINNER' : 'N1');
  }, []);

  // 플래시 카드 모드 온오프 처리
  const handleToggleFlashcardMode = (enable) => {
    if (enable) {
      if (bookmarks.length === 0) {
        showToast("암기할 단어가 없습니다! 먼저 단어를 추가해 주세요.");
        return;
      }
      // 단어장 단어 셔플하여 큐 생성
      const shuffled = [...bookmarks].sort(() => Math.random() - 0.5);
      setCardQueue(shuffled);
      setCurrentCardIndex(0);
      setCardFlipped(false);
      setMemorizedIds([]);
      setSessionTotalCount(shuffled.length);
      setIsFlashCardMode(true);
    } else {
      setIsFlashCardMode(false);
    }
  };

  // 카드 뒤집기
  const handleCardClick = () => {
    const nextFlipped = !cardFlipped;
    setCardFlipped(nextFlipped);

    // 뒤집어서 뒷면(뜻/예문)이 보일 때 자동으로 TTS 음성 출력 연동
    if (nextFlipped && cardQueue[currentCardIndex]) {
      speak(cardQueue[currentCardIndex].word);
    }
  };

  // 파티클 생성 함수 (미세 폭죽 연출)
  const spawnParticles = (clientX, clientY) => {
    const emojis = ['💚', '✨', '🎉', '🍀', '🌸', '💫'];
    const newParticles = Array.from({ length: 18 }).map((_, i) => {
      const angle = (i / 18) * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      return {
        id: Date.now() + i + Math.random(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: clientX || window.innerWidth / 2,
        y: clientY || window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // 약간 위로 솟구치게
        alpha: 1,
        scale: Math.random() * 0.7 + 0.6
      };
    });
    setParticles(prev => [...prev, ...newParticles]);
  };

  // 파티클 프레임 업데이트 효과
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.35, // 중력
            alpha: p.alpha - 0.03
          }))
          .filter(p => p.alpha > 0)
      );
    }, 25);
    return () => clearInterval(timer);
  }, [particles]);

  // 완벽히 외웠음! 처리
  const handleMemorized = (e) => {
    e.stopPropagation();
    if (!cardQueue[currentCardIndex]) return;

    // 마우스 클릭 위치 구해서 폭죽 터뜨리기
    const clientX = e.clientX;
    const clientY = e.clientY;
    spawnParticles(clientX, clientY);

    const currentWord = cardQueue[currentCardIndex];
    if (!memorizedIds.includes(currentWord.id)) {
      setMemorizedIds(prev => [...prev, currentWord.id]);
    }

    // 카드 초기화 후 다음 카드로 진행
    setCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(prev => prev + 1);
    }, 250); // 부드러운 전환을 위한 딜레이
  };

  // 아직 헷갈림! 처리
  const handleConfused = (e) => {
    e.stopPropagation();
    if (!cardQueue[currentCardIndex]) return;

    const currentWord = cardQueue[currentCardIndex];
    // 해당 단어를 큐 맨 뒤에 다시 이관하여 반복 훈련 처리
    setCardQueue(prev => [...prev, currentWord]);

    // 카드 초기화 후 다음 카드로 진행
    setCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(prev => prev + 1);
    }, 250);
  };

  // 1. 단어장 단어 로드
  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch('/api/bookmarks', {
          headers: getSyncHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.bookmarks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  // 2. 단어 삭제 처리
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const backup = useLearningBackup({ type: 'bookmarks', notify: message => showToast(message) });

  if (loading) {
    return (
      <div className="container page-loading">
        <span className="page-loading-icon">⭐</span>
        <h3>단어장을 열고 정렬하는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container library-page vocabulary-page">

      {/* 뒤로가기 및 헤더 */}
      <div className="page-intro vocab-intro">
        <div>
          <h1>
            단어장
          </h1>
          <p>
            저장한 단어를 다시 읽고, 발음을 들으며 익혀 보세요.
          </p>
        </div>

        {/* 🗂️ 3D 플래시 카드 암기 모드 토글 */}
        {bookmarks.length > 0 && (
          <div className="flashcard-toggle-wrapper glass-premium-card">
            <span className="flashcard-toggle-label">
              플래시카드로 복습
            </span>
            <label className="flashcard-switch">
              <input
                type="checkbox"
                checked={isFlashCardMode}
                onChange={(e) => handleToggleFlashcardMode(e.target.checked)}
              />
              <span className="flashcard-slider"></span>
            </label>
          </div>
        )}
      </div>

      {isFlashCardMode ? (
        /* ==========================================
           🗂️ 3D 플래시 카드 암기 모드 컨텐츠
           ========================================== */
        <div className="flashcard-mode-section fade-in">

          {/* 1. 진행 스탯 바 */}
          <div className="flashcard-progress-container glass-premium-card">
            <div className="flashcard-stat-text">
              <span>🚀 {targetLevel === 'BEGINNER' ? '기초 단어' : 'JLPT N1 단어'} 완벽 소탕 진행중</span>
              <span className="flashcard-stat-done">
                {memorizedIds.length} / {sessionTotalCount} 개 암기 완료 ({sessionTotalCount > 0 ? Math.round((memorizedIds.length / sessionTotalCount) * 100) : 0}%)
              </span>
            </div>
            <div className="flashcard-progress-bar-bg">
              <div
                className="flashcard-progress-bar-fill"
                style={{ width: `${sessionTotalCount > 0 ? (memorizedIds.length / sessionTotalCount) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="flashcard-progress-note">
              완벽히 외운 단어는 영구 제외되며, 헷갈리는 단어는 큐의 맨 뒤로 이동해 무한 순환합니다.
            </p>
          </div>

          {currentCardIndex < cardQueue.length ? (
            /* 훈련 진행 중 */
            <div>
              {/* 3D 카드 영역 */}
              <div className="flashcard-container">
                <div
                  className={`flashcard ${cardFlipped ? 'flipped' : ''}`}
                  onClick={handleCardClick}
                >
                  {/* 앞면: 단어명 & 읽기 */}
                  <div className="flashcard-face flashcard-front">
                    <span className="flashcard-tag">{targetLevel === 'BEGINNER' ? 'BEGINNER VOCAB' : 'JLPT N1 VOCAB'}</span>

                    <div className="flashcard-front-body">
                      <h2 className="flashcard-word">{cardQueue[currentCardIndex].word}</h2>
                      <p className="flashcard-reading">「{cardQueue[currentCardIndex].reading}」</p>
                    </div>

                    <div className="flashcard-hint-text">
                      <span>💡 탭하여 의미 및 예문 확인</span>
                    </div>
                  </div>

                  {/* 뒷면: 한글 뜻 & 문장 예문 */}
                  <div className="flashcard-face flashcard-back" onClick={(e) => e.stopPropagation()}>
                    <span className="flashcard-tag meaning">
                      MEANING & EXAMPLE
                    </span>

                    <div className="flashcard-back-body">
                      <h3 className="flashcard-meaning">{cardQueue[currentCardIndex].meaning}</h3>
                      <button
                        onClick={() => speak(cardQueue[currentCardIndex].word)}
                        className="outline-btn flashcard-speak"
                      >
                        🔊 발음 재생
                      </button>
                    </div>

                    {/* 실전 예문 */}
                    <div className="flashcard-example-box">
                      <p className="flashcard-example-jp">
                        <ReadableText text={getExampleSentence(cardQueue[currentCardIndex].word, cardQueue[currentCardIndex].meaning).sentence} />
                      </p>
                      <p className="flashcard-example-kr">
                        {getExampleSentence(cardQueue[currentCardIndex].word, cardQueue[currentCardIndex].meaning).translation}
                      </p>
                      <button
                        onClick={() => speak(getExampleSentence(cardQueue[currentCardIndex].word, cardQueue[currentCardIndex].meaning).sentence)}
                        className="flashcard-example-speak"
                      >
                        🔊 예문 듣기
                      </button>
                    </div>

                    <div className="flashcard-hint-text flip-back" onClick={handleCardClick}>
                      <span>👈 카드를 다시 뒤집기</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제어 버튼 영역 */}
              <div className="flashcard-actions">
                <button
                  onClick={handleConfused}
                  className="outline-btn flashcard-confused"
                >
                  🧡 아직 헷갈림 (순환 학습)
                </button>

                <button
                  onClick={handleMemorized}
                  className="glow-btn flashcard-memorized"
                >
                  💚 완벽히 외웠음 (큐 제거)
                </button>
              </div>
            </div>
          ) : (
            /* 훈련 종료 세션 */
            <div className="premium-card fade-in flashcard-done">
              <span className="flashcard-done-icon">🏆</span>
              <h2>
                단어장 완벽 소탕 완료!
              </h2>
              <p>
                축하합니다! 현재 단어장에 등록된 모든 단어를 완벽히 암기하셨습니다.
              </p>

              <div className="glass-premium-card flashcard-report">
                <h4>📊 학습 세션 레포트</h4>
                <div className="flashcard-report-row">
                  <span>고유 단어 수</span>
                  <b>{sessionTotalCount} 개</b>
                </div>
                <div className="flashcard-report-row">
                  <span>헷갈림 극복 추가 훈련</span>
                  <b className="confused">{cardQueue.length - sessionTotalCount} 회</b>
                </div>
                <div className="flashcard-report-row total">
                  <b>최종 암기 성공률</b>
                  <b className="success">100% (만점 보장)</b>
                </div>
              </div>

              <div className="flashcard-done-actions">
                <button
                  onClick={() => handleToggleFlashcardMode(true)}
                  className="glow-btn retry"
                >
                  🔄 다시 훈련하기
                </button>
                <button
                  onClick={() => setIsFlashCardMode(false)}
                  className="outline-btn"
                >
                  📖 단어 리스트로 가기
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ==========================================
           📖 기존 단어장 목록 및 동기화 허브
           ========================================== */
        <>
          {/* ⚡ 단어장 전용 크로스 동기화 센터 */}
          <LearningBackupPanel type="bookmarks" backup={backup} expanded={isSyncHubExpanded} onToggle={() => setIsSyncHubExpanded(value => !value)} />

          {bookmarks.length === 0 ? (
            /* 단어장이 비어 있을 때의 웰컴 카드 */
            <div className="premium-card review-empty">
              <span className="review-empty-icon">📖</span>
              <h2>단어장이 비어 있습니다!</h2>
              <p>
                퀴즈 플레이 도중 마음에 드는 단어나 헷갈리는 문자를 보면 <strong>[나의 단어장 추가]</strong>를 꾹 눌러보세요.
              </p>
              <Link href="/" className="glow-btn review-empty-link">
                퀴즈 풀고 단어 수집하러 가기 ➔
              </Link>
            </div>
          ) : (
            /* 단어장 리스트 */
            <div className="vocab-list">

              <div className="vocab-list-head">
                <span>
                  저장된 소중한 영단어/일어단어: 총 {bookmarks.length}개
                </span>
              </div>

              <div className="vocabulary-grid">
                {bookmarks.map((item) => (
                  <div
                    key={item.id}
                    className="premium-card vocab-card"
                    onClick={() => setSelectedWord(item)}
                  >
                    <div>
                      {/* 단어의 요미가나 표기 */}
                      <span className="vocab-reading">
                        {item.reading}
                      </span>

                      {/* 단어 본문 */}
                      <h4 className="vocab-word">
                        <ReadableText text={item.word} />
                      </h4>

                      {/* 단어 뜻 */}
                      <p className="vocab-meaning">
                        {item.meaning}
                      </p>
                    </div>

                    {/* 제어 버튼 */}
                    <div className="vocab-actions"
                      onClick={(e) => e.stopPropagation()} // 💡 모달 팝업 버블링 차단!
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 💡 버블링 차단!
                          speak(item.word);
                        }}
                        className="vocab-btn"
                      >
                        🔊 재생
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 💡 버블링 차단!
                          handleDelete(item.id);
                        }}
                        className="vocab-btn delete"
                      >
                        🗑️ 제거
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}
        </>
      )}

      {/* 🔮 동기화 피드백용 플로팅 토스트 메시지 연출 */}
      {toastMessage && (
        <div className="sync-toast-message-floating fade-in">
          <span className="sync-toast-icon">📢</span>
          <span className="sync-toast-text">{toastMessage}</span>
        </div>
      )}

      {/* 🔮 [단어 디테일 예문 보기 프리미엄 모달] */}
      {selectedWord && mounted && <WordDetailModal selectedWord={selectedWord} setSelectedWord={setSelectedWord} speak={speak} />}

      {/* 🎆 미세 폭죽 파티클 애니메이션 레이어 */}
      {particles.map(p => (
        <span
          key={p.id}
          className="burst-particle"
          style={{ left: p.x, top: p.y, transform: `translate(-50%, -50%) scale(${p.scale})`, opacity: p.alpha }}
        >
          {p.emoji}
        </span>
      ))}

    </div>
  );
}
