import { beginnerCourseForRoute } from '../data/beginnerCourses.mjs';
import { shuffleN1, stimulusKey } from './n1Arena.mjs';

export async function getBeginnerArena(prisma, number, category, difficulty = 'EASY', random = Math.random) {
  const course = beginnerCourseForRoute(number, category);
  if (!course || !['EASY','MEDIUM','HARD'].includes(difficulty)) return null;
  if (course.category === 'KANA') difficulty = 'EASY';
  const stages = await prisma.stage.findMany({ where: { stageNumber: { in: [1,3,4,5] } } });
  const ids = Object.fromEntries(stages.map(stage => [stage.stageNumber, stage.id]));
  const pool = await prisma.quiz.findMany({ where: { jlptLevel: 'BEGINNER', status: 'ACTIVE',
    arenaCategory: course.category, questionText: { contains: `[BEGINNER-${difficulty}]` } } });
  const seen = new Set();
  const take = (rows, count) => {
    const selected = [];
    for (const row of shuffleN1(rows, random)) {
      const source = stimulusKey(row);
      if (seen.has(source)) continue;
      selected.push(row); seen.add(source);
      if (selected.length === count) break;
    }
    return selected;
  };
  const quizzes = course.category === 'VOCAB'
    ? shuffleN1([...take(pool.filter(q => q.itemType === 'reading'), 5), ...take(pool.filter(q => q.itemType === 'context'), 5)], random)
    : course.category === 'GRAMMAR'
      ? shuffleN1([...take(pool.filter(q => q.quizType === 'MULTIPLE_CHOICE'), 6), ...take(pool.filter(q => q.quizType === 'ASSEMBLY'), 4)], random)
      : take(pool, 10);
  const stageId = ids[course.category === 'KANA' ? 1 : course.stageNumber] || ids[3];
  if (quizzes.length !== 10 || !stageId) return null;
  return { stage: { ...course, id: stageId, title: `초보 ${course.title}`, jlptLevel: 'BEGINNER', difficulty }, quizzes };
}
