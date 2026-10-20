export const BEGINNER_COURSES = [
  { id: 'beginner-kana', stageNumber: 8, title: '처음 문자 익히기', category: 'KANA', emoji: '🔤', color: '#f1b8cc', desc: '처음 시작하는 히라가나·가타카나 92자 소리 연결 연습입니다.' },
  { id: 'beginner-vocab', stageNumber: 1, title: '문자·어휘', category: 'VOCAB', emoji: '📚', color: '#ffb37e', desc: '기초 한자 읽기와 생활 어휘를 문맥 속에서 익힙니다.' },
  { id: 'beginner-grammar', stageNumber: 3, title: '문법·문장 구성', category: 'GRAMMAR', emoji: '⚙️', color: '#a6cf98', desc: '기초 표현부터 중급 입문 문장까지 단계적으로 연습합니다.' },
  { id: 'beginner-listening', stageNumber: 4, title: '청해', category: 'LISTENING', emoji: '🎧', color: '#90b4fc', desc: '생활 대화와 안내를 듣고 필요한 정보를 찾습니다.' },
  { id: 'beginner-reading', stageNumber: 7, title: '독해', category: 'READING', emoji: '📖', color: '#b19ffb', desc: '메모·안내문부터 짧은 설명문까지 읽고 이해합니다.' }
];
export function beginnerCourseForRoute(number, category = '') {
  if (number === 2 || number === 6 || (number === 5 && category !== 'ASSEMBLY')) return BEGINNER_COURSES.find(course => course.category === 'VOCAB');
  if (number === 5) return BEGINNER_COURSES.find(course => course.category === 'GRAMMAR');
  return BEGINNER_COURSES.find(course => course.stageNumber === number) || null;
}
