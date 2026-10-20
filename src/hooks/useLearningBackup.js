'use client';

import { useState } from 'react';
import { exportLearningBackup, importLearningBackup, copyBackupCode, downloadLearningBackup } from '@/lib/learningBackup.mjs';

const config = {
  bookmarks: { label: '단어장', noun: '단어', filename: 'vocabulary' },
  'wrong-notes': { label: '오답노트', noun: '오답', filename: 'wrong_notes' }
};
export function useLearningBackup({ type, notify }) {
  const { label, noun, filename } = config[type];
  const [backupCode, setBackupCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportCode = async () => {
    setExporting(true);
    try {
      const data = await exportLearningBackup(type);
      if (data.success && data.backupCode) {
        setBackupCode(data.backupCode);
        await copyBackupCode(data.backupCode);
        notify(`${label} 백업 코드가 복사되었습니다! 📋`);
      } else notify('백업 코드 생성 실패: ' + (data.error || '데이터가 없습니다.'));
    } catch (error) { notify('백업 네트워크 에러: ' + error.message); }
    finally { setExporting(false); }
  };
  const handleImportCode = async () => {
    if (!inputCode.trim()) { notify(`주입할 ${label} 백업 코드를 입력해 주세요!`); return; }
    setImporting(true);
    try {
      const data = await importLearningBackup(type, { backupCode: inputCode.trim() });
      if (data.success) {
        setInputCode(''); notify(`🎉 ${label} 병합 완료! 신규 ${noun} ${data.addedCount}개가 추가되었습니다!`);
        window.location.reload();
      } else notify('주입 실패: ' + data.error);
    } catch (error) { notify('주입 네트워크 에러: ' + error.message); }
    finally { setImporting(false); }
  };
  const handleJsonExport = async () => {
    try {
      const data = await exportLearningBackup(type);
      if (data.success && data.rawJson) {
        downloadLearningBackup(data.rawJson, `nihongo_quest_${filename}_backup_${new Date().toISOString().slice(0,10)}.json`);
        notify(`${label} JSON 파일이 다운로드되었습니다! 💾`);
      } else notify('백업 파일 추출 실패');
    } catch (error) { notify('파일 백업 에러: ' + error.message); }
  };
  const handleJsonImport = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const rawJson = JSON.parse(event.target.result);
        setImporting(true);
        const data = await importLearningBackup(type, { rawJson });
        if (data.success) {
          notify(`🎉 파일 병합 성공! 신규 ${noun} ${data.addedCount}개가 통합되었습니다!`);
          window.location.reload();
        } else notify('파일 주입 실패: ' + data.error);
      } catch { notify(`올바르지 않은 ${label} JSON 파일 형식입니다.`); }
      finally { setImporting(false); }
    };
    reader.readAsText(file);
  };
  return { backupCode, inputCode, setInputCode, exporting, importing,
    handleExportCode, handleImportCode, handleJsonExport, handleJsonImport };
}
