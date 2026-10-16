export const N1_COURSES = [
  { id: 'n1-vocab', stageNumber: 1, title: '문자·어휘', category: 'VOCAB', emoji: '📚', color: '#ffb37e', desc: '독음·문맥·유의어·용법을 함께 연습합니다.' },
  { id: 'n1-grammar', stageNumber: 3, title: '문법·문장 구성', category: 'GRAMMAR', emoji: '⚙️', color: '#a6cf98', desc: '의미가 가까운 표현을 구별하고 문장을 조립합니다.' },
  { id: 'n1-listening', stageNumber: 4, title: '청해', category: 'LISTENING', emoji: '🎧', color: '#90b4fc', desc: '대화의 조건 변경, 요점과 화자의 의도를 파악합니다.' },
  { id: 'n1-reading', stageNumber: 7, title: '독해', category: 'READING', emoji: '📖', color: '#b19ffb', desc: '글의 논리·필자 의도·자료 비교·정보 검색을 연습합니다.' }
];
export const N1_MOCK = { id: 'n1-mock', stageNumber: 6, title: '15분 종합 연습', category: 'MOCK_EXAM', emoji: '📝', color: '#ff5e7e' };
export function n1CourseForRoute(number, category = '') {
  if (number === 6) return N1_MOCK;
  if (number === 5 && category !== 'ASSEMBLY') return { id: 'n1-wordle', stageNumber: 5, title: '어휘 워들 복습', category: 'WORDLE' };
  if (number === 2) return N1_COURSES[0];
  if (number === 5) return N1_COURSES[1];
  return N1_COURSES.find(course => course.stageNumber === number) || null;
}
