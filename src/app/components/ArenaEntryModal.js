'use client';
import { createPortal } from 'react-dom';
import { KANA_CHART } from '@/data/beginnerKana.mjs';
import { CATEGORY_META, getStagesList } from '@/data/uiCatalog.mjs';

const DIFFICULTIES = [['EASY', '쉬움 🌱'], ['MEDIUM', '보통 🍱'], ['HARD', '어려움 ⚡']];

// 코스(아레나) 고르기 모달. N1은 코스를 누르면 바로 시작하고, 초보는 난이도까지 고른 뒤 입장합니다.
export default function ArenaEntryModal({ selectedStage, setSelectedStage, showCourseSelection, targetLevel, chosenDifficulty, setChosenDifficulty, getStageTitle, router }) {
  const isBeginner = targetLevel === 'BEGINNER';
  const openCalligraphy = () => {
    setSelectedStage(null);
    window.dispatchEvent(new CustomEvent('open-calligraphy-modal'));
  };
  const pickStage = stage => {
    if (stage.category === 'CALLIGRAPHY') return openCalligraphy();
    if (targetLevel === 'N1') {
      setSelectedStage(null);
      router.push(stage.href || `/play/${stage.stageNumber}?jlptLevel=N1&category=${stage.category}`);
      return;
    }
    setSelectedStage(stage);
  };
  const enter = () => {
    if (!selectedStage) return;
    if (selectedStage.category === 'CALLIGRAPHY') return openCalligraphy();
    router.push(`/play/${selectedStage.stageNumber}?jlptLevel=${isBeginner ? 'BEGINNER' : 'N1'}&difficulty=${selectedStage.category === 'KANA' ? 'EASY' : chosenDifficulty}&category=${selectedStage.category}`);
    setSelectedStage(null);
  };

  return createPortal(
    <div className="modal-overlay top">
      <div data-draggable-modal className="premium-card animate-scale modal-premium-content arena-modal">
        <span className="arena-modal-icon">🏟️</span>
        <h3 data-modal-drag-handle className="arena-modal-title">
          {showCourseSelection ? `${isBeginner ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 챌린지` : getStageTitle(selectedStage)}
        </h3>
        <p className="arena-modal-desc">
          {targetLevel === 'N1' ? '코스를 선택하면 바로 시작합니다.' : showCourseSelection ? '도전하실 아레나 코스와 세부 난이도를 선택해 주세요!' : '이 아레나에서 도전할 난이도를 선택해 주세요!'}
        </p>

        {showCourseSelection && <>
          <div className="arena-modal-label">🎯 코스 선택</div>
          <div className="arena-course-grid">
            {getStagesList(targetLevel).map((stage) => {
              const meta = CATEGORY_META[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
              const isSelected = selectedStage.stageNumber === stage.stageNumber && selectedStage.category === stage.category;
              return (
                <button key={stage.id} onClick={() => pickStage(stage)} className={`arena-course${isSelected ? ' selected' : ''}`} aria-pressed={isSelected} style={{ '--course-color': meta.color }}>
                  <span className="arena-course-emoji">{meta.emoji}</span>
                  <span className="arena-course-title">{getStageTitle(stage)}</span>
                </button>
              );
            })}
          </div>
        </>}

        {isBeginner && selectedStage.category === 'KANA' && (
          <div className="arena-kana-guide">
            <p>글자를 보고 소리를 고르는 10문제 연습입니다. 먼저 아래 문자표를 보고 익혀도 좋아요.</p>
            <details>
              <summary>히라가나·가타카나 문자표 보기</summary>
              <p className="arena-kana-note">로마자는 발음 보조 표기입니다. を·ヲ는 보통 조사에서 o로 읽습니다.</p>
              <div className="arena-kana-chart">
                {KANA_CHART.map(k => <div key={k.hiragana} className="arena-kana-cell">{k.hiragana} / {k.katakana}<br /><small>{k.sound}</small></div>)}
              </div>
            </details>
          </div>
        )}

        {targetLevel === 'N1' && <div className="arena-practice-actions">
          <button className="outline-btn" onClick={() => { setSelectedStage(null); router.push('/play/5?jlptLevel=N1&category=WORDLE'); }}>🧩 어휘 워들 복습</button>
        </div>}

        {isBeginner && selectedStage.category !== 'KANA' && <>
          <div className="arena-modal-label">⚡ 난이도 설정 · 기초 → 기본 응용 → 중급 입문</div>
          <div className="difficulty-btn-grid">
            {DIFFICULTIES.map(([diff, label]) => (
              <button key={diff} onClick={() => setChosenDifficulty(diff)} className={`difficulty-btn ${diff.toLowerCase()}${chosenDifficulty === diff ? ' active' : ''}`} aria-pressed={chosenDifficulty === diff}>
                {label}
              </button>
            ))}
          </div>
        </>}

        <div className="arena-modal-actions">
          <button onClick={() => setSelectedStage(null)} className="outline-btn arena-modal-close">닫기</button>
          {isBeginner && (
            <button onClick={enter} className="glow-btn arena-modal-enter">
              {selectedStage?.category === 'CALLIGRAPHY' ? '손글씨 연습장 열기 ✍️' : '아레나 입장 ➔'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
