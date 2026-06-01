'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { getExampleSentence } from '@/utils/exampleSentences';

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const { speak } = useJapaneseSpeech();

  // ⚡ 스마트 크로스 동기화 상태
  const [backupCode, setBackupCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 🍿 상세 예문 모달 상태
  const [selectedWord, setSelectedWord] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSyncHeaders = (extra = {}) => {
    const username = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
    return {
      'x-nihongo-username': encodeURIComponent(username),
      ...extra
    };
  };

  // 1. 단어장 단어 로드
  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch('/api/bookmarks', {
          headers: getSyncHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.bookmarks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  // 2. 단어 삭제 처리
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { 
        method: 'DELETE',
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 📥 [EXPORT] 단어장 백업 코드 생성 및 클립보드 복사
  const handleExportCode = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/sync?type=bookmarks', {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success && data.backupCode) {
        setBackupCode(data.backupCode);
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.backupCode);
          showToast("단어장 백업 코드가 복사되었습니다! 📋");
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = data.backupCode;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          showToast("단어장 백업 코드가 복사되었습니다! 📋");
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

  // 📤 [IMPORT] 붙여넣은 백업 코드로 단어장 스마트 병합
  const handleImportCode = async () => {
    if (!inputCode.trim()) {
      alert("주입할 단어장 백업 코드를 입력해 주세요!");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/sync?type=bookmarks', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ backupCode: inputCode.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setInputCode('');
        alert(`🎉 단어장 병합 완료!\n신규 단어 ${data.addedCount}개가 정상적으로 추가 통합되었습니다!`);
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

  // 📄 [FILE EXPORT] 단어장 JSON 파일 다운로드
  const handleJsonExport = async () => {
    try {
      const res = await fetch('/api/sync?type=bookmarks', {
        headers: getSyncHeaders()
      });
      const data = await res.json();
      if (data.success && data.rawJson) {
        const jsonStr = JSON.stringify(data.rawJson, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nihongo_quest_vocabulary_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("단어장 JSON 파일이 다운로드되었습니다! 💾");
      } else {
        alert("백업 파일 추출 실패");
      }
    } catch (e) {
      alert("파일 백업 에러: " + e.message);
    }
  };

  // 📄 [FILE IMPORT] 단어장 JSON 파일 선택 주입
  const handleJsonImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target.result);
        setImporting(true);
        const res = await fetch('/api/sync?type=bookmarks', {
          method: 'POST',
          headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ rawJson })
        });
        const data = await res.json();
        if (data.success) {
          alert(`🎉 파일 병합 성공!\n신규 단어 ${data.addedCount}개가 단어장에 통합되었습니다!`);
          window.location.reload();
        } else {
          alert("파일 주입 실패: " + data.error);
        }
      } catch (parseErr) {
        alert("올바르지 않은 단어장 JSON 파일 형식입니다.");
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
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>⭐</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>단어장을 열고 정렬하는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1280px', padding: '40px 24px' }}>
      
      {/* 뒤로가기 및 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
          ← 메인으로 이동
        </Link>
        <h1 style={{ fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          ⭐ 나의 일본어 단어장 (Vocabulary)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          퀴즈 도중 눈에 띈 어려운 단어들을 나만의 비밀 단어장에 모으고 소리내어 복습하는 공간
        </p>
      </div>

      {/* ⚡ 단어장 전용 크로스 동기화 센터 */}
      <div className="glass-premium-card rainbow-border sync-hub-premium-card" style={{ marginBottom: '32px' }}>
        <div className="sync-hub-header">
          <span className="sync-hub-icon">⭐</span>
          <div className="sync-hub-title-box">
            <h3 className="sync-hub-title">단어장 데이터 동기화 센터</h3>
            <p className="sync-hub-desc">폰과 컴퓨터를 오가며 나만의 비밀 단어장 데이터를 추출하고 중복 없이 머지(Merge)하세요!</p>
          </div>
        </div>

        <div className="sync-hub-grid">
          {/* 백업 */}
          <div className="sync-hub-section export-section">
            <h4 className="sync-section-title">📤 단어장 백업 코드 추출</h4>
            <p className="sync-section-desc">현재 단어 데이터를 텍스트 코드로 압축 복사하거나 파일로 다운로드합니다.</p>
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
            <h4 className="sync-section-title">📥 다른 기기 단어장 가져오기</h4>
            <p className="sync-section-desc">다른 기기에서 복사한 단어장 코드를 입력하거나 파일을 올려서 중복 없이 병합합니다.</p>
            <div className="import-inputs-wrapper">
              <div className="code-import-box">
                <input 
                  type="text"
                  placeholder="단어장 백업 코드를 붙여넣으세요..."
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

      {bookmarks.length === 0 ? (
        /* 단어장이 비어 있을 때의 웰컴 카드 */
        <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '16px' }}>📖</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>단어장이 비어 있습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            퀴즈 플레이 도중 마음에 드는 단어나 헷갈리는 문자를 보면 <strong>[나의 단어장 추가]</strong>를 꾹 눌러보세요.
          </p>
          <Link href="/" passHref legacyBehavior>
            <a className="glow-btn" style={{ padding: '12px 30px', textDecoration: 'none' }}>
              퀴즈 풀고 단어 수집하러 가기 ➔
            </a>
          </Link>
        </div>
      ) : (
        /* 단어장 리스트 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ borderBottom: '1.5px solid var(--card-border)', paddingBottom: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
              저장된 소중한 영단어/일어단어: 총 {bookmarks.length}개
            </span>
          </div>

          <div className="vocabulary-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {bookmarks.map((item) => (
              <div 
                key={item.id} 
                className="premium-card wrong-note-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  minHeight: '110px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedWord(item)}
              >
                <div>
                  {/* 단어의 요미가나 표기 */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    {item.reading}
                  </span>
                  
                  {/* 단어 본문 */}
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                    {item.word}
                  </h4>
                  
                  {/* 단어 뜻 */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700', marginTop: '6px' }}>
                    {item.meaning}
                  </p>
                </div>

                {/* 제어 버튼 */}
                <div className="wrong-btn-actions" 
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}
                  onClick={(e) => e.stopPropagation()} // 💡 모달 팝업 버블링 차단!
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // 💡 버블링 차단!
                      speak(item.word);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--custom-radius)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🔊 재생
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // 💡 버블링 차단!
                      handleDelete(item.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'rgba(255, 107, 107, 0.08)',
                      border: '1px solid rgba(255, 107, 107, 0.2)',
                      color: '#ff6b6b',
                      borderRadius: 'var(--custom-radius)',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    🗑️ 제거
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* 🔮 동기화 피드백용 플로팅 토스트 메시지 연출 */}
      {toastMessage && (
        <div className="sync-toast-message-floating fade-in">
          <span className="sync-toast-icon">📢</span>
          <span className="sync-toast-text">{toastMessage}</span>
        </div>
      )}

      {/* 🔮 [단어 디테일 예문 보기 프리미엄 모달] */}
      {selectedWord && mounted && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="premium-card animate-scale modal-premium-content" style={{
            maxWidth: '520px',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'left',
            padding: '36px',
            position: 'relative'
          }}>
            {/* 상단 닫기 아이콘 */}
            <button 
              onClick={() => setSelectedWord(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: '900'
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
              ⭐ 단어 상세 정보
            </span>

            {/* 일본어 표기 및 요미가나 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                {selectedWord.word}
              </h2>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                [{selectedWord.reading}]
              </span>
            </div>

            {/* 한글 뜻 */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              borderLeft: '4px solid var(--accent-color)',
              marginBottom: '24px' 
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>
                한글 의미
              </span>
              <p style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: '800', margin: '4px 0 0 0' }}>
                {selectedWord.meaning}
              </p>
            </div>

            {/* 🍱 찰떡 매칭 예시 문장 영역 */}
            <div style={{
              background: 'rgba(255, 179, 126, 0.05)',
              border: '1px solid rgba(255, 179, 126, 0.25)',
              borderRadius: 'var(--custom-radius)',
              padding: '20px',
              marginBottom: '28px'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#ffb37e', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                📝 학습용 실전 예시 문장
              </span>
              
              {/* 일본어 예문 */}
              <p style={{ 
                fontSize: '1.1rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                lineHeight: '1.6',
                marginBottom: '10px',
                wordBreak: 'break-all'
              }}>
                {getExampleSentence(selectedWord.word, selectedWord.meaning).sentence}
              </p>

              {/* 한국어 번역 */}
              <p style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'var(--text-secondary)', 
                lineHeight: '1.5',
                margin: 0
              }}>
                {getExampleSentence(selectedWord.word, selectedWord.meaning).translation}
              </p>
            </div>

            {/* 하단 제어 버튼 모음 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => speak(selectedWord.word)}
                className="outline-btn"
                style={{ padding: '12px 20px', fontSize: '0.9rem', flex: 1, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
              >
                🔊 단어 듣기
              </button>
              
              <button 
                onClick={() => speak(getExampleSentence(selectedWord.word, selectedWord.meaning).sentence)}
                className="glow-btn"
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '0.9rem', 
                  flex: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, #ff9494 100%)'
                }}
              >
                📢 예문 전체 듣기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
