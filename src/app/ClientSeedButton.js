'use client';

import { useState } from 'react';

export default function ClientSeedButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => {
          window.location.reload(); // 새로고침해서 로드맵 띄우기
        }, 1200);
      } else {
        alert("시딩 실패: " + data.error);
      }
    } catch (e) {
      alert("네트워크 에러 발생: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading || done}
      className="glow-btn"
      style={{
        padding: '16px 36px',
        fontSize: '1.1rem',
        borderRadius: 'var(--custom-radius)',
        opacity: loading || done ? 0.8 : 1,
        cursor: loading || done ? 'not-allowed' : 'pointer',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      {loading ? (
        <>
          <span className="pulse-ani">⏳</span>
          <span>데이터베이스 씨뿌리는 중...</span>
        </>
      ) : done ? (
        <>
          <span>🎉</span>
          <span>주입 성공! 잠시 후 시작됩니다...</span>
        </>
      ) : (
        <>
          <span>🌱</span>
          <span>고품질 100+개 학습 데이터 주입하기</span>
        </>
      )}
    </button>
  );
}
