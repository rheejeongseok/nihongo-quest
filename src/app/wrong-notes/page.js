'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';

export default function WrongNotesPage() {
  const [loading, setLoading] = useState(true);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const { speak } = useJapaneseSpeech();

  // ⚡ 스마트 크로스 동기화 상태
  const [backupCode, setBackupCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSyncHubExpanded, setIsSyncHubExpanded] = useState(false); // 👈 접기 토글 상태 추가

  // 🧠 에빙하우스 SRS 필터 및 Refs
  const [isEbbinghausFilter, setIsEbbinghausFilter] = useState(false);
  const confettiCanvasRef = useRef(null);

  const getSyncHeaders = (extra = {}) => {
    const username = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
    const targetLevel = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_target_level') || 'N1') : 'N1';
    return {
      'x-nihongo-username': encodeURIComponent(username),
      'x-nihongo-target-level': targetLevel,
      ...extra
    };
  };

  // 🎉 [초경량 클라이언트 Confetti 꽃가루 파티클 엔진]
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff5e7e', '#ff9f43', '#1dd1a1', '#54a0ff', '#feca57', '#9b5de5'];
    const particles = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationId;
    const startTime = Date.now();

    function drawConfetti() {
      if (Date.now() - startTime > 3000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationId);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - index / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      particles.forEach(p => {
        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }
      });

      animationId = requestAnimationFrame(drawConfetti);
    }

    drawConfetti();
  };

  // 1. 오답노트 목록 로드
  const loadWrongs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wrong-notes?ebbinghaus=${isEbbinghausFilter}`, {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setWrongAnswers(data.wrongAnswers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWrongs();
  }, [isEbbinghausFilter]);

  // 2. 오답 복습 해결 (오답노트에서 제외 혹은 단계 전이)
  const handleResolve = async (id) => {
    try {
      const res = await fetch('/api/wrong-notes', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isGraduated) {
          triggerConfetti();
          alert("🎉 [에빙하우스 최종 졸업]\n5단계 복습을 무사 통과하여 이 단어를 완벽히 정복하셨습니다!");
          setWrongAnswers(prev => prev.filter(item => item.id !== id));
        } else {
          showToast(`💪 복습 완료! 단계 상승 (LEVEL ${data.nextCount - 1} ➔ ${data.nextCount})`);
          // 💡 복습 완료된 단어는 오늘 훈련에서 즉시 목록 제외 피드백을 선사하여 혼선을 방지합니다!
          setWrongAnswers(prev => prev.filter(item => item.id !== id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 📥 [EXPORT] 오답노트 백업 코드 생성 및 클립보드 복사
  const handleExportCode = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/sync?type=wrong-notes', {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success && data.backupCode) {
        setBackupCode(data.backupCode);
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.backupCode);
          showToast("오답노트 백업 코드가 복사되었습니다! 📋");
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = data.backupCode;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          showToast("오답노트 백업 코드가 복사되었습니다! 📋");
        }
      } else {
        alert("백업 코드 생성 실패: " + (data.error || "데이터가 없습니다."));
      }
    } catch (e) {
      alert("백업 네트워크 에러: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  // 📤 [IMPORT] 붙여넣은 백업 코드로 오답노트 스마트 병합
  const handleImportCode = async () => {
    if (!inputCode.trim()) {
      alert("주입할 오답노트 백업 코드를 입력해 주세요!");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/sync?type=wrong-notes', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ backupCode: inputCode.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setInputCode('');
        alert(`🎉 오답노트 병합 완료!\n신규 오답 ${data.addedCount}개가 정상 통합 및 동기화되었습니다!`);
        window.location.reload();
      } else {
        alert("주입 실패: " + data.error);
      }
    } catch (e) {
      alert("주입 네트워크 에러: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  // 📄 [FILE EXPORT] 오답노트 JSON 파일 다운로드
  const handleJsonExport = async () => {
    try {
      const res = await fetch('/api/sync?type=wrong-notes', {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success && data.rawJson) {
        const jsonStr = JSON.stringify(data.rawJson, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nihongo_quest_wrong_notes_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("오답노트 JSON 파일이 다운로드되었습니다! 💾");
      } else {
        alert("백업 파일 추출 실패");
      }
    } catch (e) {
      alert("파일 백업 에러: " + e.message);
    }
  };

  // 📄 [FILE IMPORT] 오답노트 JSON 파일 선택 주입
  const handleJsonImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target.result);
        setImporting(true);
        const res = await fetch('/api/sync?type=wrong-notes', {
          method: 'POST',
          headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ rawJson })
        });
        const data = await res.json();
        if (data.success) {
          alert(`🎉 파일 병합 성공!\n신규 오답 ${data.addedCount}개가 오답노트에 복구 및 통합되었습니다!`);
          window.location.reload();
        } else {
          alert("파일 주입 실패: " + data.error);
        }
      } catch (parseErr) {
        alert("올바르지 않은 오답노트 JSON 파일 형식입니다.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>📓</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>오답 노트를 펼치는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1280px', padding: '40px 24px' }}>
      
      {/* 뒤로가기 및 제목 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        {/* <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
          ← 메인으로 이동
        </Link> */}
        <h1 style={{ fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📓 스마트 오답 노트 (Wrong Notes)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          틀린 문제들을 집중 복습하여 완벽히 내 것으로 만드는 나만의 오답 소탕 보드
        </p>
      </div>

      {/* ⚡ 오답노트 전용 크로스 동기화 센터 */}
      <div className="glass-premium-card rainbow-border sync-hub-premium-card" style={{ marginBottom: '32px' }}>
        <div 
          className={isSyncHubExpanded ? "sync-hub-header expanded" : "sync-hub-header"}
          onClick={() => setIsSyncHubExpanded(!isSyncHubExpanded)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="sync-hub-icon">📓</span>
            <div className="sync-hub-title-box">
              <h3 className="sync-hub-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                오답노트 데이터 동기화 센터
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px', background: isSyncHubExpanded ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)', color: isSyncHubExpanded ? '#2ecc71' : '#f1c40f', fontWeight: '800' }}>
                  {isSyncHubExpanded ? "펼침" : "접힘"}
                </span>
              </h3>
              <p className="sync-hub-desc" style={{ margin: '4px 0 0 0' }}>폰과 컴퓨터를 오가며 내가 틀린 오답 진도 데이터를 추출하고 중복 없이 머지(Merge)하세요!</p>
            </div>
          </div>
          <span style={{ fontSize: '0.9rem', transition: 'transform 0.3s ease', transform: isSyncHubExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-secondary)', paddingRight: '8px' }}>
            ▼
          </span>
        </div>

        {isSyncHubExpanded && (
          <div className="sync-hub-grid" style={{ marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '20px', animation: 'fadeIn 0.3s ease' }}>
            {/* 백업 */}
            <div className="sync-hub-section export-section">
              <h4 className="sync-section-title">📤 오답노트 백업 코드 추출</h4>
              <p className="sync-section-desc">현재 오답 복습 기록을 텍스트 코드로 압축 복사하거나 파일로 다운로드합니다.</p>
              <div className="sync-action-buttons">
                <button onClick={handleExportCode} disabled={exporting} className="glass-neon-btn export-code-btn">
                  {exporting ? "⏳ 코드 생성 중..." : "📋 백업 코드 복사"}
                </button>
                <button onClick={handleJsonExport} className="outline-btn file-export-btn">
                  💾 JSON 파일 저장
                </button>
              </div>
              {backupCode && (
                <div className="backup-code-preview fade-in">
                  <span className="code-label">생성된 백업 코드:</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={backupCode} 
                    onClick={(e) => {
                      e.target.select();
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(backupCode);
                        showToast("코드가 다시 복사되었습니다! 📋");
                      }
                    }}
                    className="backup-code-input"
                  />
                </div>
              )}
            </div>

            {/* 주입 */}
            <div className="sync-hub-section import-section">
              <h4 className="sync-section-title">📥 다른 기기 오답노트 가져오기</h4>
              <p className="sync-section-desc">다른 기기에서 복사한 오답노트 코드를 입력하거나 파일을 올려서 중복 없이 병합합니다.</p>
              <div className="import-inputs-wrapper">
                <div className="code-import-box">
                  <input 
                    type="text"
                    placeholder="오답노트 백업 코드를 붙여넣으세요..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="sync-import-text-input"
                  />
                  <button onClick={handleImportCode} disabled={importing || !inputCode.trim()} className="glass-neon-btn import-code-action-btn">
                    {importing ? "⏳ 병합 중..." : "⚡ 코드 주입"}
                  </button>
                </div>
                <div className="file-import-box">
                  <span className="file-import-label">JSON 백업 파일 복구:</span>
                  <label className="file-upload-custom-btn">
                    📁 파일 선택...
                    <input type="file" accept=".json" onChange={handleJsonImport} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🧠 에빙하우스 5단계 복습 필터 탭 */}
      <div className="ebbinghaus-tab-bar" style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid var(--card-border)',
        paddingBottom: '16px'
      }}>
        <button
          onClick={() => setIsEbbinghausFilter(false)}
          className={`outline-btn ${!isEbbinghausFilter ? 'active' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '0.9rem',
            fontWeight: '800',
            borderColor: !isEbbinghausFilter ? 'var(--accent-color)' : 'var(--card-border)',
            color: !isEbbinghausFilter ? 'var(--accent-color)' : 'var(--text-secondary)',
            background: !isEbbinghausFilter ? 'rgba(84, 160, 255, 0.05)' : 'transparent',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          📓 전체 오답 노트 리스트
        </button>
        <button
          onClick={() => setIsEbbinghausFilter(true)}
          className={`outline-btn ${isEbbinghausFilter ? 'active' : ''}`}
          style={{
            padding: '10px 20px',
            fontSize: '0.9rem',
            fontWeight: '800',
            borderColor: isEbbinghausFilter ? 'var(--accent-color)' : 'var(--card-border)',
            color: isEbbinghausFilter ? 'var(--accent-color)' : 'var(--text-secondary)',
            background: isEbbinghausFilter ? 'rgba(84, 160, 255, 0.05)' : 'transparent',
            position: 'relative',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
        >
          🧠 에빙하우스 과학적 복습 대상
          {isEbbinghausFilter && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px',
              background: '#ff6b6b', color: 'white', fontSize: '0.7rem',
              fontWeight: '900', padding: '2px 6px', borderRadius: '100px',
              animation: 'pulse 1s infinite'
            }}>
              TODAY
            </span>
          )}
        </button>
      </div>

      {wrongAnswers.length === 0 ? (
        /* 오답이 없을 때의 웰컴 피드백 */
        <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '16px' }}>✨</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>복습할 오답이 전혀 없습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            모든 퀴즈 문제를 완벽하게 통과하셨습니다. 정말 대단한 실력입니다!
          </p>
          <Link href="/" passHref legacyBehavior>
            <a className="glow-btn" style={{ padding: '12px 30px', textDecoration: 'none' }}>
              더 많은 퀴즈 도전하기 ➔
            </a>
          </Link>
        </div>
      ) : (
        /* 오답 카드 목록 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 머리글 설명 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--card-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
              총 {wrongAnswers.length}개의 틀린 단어/문항 대기 중
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
              해결 완료 버튼을 누르면 이 리스트에서 소탕됩니다.
            </span>
          </div>

          {wrongAnswers.map((item, idx) => {
            const quiz = item.quiz;
            return (
              <div 
                key={`${item.id}-${idx}`} 
                className="premium-card wrong-note-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px 30px',
                  borderColor: 'rgba(255, 107, 107, 0.2)'
                }}
              >
                {/* 오답 상세 정보 */}
                <div className="wrong-info-container" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexGrow: 1, marginRight: '24px' }}>
                  {/* 에빙하우스 주기 레벨 배지 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255, 107, 107, 0.06)',
                      border: '2px solid #ff6b6b',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ff6b6b',
                      fontWeight: '800',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}>
                      <span>LEVEL</span>
                      <span style={{ fontSize: '1.2rem', marginTop: '-3px', fontWeight: '950' }}>{item.reviewCount || 1}</span>
                    </div>
                    {/* 다음 복습 가능 상태 정보 계산 */}
                    {(() => {
                      const lastFailedTime = new Date(item.lastFailed).getTime();
                      const now = Date.now();
                      const diffHours = (now - lastFailedTime) / (1000 * 60 * 60);
                      const reviewCount = item.reviewCount || 1;
                      
                      let targetHours = 24;
                      if (reviewCount === 2) targetHours = 72;
                      if (reviewCount === 3) targetHours = 168;
                      if (reviewCount === 4) targetHours = 360;
                      if (reviewCount === 5) targetHours = 720;
                      
                      const remainingHours = targetHours - diffHours;
                      
                      if (remainingHours <= 0) {
                        return (
                          <span style={{ fontSize: '0.7rem', color: '#1dd1a1', fontWeight: '900', background: 'rgba(29, 209, 161, 0.1)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(29, 209, 161, 0.2)' }}>
                            🔥 복습 대기 완료
                          </span>
                        );
                      } else {
                        return (
                          <span style={{ fontSize: '0.7rem', color: '#ff9f43', fontWeight: '800', background: 'rgba(255, 159, 67, 0.1)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(255, 159, 67, 0.2)' }}>
                            ⏳ {Math.ceil(remainingHours)}시간 대기
                          </span>
                        );
                      }
                    })()}
                  </div>

                  <div>
                    {/* 원래 출제 문제 설명 */}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      원래 질문: {quiz.questionText
                        .replace(/\[N(1|2)-(EASY|MEDIUM|HARD)\]\s*/g, '')
                        .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
                        .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '')}
                    </span>
                    
                    {/* 단어 및 요미가나 */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                      <h4 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                        {quiz.japaneseWord}
                      </h4>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        [{quiz.pronunciation}]
                      </span>
                    </div>

                    {/* 올바른 정답 표기 */}
                    <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700' }}>
                      ✓ 올바른 정답: {quiz.correctAnswer}
                    </p>
                  </div>
                </div>

                {/* 제어 버튼 묶음 */}
                <div className="wrong-btn-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <button 
                    onClick={() => speak(quiz.japaneseWord)}
                    className="outline-btn"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                  >
                    🔊 발음 듣기
                  </button>

                  <button 
                    onClick={() => handleResolve(item.id)}
                    className="glow-btn"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      background: 'var(--accent-color)',
                      boxShadow: 'none',
                      justifyContent: 'center'
                    }}
                  >
                    ✓ 복습 완료!
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 🔮 동기화 피드백용 플로팅 토스트 메시지 연출 */}
      {toastMessage && (
        <div className="sync-toast-message-floating fade-in">
          <span className="sync-toast-icon">📢</span>
          <span className="sync-toast-text">{toastMessage}</span>
        </div>
      )}

      {/* 🎉 [에빙하우스 5단계 졸업용 꽃가루 confetti 캔버스] */}
      <canvas 
        ref={confettiCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 99999
        }}
      />

    </div>
  );
}
