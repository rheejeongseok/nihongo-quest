import { n1CourseForRoute } from '../data/n1Courses.mjs';

export function shuffleN1(array, random = Math.random) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
export function deduplicateN1(quizzes) {
  const unique = new Map();
  for (const quiz of quizzes) {
    const text = quiz.questionText.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
    const key = JSON.stringify([quiz.stageId, quiz.quizType, text, quiz.japaneseWord, quiz.correctAnswer]);
    if (!unique.has(key)) unique.set(key, quiz);
  }
  return [...unique.values()];
}
export const stimulusKey = quiz => quiz.stimulusId || quiz.id;
function sample(pool, count, seen, random) {
  const selected = [];
  for (const quiz of shuffleN1(pool, random)) {
    const key = stimulusKey(quiz);
    if (seen.has(key)) continue;
    selected.push(quiz);
    seen.add(key);
    if (selected.length === count) break;
  }
  return selected;
}
export async function getN1Arena(prisma, stageNumber, requestedCategory, random = Math.random) {
  const course = n1CourseForRoute(stageNumber, requestedCategory);
  if (!course) return null;
  const stages = await prisma.stage.findMany({ where: { stageNumber: { in: [1, 2, 3, 4, 5] } } });
  const ids = Object.fromEntries(stages.map(stage => [stage.stageNumber, stage.id]));
  if ([1, 2, 3, 4, 5].some(number => !ids[number])) return null;
  // The DB is the runtime question source. Unreviewed historical rows are excluded.
  const pool = deduplicateN1(await prisma.quiz.findMany({
    where: { jlptLevel: 'N1', arenaCategory: course.category, status: 'ACTIVE' }
  }));
  const filter = category => pool.filter(quiz => {
    if (category === 'WORDLE') return quiz.quizType === 'WORDLE';
    if (category === 'READING') return quiz.quizType === 'READING';
    if (category === 'VOCAB') return quiz.quizType === 'MULTIPLE_CHOICE';
    if (category === 'GRAMMAR') return ['ASSEMBLY', 'MULTIPLE_CHOICE'].includes(quiz.quizType);
    return quiz.quizType === 'LISTENING';
  });
  const seen = new Set();
  let selected;
  if (course.category === 'VOCAB') {
    selected = shuffleN1([
      ...sample(filter('VOCAB').filter(quiz => quiz.itemType === 'reading'), 3, seen, random),
      ...sample(filter('VOCAB').filter(quiz => quiz.itemType === 'context'), 3, seen, random),
      ...sample(filter('VOCAB').filter(quiz => quiz.itemType === 'paraphrase'), 2, seen, random),
      ...sample(filter('VOCAB').filter(quiz => quiz.itemType === 'usage'), 2, seen, random)
    ], random);
  } else if (course.category === 'GRAMMAR') {
    selected = shuffleN1([
      ...sample(filter('GRAMMAR').filter(quiz => quiz.quizType === 'MULTIPLE_CHOICE'), 6, seen, random),
      ...sample(filter('GRAMMAR').filter(quiz => quiz.quizType === 'ASSEMBLY'), 4, seen, random)
    ], random);
  } else selected = sample(filter(course.category), 10, seen, random);
  if (selected.length < 10) return null;
  return { stage: { id: ids[course.stageNumber] || ids[3], stageNumber: course.stageNumber,
    title: `N1 ${course.title}`, category: course.category, jlptLevel: 'N1', difficulty: 'N1' }, quizzes: selected };
}
