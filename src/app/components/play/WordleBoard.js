'use client';

// 워들 퀴즈: 지금까지의 시도(칸별 색 힌트)와 글자 입력칸
export default function WordleBoard({ attempts, input, finished, submitted, onChange, onSubmit }) {
  return (
    <div className="wordle-board">
      <span className="play-section-label small">🧩 워들 퀴즈 전용 입력판 (칸별 글자 힌트 대입)</span>

      {attempts.map((attempt, attemptIdx) => (
        <div key={attemptIdx} className="wordle-row">
          {attempt.guess.split('').map((char, charIdx) => (
            <div key={charIdx} className={`wordle-tile ${attempt.feedback[charIdx]}`}>{char}</div>
          ))}
        </div>
      ))}

      {!finished && (
        <div className="wordle-row">
          {input.map((char, idx) => (
            <input key={idx} id={`wordle-${idx}`} type="text" maxLength={1} value={char} className="wordle-input" onChange={(e) => onChange(e.target.value, idx)} />
          ))}
        </div>
      )}

      {!submitted && (
        <button onClick={onSubmit} className="glow-btn wordle-submit">
          정답 검증 (제출)
        </button>
      )}
    </div>
  );
}
