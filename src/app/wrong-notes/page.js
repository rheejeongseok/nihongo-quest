'use client';

import { useState, useEffect } from 'react';
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

  const getSyncHeaders = (extra = {}) => {
    const username = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
    return {
      'x-nihongo-username': encodeURIComponent(username),
      ...extra
    };
  };

  // 1. 오답노트 목록 로드
  useEffect(() => {
    async function loadWrongs() {
      try {
        const res = await fetch('/api/wrong-notes', {
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
    }
    loadWrongs();
  }, []);

  // 2. 오답 복습 해결 (오답노트에서 제외)
  const handleResolve = async (id) => {
    try {
      const res = await fetch('/api/wrong-notes', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        // UI에서 즉시 필터링
        setWrongAnswers(prev => prev.filter(item => item.id !== id));
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
        <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
          ← 메인으로 이동
        </Link>
        <h1 style={{ fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📓 스마트 오답 노트 (Wrong Notes)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          틀린 문제들을 집중 복습하여 완벽히 내 것으로 만드는 나만의 오답 소탕 보드
        </p>
      </div>

      {/* ⚡ 오답노트 전용 크로스 동기화 센터 */}
      <div className="glass-premium-card rainbow-border sync-hub-premium-card" style={{ marginBottom: '32px' }}>
        <div className="sync-hub-header">
          <span className="sync-hub-icon">📓</span>
          <div className="sync-hub-title-box">
            <h3 className="sync-hub-title">오답노트 데이터 동기화 센터</h3>
            <p className="sync-hub-desc">폰과 컴퓨터를 오가며 내가 틀린 오답 진도 데이터를 추출하고 중복 없이 머지(Merge)하세요!</p>
          </div>
        </div>

        <div className="sync-hub-grid">
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

          {wrongAnswers.map((item) => {
            const quiz = item.quiz;
            return (
              <div 
                key={item.id} 
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
                  {/* 빨간색 느낌의 오답 경고 원형 */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '2px solid #ff6b6b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff6b6b',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    flexShrink: 0
                  }}>
                    <span>FAIL</span>
                    <span style={{ fontSize: '1rem', marginTop: '-3px' }}>{item.reviewCount}회</span>
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

    </div>
  );
}
