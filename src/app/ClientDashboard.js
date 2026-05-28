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
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = x / rect.width - 0.5;
    const yc = y / rect.height - 0.5;
    
    const rotateX = yc * -10; // 자연스럽고 은은한 10도 틸팅
    const rotateY = xc * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', position: 'relative' }}>
      
      {/* 🌌 뒷편에서 몽환적으로 일렁이는 오로라 백그라운드 구체 오버레이 */}
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      {/* 0. 상시 데이터 동기화 패널 (최상단 노출) */}
      <div className="glass-premium-card rainbow-border" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 32px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderWidth: '1.5px'
        }}
      >
        <div>
          <span style={{ fontWeight: '900', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌱 최신 자격증 문항 데이터 동기화
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
            실전 최고난도 JLPT N1 완벽 대비용 초대형 5000+개 퀴즈 풀로 초기화 및 갱신합니다.
          </span>
        </div>
        
        <button
          onClick={handleSyncData}
          disabled={syncing || syncDone}
          className="glass-neon-btn"
          style={{
            padding: '10px 24px',
            fontSize: '0.85rem',
            opacity: syncing || syncDone ? 0.8 : 1,
            cursor: syncing || syncDone ? 'not-allowed' : 'pointer'
          }}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* 프로필 및 포인트 카드 */}
        <div className="glass-premium-card rainbow-border" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px' }}
        >
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px', color: 'var(--text-primary)' }}>
              👋 어서오세요, {user.username}님!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              오늘도 즐거운 일본어 모험이 당신을 기다립니다.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block' }}>누적 포인트</span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-color)', textShadow: '0 2px 8px var(--accent-glow)' }}>
                {user.points} <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>pts</span>
              </span>
            </div>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>🏆</span>
          </div>
        </div>

        {/* 일일 학습 스트릭 카드 */}
        <div className="glass-premium-card rainbow-border" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px' }}
        >
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔥 일일 학습 스트릭
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              매일 연속으로 학습을 이어가고 스트릭 불꽃을 꺼뜨리지 마세요!
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
            <div>
              <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {user.currentStreak} <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>일째 연속</span>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                최대 기록: {user.maxStreak}일 연속 학습
              </span>
            </div>
            {/* 스트릭 잔디 심기 미니 연출 */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map((day) => (
                <div 
                  key={day}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: day <= user.currentStreak ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: day <= user.currentStreak ? 'var(--neon-glow)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 나의 학습 칭호 & 배지 보드 및 프리미엄 업적 메달 홀 */}
        <div className="glass-premium-card rainbow-border" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '230px' }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎖️ 획득한 배지 & 업적
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>
              정복한 스테이지 배지와 업적 메달 컬렉션입니다.
            </p>
            
            {/* 기본 배지 목록 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {parsedBadges.map((badge, idx) => (
                <span 
                  key={idx} 
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(4px)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  🎓 {badge}
                </span>
              ))}
            </div>
          </div>

          {/* 🏆 영롱한 5대 전설 업적 메달 홀 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(4px)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.15)'
          }}>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              🏆 전설적인 업적 메달 컬렉션 (호버 시 조건 확인)
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '8px' }}>
              {[
                { id: 'first_clear', title: '첫걸음마 🐣', desc: '아무 스테이지 1회 완수' },
                { id: 'perfect_clear', title: '무결점의 신 💯', desc: '스테이지 5문제 만점 달성' },
                { id: 'n1_slayer', title: 'N1 격파자 ⚔️', desc: '최고급 N1 스테이지 완수' },
                { id: 'combo_master', title: '콤보 신화 🔥', desc: '연속 5문제 정답 콤보 달성' },
                { id: 'calligraphy_pro', title: '붓글씨달인 🖌️', desc: '손글씨 주관식으로 3회 성공' }
              ].map((ach) => {
                const isUnlocked = !!unlockedAchievements[ach.id];
                return (
                  <div 
                    key={ach.id}
                    title={`${ach.title}: ${ach.desc}${isUnlocked ? ' (달성완료! 🎉)' : ' (미달성 🔒)'}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'help',
                      opacity: isUnlocked ? 1 : 0.35,
                      filter: isUnlocked ? 'none' : 'grayscale(100%)',
                      transition: 'all 0.2s',
                      transform: isUnlocked ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <span style={{ 
                      fontSize: '1.8rem', 
                      background: isUnlocked ? 'rgba(255, 159, 67, 0.15)' : 'transparent',
                      padding: '4px',
                      borderRadius: '50%',
                      border: isUnlocked ? '1.5px solid #ff9f43' : '1.5px solid transparent',
                      boxShadow: isUnlocked ? '0 4px 10px rgba(255, 159, 67, 0.25)' : 'none',
                    }}>
                      {ach.id === 'first_clear' && '🐣'}
                      {ach.id === 'perfect_clear' && '💯'}
                      {ach.id === 'n1_slayer' && '⚔️'}
                      {ach.id === 'combo_master' && '🔥'}
                      {ach.id === 'calligraphy_pro' && '🖌️'}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', marginTop: '4px', color: isUnlocked ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                      {ach.id === 'first_clear' && '첫걸음마'}
                      {ach.id === 'perfect_clear' && '무결점'}
                      {ach.id === 'n1_slayer' && 'N1격파'}
                      {ach.id === 'combo_master' && '콤보신화'}
                      {ach.id === 'calligraphy_pro' && '붓글씨'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 2. 대망의 5대 카테고리 독립형 실전 아레나 */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🏟️ N1 실전 아레나 (N1 Premium Arenas)
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '28px',
          width: '100%'
        }}>
          {initialStages.map((stage) => {
            const meta = categoryMeta[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
            
            return (
              <div 
                key={stage.id}
                className="glass-premium-card rainbow-border interactive-arena"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '28px',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.02), 0 0 20px ${meta.color}0a`,
                  minHeight: '260px'
                }}
              >
                {/* 상단: 카테고리 정보 및 아이콘 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>{meta.emoji}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      background: `${meta.color}22`,
                      color: meta.color,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      border: `1px solid ${meta.color}66`
                    }}>
                      {meta.label}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {stage.title}
                  </h4>
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    5,000+개 N1 최고난도 기출 풀에서 무작위 라이브 추출
                  </p>
                </div>

                {/* 하단: 입장 버튼 및 매칭 명세 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    독자 아레나 코스
                  </span>
                  <button 
                    onClick={() => openDifficultyModal(stage)}
                    className="glass-neon-btn" 
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.85rem',
                      fontWeight: '800'
                    }}
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
          <div className="premium-card animate-scale" style={{
            maxWidth: '850px',
            width: '90%',
            padding: '48px 60px',
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
            <div style={{
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
