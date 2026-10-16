import prisma from '@/lib/prisma';
import ClientDashboard from './ClientDashboard';
import ClientSeedButton from './ClientSeedButton';

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
  const showSeedControls = process.env.NODE_ENV !== 'production';

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', minHeight: 'calc(100vh - 5rem)' }}>
      {/* 타이틀 헤더 */}
      <div className="home-banner-wrapper">
        <h1 className="home-banner-title">
          🌸 일본어 퀴즈 퀘스트 <span className="logo-highlight">NihongoQuest</span>
        </h1>
        <p className="home-banner-desc">
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
            <strong> 현재 N1·초보 아레나의 학습 데이터</strong>를 준비합니다.
          </p>
          {showSeedControls ? (
            <ClientSeedButton />
          ) : (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              운영 환경에서는 관리자만 서버에서 학습 데이터를 초기화할 수 있습니다.
            </p>
          )}
        </div>
      ) : (
        /* ==================== [실제 대시보드 및 학습 로드맵] ==================== */
        <ClientDashboard showSeedControls={showSeedControls} />
      )}
    </div>
  );
}
