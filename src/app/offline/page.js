import Link from 'next/link';

export const metadata = {
  title: '오프라인 | NihongoQuest'
};

export default function OfflinePage() {
  return (
    <div className="container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '32px 20px' }}>
      <section className="glass-premium-card" style={{ maxWidth: '520px', padding: '40px 28px', textAlign: 'center' }}>
        <span style={{ display: 'block', fontSize: '4rem', marginBottom: '16px' }}>🌸</span>
        <h1 style={{ marginBottom: '12px' }}>지금은 오프라인입니다</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
          인터넷 연결을 확인한 뒤 다시 시도해 주세요. 이전에 열었던 일부 화면은 오프라인에서도 표시될 수 있습니다.
        </p>
        <Link href="/" className="glass-neon-btn" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 24px' }}>
          연결 다시 확인하기
        </Link>
      </section>
    </div>
  );
}
