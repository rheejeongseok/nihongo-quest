'use client';

// 업적을 달성했을 때 오른쪽 아래에서 미끄러져 나오는 알림
export default function AchievementToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="achievement-toast" role="status">
      <span className="achievement-toast-icon">{toast.icon}</span>
      <div>
        <span className="achievement-toast-kicker">🏆 ACHIEVEMENT UNLOCKED!</span>
        <strong className="achievement-toast-title">{toast.title}</strong>
        <span className="achievement-toast-desc">{toast.desc}</span>
      </div>
    </div>
  );
}
