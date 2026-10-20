import { getSyncHeaders } from './clientProfile.mjs';

function backupUrl(type) {
  if (!['bookmarks', 'wrong-notes'].includes(type)) throw new Error('지원하지 않는 백업 종류입니다.');
  return `/api/sync?type=${type}`;
}
export async function exportLearningBackup(type) {
  const response = await fetch(backupUrl(type), { headers: getSyncHeaders() });
  return response.json();
}
export async function importLearningBackup(type, payload) {
  const response = await fetch(backupUrl(type), {
    method: 'POST', headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  return response.json();
}
export async function copyBackupCode(code) {
  if (navigator.clipboard) return navigator.clipboard.writeText(code);
  const textarea = document.createElement('textarea');
  textarea.value = code;
  document.body.appendChild(textarea);
  try { textarea.select(); document.execCommand('copy'); }
  finally { textarea.remove(); }
}
export function downloadLearningBackup(rawJson, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(rawJson, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link);
  try { link.click(); }
  finally { link.remove(); URL.revokeObjectURL(url); }
}
