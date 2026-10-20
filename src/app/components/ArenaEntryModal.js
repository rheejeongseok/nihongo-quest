'use client';
import { createPortal } from 'react-dom';
import { KANA_CHART } from '@/data/beginnerKana.mjs';
import { CATEGORY_META, getStagesList } from '@/data/uiCatalog.mjs';

export default function ArenaEntryModal({ selectedStage, setSelectedStage, showCourseSelection, targetLevel, chosenDifficulty, setChosenDifficulty, getStageTitle, router }) {
  return createPortal(
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
          <div data-draggable-modal className="premium-card animate-scale modal-premium-content" style={{
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
            <h3 data-modal-drag-handle style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '4px' }}>
              {showCourseSelection ? `${targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 챌린지` : getStageTitle(selectedStage)}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              {targetLevel === 'N1' ? '코스를 선택하면 바로 시작합니다.' : showCourseSelection ? '도전하실 아레나 코스와 세부 난이도를 선택해 주세요!' : '이 아레나에서 도전할 난이도를 선택해 주세요!'}
            </p>

            {/* 1. 5대 아레나 실시간 코스 변환기 그리드 */}
            {showCourseSelection && <>
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
                    onClick={() => {
                      if (stage.category === 'CALLIGRAPHY') {
                        // 아레나 모달 닫고 칠판 모달 열기
                        setSelectedStage(null);
                        window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
                        return;
                      }
                      if (targetLevel === 'N1') {
                        setSelectedStage(null);
                        router.push(stage.href || `/play/${stage.stageNumber}?jlptLevel=N1&category=${stage.category}`);
                        return;
                      }
                      setSelectedStage(stage);
                    }}
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

            </>}
            {targetLevel === 'BEGINNER' && selectedStage.category === 'KANA' && <div style={{ marginBottom: '1rem', textAlign: 'left', lineHeight: 1.7 }}>
              <p>글자를 보고 소리를 고르는 10문제 연습입니다. 먼저 아래 문자표를 보고 익혀도 좋아요.</p>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 800 }}>히라가나·가타카나 문자표 보기</summary>
                <p style={{ fontSize: '0.8rem' }}>로마자는 발음 보조 표기입니다. を·ヲ는 보통 조사에서 o로 읽습니다.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.4rem', maxHeight: '12rem', overflowY: 'auto' }}>
                  {KANA_CHART.map(k => <div key={k.hiragana} style={{ padding: '0.4rem', background: 'var(--bg-secondary)', borderRadius: '0.4rem', textAlign: 'center' }}>{k.hiragana} / {k.katakana}<br /><small>{k.sound}</small></div>)}
                </div>
              </details>
            </div>}
            {/* 2. 세부 난이도 선택 (쉬움 🌱, 보통 🍱, 어려움 ⚡) */}
            {targetLevel === 'N1' && <div className="arena-practice-actions">
              <button className="outline-btn" onClick={() => { setSelectedStage(null); router.push('/play/5?jlptLevel=N1&category=WORDLE'); }}>🧩 어휘 워들 복습</button>
            </div>}
            {targetLevel === 'BEGINNER' && selectedStage.category !== 'KANA' && <>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
              ⚡ 난이도 설정 · 기초 → 기본 응용 → 중급 입문
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
            </>}
            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setSelectedStage(null)}
                className="outline-btn"
                style={{ padding: '0.625rem 1.25rem', fontSize: '0.82rem', flex: 1 }}
              >
                닫기
              </button>
              {targetLevel === 'BEGINNER' && <button
                onClick={() => {
                  if (!selectedStage) return;
                  if (selectedStage.category === 'CALLIGRAPHY') {
                    setSelectedStage(null);
                    window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
                    return;
                  }
                  const learningTrack = targetLevel === 'BEGINNER' ? 'BEGINNER' : 'N1';
                  router.push(`/play/${selectedStage.stageNumber}?jlptLevel=${learningTrack}&difficulty=${selectedStage.category === 'KANA' ? 'EASY' : chosenDifficulty}&category=${selectedStage.category}`);
                  setSelectedStage(null);
                }}
                className="glow-btn"
                style={{ padding: '0.625rem 1.5rem', fontSize: '0.82rem', flex: 1 }}
              >
                {selectedStage?.category === 'CALLIGRAPHY' ? '손글씨 연습장 열기 ✍️' : '아레나 입장 ➔'}
              </button>}
            </div>

          </div>
        </div>,
        document.body
  );
}
