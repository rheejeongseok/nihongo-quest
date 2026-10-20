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
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>📓</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>오답 노트를 펼치는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container library-page review-page" style={{ maxWidth: '1280px', padding: '40px 24px' }}>

      {/* 뒤로가기 및 제목 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        {/* <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
          ← 메인으로 이동
        </Link> */}
        <h1 style={{ fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          오답노트
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          헷갈렸던 문제를 다시 살펴보고, 복습할 내용을 정리하세요.
        </p>
      </div>

      {/* ⚡ 오답노트 전용 크로스 동기화 센터 */}
      <LearningBackupPanel type="wrong-notes" backup={backup} expanded={isSyncHubExpanded} onToggle={() => setIsSyncHubExpanded(value => !value)} />

      {/* 🧠 에빙하우스 5단계 복습 필터 탭 */}
      <div className="ebbinghaus-tab-bar" style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid var(--card-border)',
        paddingBottom: '16px'
      }}>
        <button
          onClick={() => setIsEbbinghausFilter(false)}
          className={`outline-btn ${!isEbbinghausFilter ? 'active' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '0.9rem',
            fontWeight: '800',
            borderColor: !isEbbinghausFilter ? 'var(--accent-color)' : 'var(--card-border)',
            color: !isEbbinghausFilter ? 'var(--accent-color)' : 'var(--text-secondary)',
            background: !isEbbinghausFilter ? 'rgba(84, 160, 255, 0.05)' : 'transparent',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          📓 전체 오답 노트 리스트
        </button>
        <button
          onClick={() => setIsEbbinghausFilter(true)}
          className={`outline-btn ${isEbbinghausFilter ? 'active' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '0.9rem',
            fontWeight: '800',
            borderColor: isEbbinghausFilter ? 'var(--accent-color)' : 'var(--card-border)',
            color: isEbbinghausFilter ? 'var(--accent-color)' : 'var(--text-secondary)',
            background: isEbbinghausFilter ? 'rgba(84, 160, 255, 0.05)' : 'transparent',
            position: 'relative',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          🧠 에빙하우스 과학적 복습 대상
          {isEbbinghausFilter && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: '#ff6b6b', color: 'white', fontSize: '0.7rem',
              fontWeight: '900', padding: '2px 6px', borderRadius: '100px',
              animation: 'pulse 1s infinite'
            }}>
              TODAY
            </span>
          )}
        </button>
      </div>

      {wrongAnswers.length === 0 ? (
        /* 오답이 없을 때의 웰컴 피드백 */
        <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '16px' }}>✨</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>복습할 오답이 전혀 없습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            모든 퀴즈 문제를 완벽하게 통과하셨습니다. 정말 대단한 실력입니다!
          </p>
          <Link href="/" className="glow-btn" style={{ padding: '12px 30px', textDecoration: 'none' }}>
            더 많은 퀴즈 도전하기 ➔
          </Link>
        </div>
      ) : (
        /* 오답 카드 목록 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 머리글 설명 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--card-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
              총 {wrongAnswers.length}개의 틀린 단어/문항 대기 중
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
              해결 완료 버튼을 누르면 이 리스트에서 소탕됩니다.
            </span>
          </div>

          {wrongAnswers.map((item, idx) => {
            const quiz = item.quiz;
            return (
              <div
                key={`${item.id}-${idx}`}
                className="premium-card wrong-note-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px 30px',
                  borderColor: 'rgba(255, 107, 107, 0.2)'
                }}
              >
                {/* 오답 상세 정보 */}
                <div className="wrong-info-container" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexGrow: 1, marginRight: '24px' }}>
                  {/* 에빙하우스 주기 레벨 배지 */}
                  <div className="wrong-review-meta" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <div className="wrong-review-level" style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255, 107, 107, 0.06)',
                      border: '2px solid #ff6b6b',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ff6b6b',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}>
                      <span>LEVEL</span>
                      <span style={{ fontSize: '1.2rem', marginTop: '-3px', fontWeight: '950' }}>{item.reviewCount || 1}</span>
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
                          <span style={{ fontSize: '0.7rem', color: '#1dd1a1', fontWeight: '900', background: 'rgba(29, 209, 161, 0.1)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(29, 209, 161, 0.2)' }}>
                            🔥 복습 대기 완료
                          </span>
                        );
                      } else {
                        return (
                          <span style={{ fontSize: '0.7rem', color: '#ff9f43', fontWeight: '800', background: 'rgba(255, 159, 67, 0.1)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(255, 159, 67, 0.2)' }}>
                            ⏳ {Math.ceil(remainingHours)}시간 대기
                          </span>
                        );
                      }
                    })()}
                  </div>

                  <div className="wrong-question-content">
                    {/* 원래 출제 문제 설명 */}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      원래 질문: <ReadableText text={quiz.questionText
                        .replace(/\[N(1|2)-(EASY|MEDIUM|HARD)\]\s*/g, '')
                        .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
                        .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '')} />
                    </span>

                    {/* 단어 및 요미가나 */}
                    <div className="wrong-word-row" style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                      <h4 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        <ReadableText text={quiz.japaneseWord} />
                      </h4>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        [{quiz.pronunciation}]
                      </span>
                    </div>

                    {/* 올바른 정답 표기 */}
                    <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700' }}>
                      ✓ 올바른 정답: {quiz.correctAnswer}
                    </p>
                  </div>
                </div>

                {/* 제어 버튼 묶음 */}
                <div className="wrong-btn-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => speak(quiz.japaneseWord)}
                    className="outline-btn"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    🔊 발음 듣기
                  </button>

                  <button
                    onClick={() => handleResolve(item.id)}
                    className="glow-btn"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      background: 'var(--accent-color)',
                      boxShadow: 'none',
                      justifyContent: 'center'
                    }}
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
