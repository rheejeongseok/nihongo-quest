'use client';
import JlptTimer from '@/app/JlptTimer';

export default function DashboardOverview({ targetLevel, examInfo, registrationInfo, handleMouseMove, handleMouseLeave }) {
  return (<div className="dashboard-overview">
      <div className="home-banner-wrapper">
        <span className="home-eyebrow">NIHONGO QUEST · DAILY PRACTICE</span>
        <h1 className="home-banner-title">오늘도 한 걸음, 일본어.</h1>
        <p className="home-banner-desc">원하는 코스로 시작하고, 틀린 문제는 내 것으로 만들어 보세요.</p>
      </div>

      {/* 📅 실시간 JLPT D-Day 카운트다운 & 접수 안내 보드 */}
      <div className="glass-premium-card rainbow-border dday-countdown-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="dday-heading">
          <span className="dday-icon">📅</span>
          <div className="dday-details">
            <h4 className="count-title">
              {targetLevel === 'BEGINNER' ? 'JLPT N5~N3 D-Day' : 'JLPT N1 D-Day'}
              <span className="dday-exam-type">
                {examInfo.type}
              </span>
            </h4>
            <p className="dday-date">
              <span className="dday-date-prefix">목표 시험 일시: </span><strong>{examInfo.dateStr} 13:10</strong>
            </p>
          </div>
        </div>

        {/* 째깍째깍 초시계 수치 */}
        <JlptTimer />

        {/* 원서 접수 기간 연동 배너 */}
        {registrationInfo.label && <div className="dday-registration">
          <span className="dday-registration-status">{registrationInfo.status}</span>
          {registrationInfo.source
            ? <a href={registrationInfo.source} target="_blank" rel="noopener noreferrer">{registrationInfo.label} ↗</a>
            : <span>{registrationInfo.label}</span>}
        </div>}
      </div>

      </div>);
}
