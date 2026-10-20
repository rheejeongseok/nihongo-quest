// A shared nickname/track header contract. This intentionally remains nickname based.
export function getSyncHeaders(extra = {}) {
  const username = typeof window !== 'undefined'
    ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
  const targetLevel = typeof window !== 'undefined'
    ? (localStorage.getItem('nihongo_quest_target_level') || 'N1') : 'N1';
  return {
    'x-nihongo-username': encodeURIComponent(username),
    'x-nihongo-target-level': targetLevel,
    ...extra
  };
}
