'use client';

// 퀴즈 화면 맨 위: 코스 이름·급수·난이도, 콤보, 문제 진행 막대, 타임어택 스위치와 남은 시간
export default function PlayProgress({
  stageTitle, isBeginner, trackLabel, difficulty, difficultyLabel, comboCount,
  currentIndex, total, showTimeAttack, isTimeAttack, setIsTimeAttack, submitted, timeRemaining
}) {
  const hurry = timeRemaining <= 5;
  return (
    <div className="play-progress">
      <div className="stage-info-container">
        <span className="white-space-normal play-stage-name">
          <span>{stageTitle}</span>
          <span className={`practice-level-badge ${isBeginner ? 'beginner' : 'n1'}`}>
            급수: {trackLabel}
          </span>
          {isBeginner && (
            <span className={`play-difficulty-badge ${difficulty.toLowerCase()}`}>
              난이도: {difficultyLabel}
            </span>
          )}
        </span>
        <span className="play-count">
          {comboCount > 0 && <span className="play-combo">🔥 {comboCount} COMBO!</span>}
          <span>문제 {currentIndex + 1} / {total}</span>
        </span>
      </div>

      <div className="play-progress-track">
        <div className="play-progress-fill" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
      </div>

      {showTimeAttack && (
        <div className="time-attack-control-card">
          <span className="time-attack-label">⏱️ 타임어택 서바이벌 모드 (제한시간 20초)</span>
          <label className="switch-custom">
            <input type="checkbox" checked={isTimeAttack} onChange={(e) => setIsTimeAttack(e.target.checked)} disabled={submitted} />
            <span className={`slider-custom${isTimeAttack ? ' on' : ''}`}>
              <span className="slider-knob" />
            </span>
          </label>
        </div>
      )}

      {isTimeAttack && !submitted && (
        <div className="time-attack-timer">
          <div className={`time-attack-timer-text${hurry ? ' hurry' : ''}`}>
            <span>⏰ 남은 시간: {timeRemaining}초</span>
            {hurry && <span className="time-attack-alert">🚨 마감 임박! 서두르세요!</span>}
          </div>
          <div className="time-attack-track">
            <div className={`time-attack-fill${hurry ? ' hurry' : ''}`} style={{ width: `${(timeRemaining / 20) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
