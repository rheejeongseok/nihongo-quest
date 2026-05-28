'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';

export default function WrongNotesPage() {
  const [loading, setLoading] = useState(true);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const { speak } = useJapaneseSpeech();

  // 1. 오답노트 목록 로드
  useEffect(() => {
    async function loadWrongs() {
      try {
        const res = await fetch('/api/wrong-notes');
        const data = await res.json();
        if (data.success) {
          setWrongAnswers(data.wrongAnswers);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadWrongs();
  }, []);

  // 2. 오답 복습 해결 (오답노트에서 제외)
  const handleResolve = async (id) => {
    try {
      const res = await fetch('/api/wrong-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        // UI에서 즉시 필터링
        setWrongAnswers(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>📓</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>오답 노트를 펼치는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '40px 24px' }}>
      
      {/* 뒤로가기 및 제목 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
          ← 로드맵 홈으로 이동
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📓 스마트 오답 노트 (Wrong Notes)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          틀린 문제들을 집중 복습하여 완벽히 내 것으로 만드는 나만의 오답 소탕 보드
        </p>
      </div>

      {wrongAnswers.length === 0 ? (
        /* 오답이 없을 때의 웰컴 피드백 */
        <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '16px' }}>✨</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>복습할 오답이 전혀 없습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            모든 퀴즈 문제를 완벽하게 통과하셨습니다. 정말 대단한 실력입니다!
          </p>
          <Link href="/" passHref legacyBehavior>
            <a className="glow-btn" style={{ padding: '12px 30px', textDecoration: 'none' }}>
              더 많은 퀴즈 도전하기 ➔
            </a>
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

          {wrongAnswers.map((item) => {
            const quiz = item.quiz;
            return (
              <div 
                key={item.id} 
                className="premium-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px 30px',
                  borderColor: 'rgba(255, 107, 107, 0.2)'
                }}
              >
                {/* 오답 상세 정보 */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexGrow: 1, marginRight: '24px' }}>
                  {/* 빨간색 느낌의 오답 경고 원형 */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '2px solid #ff6b6b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff6b6b',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}>
                    <span>FAIL</span>
                    <span style={{ fontSize: '1rem', marginTop: '-3px' }}>{item.reviewCount}회</span>
                  </div>

                  <div>
                    {/* 원래 출제 문제 설명 */}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      원래 질문: {quiz.questionText
                        .replace(/\[N(1|2)-(EASY|MEDIUM|HARD)\]\s*/g, '')
                        .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
                        .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '')}
                    </span>
                    
                    {/* 단어 및 요미가나 */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                      <h4 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {quiz.japaneseWord}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
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

    </div>
  );
}
