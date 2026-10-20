'use client';

export default function LearningBackupPanel({ type, backup, expanded, onToggle }) {
  const label = type === 'bookmarks' ? '단어장' : '오답노트';
  const noun = type === 'bookmarks' ? '단어' : '오답 복습 기록';
  const { backupCode, inputCode, setInputCode, exporting, importing,
    handleExportCode, handleImportCode, handleJsonExport, handleJsonImport } = backup;
  return <div className="glass-premium-card rainbow-border sync-hub-premium-card" style={{ marginBottom: '32px' }}>
    <button type="button" className={`sync-hub-header${expanded ? ' expanded' : ''}`} onClick={onToggle}
      aria-expanded={expanded} style={{ width: '100%', border: 0, background: 'none', color: 'inherit', textAlign: 'left', padding: 0, cursor: 'pointer' }}>
      <div className="sync-hub-title-box">
        <h3 className="sync-hub-title" style={{ margin: 0 }}>{label} 데이터 동기화 센터</h3>
        <p className="sync-hub-desc" style={{ margin: '4px 0 0' }}>{type === 'bookmarks' ? '저장한 단어' : '복습 기록'}를 백업하거나 다른 기기의 데이터를 가져옵니다.</p>
      </div>
      <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
    </button>
    {expanded && <div className="sync-hub-grid" style={{ marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
      <div className="sync-hub-section export-section">
        <h4 className="sync-section-title">📤 {label} 백업 코드 추출</h4>
        <p className="sync-section-desc">현재 {noun}를 텍스트 코드로 압축 복사하거나 파일로 다운로드합니다.</p>
        <div className="sync-action-buttons">
          <button onClick={handleExportCode} disabled={exporting} className="glass-neon-btn export-code-btn">{exporting ? '생성 중...' : '📋 백업 코드 복사'}</button>
          <button onClick={handleJsonExport} className="outline-btn file-export-btn">💾 JSON 파일 저장</button>
        </div>
        {backupCode && <div className="backup-code-preview fade-in">
          <span className="code-label">생성된 백업 코드:</span>
          <textarea readOnly value={backupCode} className="backup-code-input" onClick={event => event.target.select()} aria-label={`${label} 백업 코드`} />
        </div>}
      </div>
      <div className="sync-hub-section import-section">
        <h4 className="sync-section-title">📥 다른 기기 {label} 가져오기</h4>
        <p className="sync-section-desc">다른 기기에서 복사한 백업 코드나 파일을 중복 없이 병합합니다.</p>
        <div className="import-inputs-wrapper">
          <div className="code-import-box">
            <input type="text" value={inputCode} onChange={event => setInputCode(event.target.value)}
              placeholder="백업 코드를 붙여넣으세요" aria-label={`${label} 가져올 백업 코드`} className="sync-import-text-input" />
            <button onClick={handleImportCode} disabled={importing || !inputCode.trim()} className="glass-neon-btn import-code-action-btn">{importing ? '병합 중...' : '가져오기'}</button>
          </div>
          <div className="file-import-box">
            <span className="file-import-label">JSON 백업 파일 복구:</span>
            <label className="file-upload-custom-btn">📂 파일 선택
              <input type="file" accept=".json" onChange={handleJsonImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}
