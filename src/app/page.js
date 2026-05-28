import prisma from '@/lib/prisma';
import ClientDashboard from './ClientDashboard';
import ClientSeedButton from './ClientSeedButton';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // 데이터베이스에서 스테이지 목록 조회
  let stages = [];
  let user = null;
  
  try {
    stages = await prisma.stage.findMany({
      orderBy: { stageNumber: 'asc' },
      include: { quizzes: true }
    });
    
    user = await prisma.user.findFirst();
  } catch (error) {
    console.error("데이터 조회 에러:", error);
  }

  // 만약 첫 구동이라 데이터베이스가 아예 비어 있다면
  const isDbEmpty = stages.length === 0;

  return (
    <div className="container" style={{ padding: '40px 24px', minHeight: 'calc(100vh - 76px)' }}>
      {/* 타이틀 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
          🌸 일본어 퀴즈 퀘스트 <span style={{ color: 'var(--accent-color)' }}>NihongoQuest</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>
          게임을 깨듯이 한 단계씩 즐겁게 헤쳐나가는 나만의 일본어 공부 모험
        </p>
      </div>

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
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '16px' }}>학습 데이터베이스 준비 완료!</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '32px', fontSize: '0.95rem' }}>
            성공적으로 독립 데이터베이스가 연동되었습니다! 아래 버튼을 한 번만 클릭해 주시면 
            <strong> 히라가나부터 TTS 청해, 일본어 워들까지 포함된 고품질 시드 데이터(25문항)</strong>를 즉시 자동 주입합니다.
          </p>
          <ClientSeedButton />
        </div>
      ) : (
        /* ==================== [실제 대시보드 및 학습 로드맵] ==================== */
        <ClientDashboard initialStages={stages} initialUser={user} />
      )}
    </div>
  );
}

