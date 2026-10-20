import { buildBeginnerQuizzes } from '../data/beginnerRebuilt.mjs';
import { buildN1Quizzes } from '../data/n1QualityQuizzes.mjs';
import { buildN1Exam } from '../data/n1Exam.mjs';
import { buildN1Expansion } from '../data/n1Expansion20261019.mjs';
import { buildN1ExpansionBatch2 } from '../data/n1ExpansionBatch2.mjs';

// Physical stage IDs stay stable because existing attempts reference their quizzes.
const stages = [
  [1, '문자 정복 아레나', 'CHARACTERS'],
  [2, '어휘 아레나', 'VOCAB'],
  [3, '문법 아레나', 'GRAMMAR'],
  [4, '청해 아레나', 'LISTENING'],
  [5, '워들·문장 구성', 'WORDLE']
];
const fields = ['stageId', 'quizType', 'questionText', 'japaneseWord', 'pronunciation', 'correctAnswer', 'wrongAnswers', 'hint',
  'jlptLevel', 'arenaCategory', 'itemType', 'status', 'stimulusId', 'examOrder', 'examDomain'];

function practiceMetadata(quiz, ids, level) {
  const category = quiz.quizType === 'WORDLE' ? 'WORDLE' : quiz.quizType === 'READING' ? 'READING'
    : quiz.quizType === 'LISTENING' ? 'LISTENING' : quiz.quizType === 'ASSEMBLY' ? 'GRAMMAR'
    : quiz.stageId === ids[3] ? 'GRAMMAR' : 'VOCAB';
  return { ...quiz, jlptLevel: level, arenaCategory: category, status: 'ACTIVE',
    itemType: level === 'N1' ? quiz.id.split('-').at(-1) : quiz.quizType,
    stimulusId: quiz.id.replace(/-[^-]+$/, ''), examOrder: null, examDomain: null };
}

export async function syncLearningData(prisma, { overwrite = false, level } = {}) {
  const ids = {};
  for (const [stageNumber, title, category] of stages) {
    const data = { title, category, difficulty: 'ALL' };
    const stage = await prisma.stage.upsert({ where: { stageNumber }, update: data, create: { stageNumber, ...data } });
    ids[stageNumber] = stage.id;
  }
  const quizzes = [
    ...buildN1Quizzes(ids).map(quiz => practiceMetadata(quiz, ids, 'N1')),
    ...buildN1Expansion(ids),
    ...buildN1ExpansionBatch2(ids),
    ...buildBeginnerQuizzes(ids),
    ...buildN1Exam(ids).map(({ domain, ...quiz }, index) => ({ ...quiz, jlptLevel: 'N1', arenaCategory: 'MOCK_EXAM',
      status: 'ACTIVE', itemType: quiz.quizType, stimulusId: quiz.id, examOrder: index + 1, examDomain: domain }))
  ].filter(quiz => !level || quiz.jlptLevel === level);
  const existing = await prisma.quiz.findMany({ where: { id: { in: quizzes.map(quiz => quiz.id) } } });
  const byId = new Map(existing.map(quiz => [quiz.id, quiz]));
  const result = { totalQuizzesSeeded: quizzes.length, created: 0, updated: 0, unchanged: 0, preservedLearningData: true };
  const changed = [];
  for (const quiz of quizzes) {
    const previous = byId.get(quiz.id);
    // Once imported, DB edits and activation choices are authoritative.
    if (previous && previous.jlptLevel !== 'LEGACY' && previous.jlptLevel && !overwrite) {
      result.unchanged++;
      continue;
    }
    if (previous && fields.every(field => (previous[field] ?? null) === (quiz[field] ?? null))) {
      result.unchanged++;
      continue;
    }
    result[previous ? 'updated' : 'created']++;
    changed.push(quiz);
  }
  for (let index = 0; index < changed.length; index += 100) {
    await prisma.$transaction(changed.slice(index, index + 100).map(quiz => {
      const { id, ...data } = quiz;
      return prisma.quiz.upsert({ where: { id }, update: data, create: quiz });
    }));
  }
  return result;
}
