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
        style={{
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div className="dday-heading" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="dday-icon" style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))', animation: 'float 3s infinite' }}>📅</span>
          <div className="dday-details">
            <h4 className='count-title' style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {targetLevel === 'BEGINNER' ? 'JLPT N5~N3 D-Day' : 'JLPT N1 D-Day'}
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(84, 160, 255, 0.1)',
                color: '#54a0ff',
                padding: '2px 8px',
                borderRadius: '100px',
                border: '1px solid rgba(84, 160, 255, 0.2)',
                fontWeight: '800'
              }}>
                {examInfo.type}
              </span>
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
              <span className="dday-date-prefix">목표 시험 일시: </span><strong style={{ color: 'var(--accent-color)' }}>{examInfo.dateStr} 13:10</strong>
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
