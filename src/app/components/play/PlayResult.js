'use client';

import Link from 'next/link';

// 10문제를 다 풀었을 때의 결과 카드
export default function PlayResult({ stageTitle, trackLabel, isBeginner, difficultyLabel, userScore, total, totalPointsEarned, onMouseMove, onMouseLeave }) {
  return (
    <div className="glass-premium-card rainbow-border play-result" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <span className="play-result-icon">🏆</span>
      <h2>스테이지 완벽 격파!</h2>
      <p>
        {stageTitle} [{trackLabel}{isBeginner ? ` • ${difficultyLabel}` : ''}] 코스를 성공적으로 완수하셨습니다!
      </p>

      <div className="report-summary-grid">
        <div>
          <span className="play-result-label">최종 성적</span>
          <span className="play-result-value score">
            {userScore} / {total} <span className="play-result-unit">개 정답</span>
          </span>
        </div>
        <div>
          <span className="play-result-label">획득한 포인트</span>
          <span className="play-result-value points">
            +{totalPointsEarned} <span className="play-result-unit">pts</span>
          </span>
        </div>
      </div>

      <Link href="/" className="glass-neon-btn play-result-home">
        🏠 로드맵 홈으로 복귀
      </Link>
    </div>
  );
}
