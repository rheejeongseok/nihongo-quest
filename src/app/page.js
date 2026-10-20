import prisma from '@/lib/prisma';
import ClientDashboard from './ClientDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 홈 화면은 초기화 여부 판별에 스테이지 개수만 필요하다.
  // 퀴즈 전체를 Client Component에 전달하면 RSC 응답이 수 MB까지 커진다.
  let stageCount = 0;
  
  try {
    stageCount = await prisma.stage.count();
  } catch (error) {
    console.error("데이터 조회 에러:", error);
  }

  // 만약 첫 구동이라 데이터베이스가 아예 비어 있다면
  const isDbEmpty = stageCount === 0;

  return (
    <div className="container quest-home" style={{ minHeight: 'calc(100vh - 5rem)' }}>
      {isDbEmpty ? (
        /* ==================== [DB가 비어있을 때의 초프리미엄 웰컴 & 시딩 가이드] ==================== */
        <div style={{
          maxWidth: '650px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '48px 32px',
          background: 'var(--card-bg)',
          border: '2px dashed var(--card-border)',
          borderRadius: 'var(--custom-radius)',
          boxShadow: 'var(--neon-glow)',
        }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px', animation: 'pulse 2s infinite' }}>📦</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '16px' }}>학습 데이터를 준비 중입니다</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '32px', fontSize: '0.95rem' }}>
            아직 학습 데이터를 불러올 수 없습니다. 잠시 후 다시 접속해 주세요.
          </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              문제가 계속되면 관리자에게 문의해 주세요.
            </p>
        </div>
      ) : (
        /* ==================== [실제 대시보드 및 학습 로드맵] ==================== */
        <ClientDashboard />
      )}
    </div>
  );
}
