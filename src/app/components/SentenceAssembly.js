'use client';

// 문장 조립 문제: 아래 단어 조각을 눌러 조립판에 순서대로 붙이고, 조립판의 조각을 누르면 뺍니다.
export default function SentenceAssembly({ currentQuiz, isBeginner, assemblyPads, setAssemblyPads, submitted, handleSubmission }) {
  const options = currentQuiz.options || [];
  return (
    <div className="assembly">
      <span className="assembly-label">
        ⛓️ {isBeginner ? '초보 문장 조립 보드' : 'N1 문장 조립 보드'} (조립판의 단어를 클릭하면 취소할 수 있습니다)
      </span>
      <div className="assembly-board">
        {assemblyPads.length === 0 ? (
          <span className="assembly-empty">
            아래의 단어 조각 카드를 순서대로 탭하여 {isBeginner ? '기초' : '경어'} 문장을 완성하세요.
          </span>
        ) : (
          assemblyPads.map((origIdx, wIdx) => (
            <button
              key={wIdx}
              onClick={() => { if (!submitted) setAssemblyPads(prev => prev.filter((_, idx) => idx !== wIdx)); }}
              disabled={submitted}
              className="glow-btn animate-scale assembly-piece placed"
            >
              {options[origIdx]} <span className="assembly-remove">✕</span>
            </button>
          ))
        )}
      </div>

      <span className="assembly-label">🃏 사용 가능한 단어 조각 카드 (클릭 시 조립판에 찰칵 결합!)</span>
      <div className="assembly-pool">
        {options.map((word, oIdx) => assemblyPads.includes(oIdx) ? null : (
          <button
            key={oIdx}
            onClick={() => { if (!submitted) setAssemblyPads(prev => [...prev, oIdx]); }}
            disabled={submitted}
            className="outline-btn hover-glow animate-scale assembly-piece"
          >
            {word}
          </button>
        ))}
        {assemblyPads.length === options.length && <span className="assembly-empty small">모든 카드가 조립판에 결합되었습니다!</span>}
      </div>

      {!submitted && (
        <button
          onClick={() => handleSubmission(assemblyPads.map(idx => options[idx]).join(''))}
          disabled={assemblyPads.length === 0}
          className="glow-btn assembly-submit"
        >
          조합 검증 및 채점 제출 ⚔️
        </button>
      )}
    </div>
  );
}
