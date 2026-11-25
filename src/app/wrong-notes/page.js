'use client';

import { useState, useEffect } from 'react';
import LearningBackupPanel from '@/app/components/LearningBackupPanel';
import { useLearningBackup } from '@/hooks/useLearningBackup';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import ReadableText from '@/app/ReadableText';

export default function WrongNotesPage() {
  const [loading, setLoading] = useState(true);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const { speak } = useJapaneseSpeech();

  // ⚡ 스마트 크로스 동기화 상태

  const [toastMessage, setToastMessage] = useState('');
  const [isSyncHubExpanded, setIsSyncHubExpanded] = useState(false); // 👈 접기 토글 상태 추가

  // 🧠 에빙하우스 SRS 필터 및 Refs
  const [isEbbinghausFilter, setIsEbbinghausFilter] = useState(false);

  // 1. 오답노트 목록 로드
  const loadWrongs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wrong-notes?ebbinghaus=${isEbbinghausFilter}`, {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setWrongAnswers(data.wrongAnswers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWrongs();
  }, [isEbbinghausFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. 오답 복습 해결 (오답노트에서 제외 혹은 단계 전이)
  const handleResolve = async (id) => {
    try {
      const res = await fetch('/api/wrong-notes', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isGraduated) {

          showToast("🎉 에빙하우스 복습을 완료해 이 단어를 정복했습니다!");
          setWrongAnswers(prev => prev.filter(item => item.id !== id));
        } else {
          showToast(`💪 복습 완료! 단계 상승 (LEVEL ${data.nextCount - 1} ➔ ${data.nextCount})`);
          // 💡 복습 완료된 단어는 오늘 훈련에서 즉시 목록 제외 피드백을 선사하여 혼선을 방지합니다!
          setWrongAnswers(prev => prev.filter(item => item.id !== id));
        }
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

  const backup = useLearningBackup({ type: 'wrong-notes', notify: message => showToast(message) });

  if (loading) {
    return (
      <div className="container page-loading">
        <span className="page-loading-icon">📓</span>
        <h3>오답 노트를 펼치는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container library-page review-page">

      {/* 뒤로가기 및 제목 헤더 */}
      <div className="page-intro">
        <h1>
          오답노트
        </h1>
        <p>
          헷갈렸던 문제를 다시 살펴보고, 복습할 내용을 정리하세요.
        </p>
      </div>

      {/* ⚡ 오답노트 전용 크로스 동기화 센터 */}
      <LearningBackupPanel type="wrong-notes" backup={backup} expanded={isSyncHubExpanded} onToggle={() => setIsSyncHubExpanded(value => !value)} />

      {/* 🧠 에빙하우스 5단계 복습 필터 탭 */}
      <div className="ebbinghaus-tab-bar">
        <button
          onClick={() => setIsEbbinghausFilter(false)}
          className={`outline-btn ebbinghaus-tab${!isEbbinghausFilter ? ' active' : ''}`}
          aria-pressed={!isEbbinghausFilter}
        >
          📓 전체 오답 노트 리스트
        </button>
        <button
          onClick={() => setIsEbbinghausFilter(true)}
          className={`outline-btn ebbinghaus-tab${isEbbinghausFilter ? ' active' : ''}`}
          aria-pressed={isEbbinghausFilter}
        >
          🧠 에빙하우스 과학적 복습 대상
          {isEbbinghausFilter && (
            <span className="ebbinghaus-today">
              TODAY
            </span>
          )}
        </button>
      </div>

      {wrongAnswers.length === 0 ? (
        /* 오답이 없을 때의 웰컴 피드백 */
        <div className="premium-card review-empty">
          <span className="review-empty-icon">✨</span>
          <h2>복습할 오답이 전혀 없습니다!</h2>
          <p>
            모든 퀴즈 문제를 완벽하게 통과하셨습니다. 정말 대단한 실력입니다!
          </p>
          <Link href="/" className="glow-btn review-empty-link">
            더 많은 퀴즈 도전하기 ➔
          </Link>
        </div>
      ) : (
        /* 오답 카드 목록 */
        <div className="wrong-list">

          {/* 머리글 설명 */}
          <div className="wrong-list-head">
            <span className="wrong-list-count">
              총 {wrongAnswers.length}개의 틀린 단어/문항 대기 중
            </span>
            <span className="wrong-list-hint">
              해결 완료 버튼을 누르면 이 리스트에서 소탕됩니다.
            </span>
          </div>

          {wrongAnswers.map((item, idx) => {
            const quiz = item.quiz;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="premium-card wrong-note-card"
              >
                {/* 오답 상세 정보 */}
                <div className="wrong-info-container">
                  {/* 에빙하우스 주기 레벨 배지 */}
                  <div className="wrong-review-meta">
                    <div className="wrong-review-level">
                      <span>LEVEL</span>
                      <span className="wrong-review-level-num">{item.reviewCount || 1}</span>
                    </div>
                    {/* 다음 복습 가능 상태 정보 계산 */}
                    {(() => {
                      const lastFailedTime = new Date(item.lastFailed).getTime();
                      const now = Date.now();
                      const diffHours = (now - lastFailedTime) / (1000 * 60 * 60);
                      const reviewCount = item.reviewCount || 1;

                      let targetHours = 24;
                      if (reviewCount === 2) targetHours = 72;
                      if (reviewCount === 3) targetHours = 168;
                      if (reviewCount === 4) targetHours = 360;
                      if (reviewCount === 5) targetHours = 720;

                      const remainingHours = targetHours - diffHours;

                      if (remainingHours <= 0) {
                        return (
                          <span className="wrong-review-state due">
                            🔥 복습 대기 완료
                          </span>
                        );
                      } else {
                        return (
                          <span className="wrong-review-state wait">
                            ⏳ {Math.ceil(remainingHours)}시간 대기
                          </span>
                        );
                      }
                    })()}
                  </div>

                  <div className="wrong-question-content">
                    {/* 원래 출제 문제 설명 */}
                    <span className="wrong-question-origin">
                      원래 질문: <ReadableText text={quiz.questionText
                        .replace(/\[N(1|2)-(EASY|MEDIUM|HARD)\]\s*/g, '')
                        .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
                        .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '')} />
                    </span>

                    {/* 단어 및 요미가나 */}
                    <div className="wrong-word-row">
                      <h4 className="wrong-word">
                        <ReadableText text={quiz.japaneseWord} />
                      </h4>
                      <span className="wrong-word-reading">
                        [{quiz.pronunciation}]
                      </span>
                    </div>

                    {/* 올바른 정답 표기 */}
                    <p className="wrong-answer">
                      ✓ 올바른 정답: {quiz.correctAnswer}
                    </p>
                  </div>
                </div>

                {/* 제어 버튼 묶음 */}
                <div className="wrong-btn-actions">
                  <button
                    onClick={() => speak(quiz.japaneseWord)}
                    className="outline-btn"
                  >
                    🔊 발음 듣기
                  </button>

                  <button
                    onClick={() => handleResolve(item.id)}
                    className="glow-btn"
                  >
                    ✓ 복습 완료!
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 🔮 동기화 피드백용 플로팅 토스트 메시지 연출 */}
      {toastMessage && (
        <div className="sync-toast-message-floating fade-in">
          <span className="sync-toast-icon">📢</span>
          <span className="sync-toast-text">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
