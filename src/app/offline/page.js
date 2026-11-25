import Link from 'next/link';

export const metadata = {
  title: '오프라인 | NihongoQuest'
};

export default function OfflinePage() {
  return (
    <div className="container offline-page">
      <section className="glass-premium-card offline-card">
        <span className="offline-icon">🌸</span>
        <h1>지금은 오프라인입니다</h1>
        <p>
          인터넷 연결을 확인한 뒤 다시 시도해 주세요. 이전에 열었던 일부 화면은 오프라인에서도 표시될 수 있습니다.
        </p>
        <Link href="/" className="glass-neon-btn offline-retry">
          연결 다시 확인하기
        </Link>
      </section>
    </div>
  );
}
