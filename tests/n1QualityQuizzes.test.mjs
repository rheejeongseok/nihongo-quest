import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { deduplicateN1, getN1Arena, stimulusKey } from '../src/lib/n1Arena.mjs';
import { N1_COURSES, n1CourseForRoute } from '../src/data/n1Courses.mjs';
import { evaluateQuizAnswer } from '../src/lib/quizScoring.mjs';

const ids = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
const bank = buildN1Quizzes(ids);
const stages = Object.entries(ids).map(([number, id]) => ({ id, stageNumber: Number(number) }));
const saved = new Map();
const prisma = {
  stage: { findMany: async () => stages },
  quiz: {
    findMany: async () => { throw new Error('Unreviewed DB pool must not be sampled'); },
    upsert: async ({ create }) => { saved.set(create.id, create); return create; }
  },
  $transaction: async operations => Promise.all(operations)
};
function rng(seed) {
  let value = seed;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

test('새 출제 풀은 q3 원본 384개만 사용하고 같은 유형·내용을 중복하지 않는다', () => {
  assert.equal(bank.length, 384);
  assert.equal(new Set(bank.map(quiz => quiz.id)).size, bank.length);
  assert.equal(deduplicateN1(bank).length, bank.length);
  assert.ok(bank.every(quiz => quiz.id.startsWith('n1-q3-') && quiz.questionText.startsWith('[N1] ')));
  assert.deepEqual(N1_COURSES.map(course => course.category), ['VOCAB', 'GRAMMAR', 'LISTENING', 'READING']);
});

test('모든 새 문항의 보기·정답·해설을 검사하고 제시문을 답으로 받아들이지 않는다', () => {
  for (const quiz of bank) {
    assert.ok(quiz.correctAnswer && quiz.hint && quiz.stageId, quiz.id);
    assert.equal(evaluateQuizAnswer(quiz.correctAnswer, quiz), true, quiz.id);
    assert.equal(evaluateQuizAnswer('不正解のテスト入力', quiz), false, quiz.id);
    const values = JSON.parse(quiz.wrongAnswers);
    if (['MULTIPLE_CHOICE', 'LISTENING', 'READING'].includes(quiz.quizType)) {
      assert.equal(values.length, 3, quiz.id);
      assert.equal(new Set([quiz.correctAnswer, ...values]).size, 4, quiz.id);
      assert.ok(values.every(value => typeof value === 'string' && value.trim()), quiz.id);
      assert.ok(values.every(value => !evaluateQuizAnswer(value, quiz)), quiz.id);
      if (quiz.japaneseWord !== quiz.correctAnswer) assert.equal(evaluateQuizAnswer(quiz.japaneseWord, quiz), false, quiz.id);
      assert.ok(quiz.hint.length >= 20, quiz.id);
    }
    if (quiz.quizType === 'ASSEMBLY') {
      assert.equal(values.join(''), quiz.correctAnswer, quiz.id);
      assert.ok(values.length >= 5, quiz.id);
    }
    if (quiz.id.endsWith('-reading')) assert.match(quiz.japaneseWord, /\p{Script=Han}/u, quiz.id);
    if (quiz.quizType === 'WORDLE') assert.equal(quiz.japaneseWord, quiz.correctAnswer, quiz.id);
  }
});

test('독해·조건 비교 청해·문맥·용법을 포함하고 지문별 해설이 있다', () => {
  for (const type of ['漢字読み', '文脈規定', '言い換え', '用法', '文法形式', '文の組み立て',
    '課題理解', 'ポイント理解', '概要理解', '即時応答', '統合理解', '情報検索']) {
    assert.ok(bank.some(quiz => quiz.questionText.includes(`【${type}】`)), type);
  }
  assert.ok(bank.filter(quiz => quiz.quizType === 'READING').every(quiz => quiz.japaneseWord.length >= 150));
  assert.ok(bank.filter(quiz => quiz.id.startsWith('n1-q3-listen')).every(quiz => quiz.japaneseWord.includes('男：') && quiz.japaneseWord.includes('女：')));
});

test('40개 시드에서 통합 유형 비율·같은 소재 중복 방지·정답 저장을 검증한다', async () => {
  for (let seed = 1; seed <= 40; seed++) {
    for (const course of [...N1_COURSES, { stageNumber: 6, category: 'MOCK_EXAM' }, { stageNumber: 5, category: 'WORDLE' }]) {
      const result = await getN1Arena(prisma, course.stageNumber, course.category, rng(seed));
      assert.ok(result, `${seed} ${course.category}`);
      const quizzes = result.quizzes;
      assert.equal(quizzes.length, course.category === 'MOCK_EXAM' ? 15 : 10);
      assert.equal(new Set(quizzes.map(stimulusKey)).size, quizzes.length);
      if (course.category === 'VOCAB') {
        for (const [suffix, count] of [['reading', 3], ['context', 3], ['paraphrase', 2], ['usage', 2]]) {
          assert.equal(quizzes.filter(quiz => quiz.id.endsWith(`-${suffix}`)).length, count);
        }
      }
      if (course.category === 'GRAMMAR') assert.equal(quizzes.filter(quiz => quiz.quizType === 'ASSEMBLY').length, 4);
      if (course.category === 'MOCK_EXAM') {
        assert.equal(quizzes.filter(quiz => quiz.quizType === 'READING').length, 3);
        assert.equal(quizzes.filter(quiz => quiz.quizType === 'LISTENING').length, 4);
        assert.equal(quizzes.filter(quiz => quiz.stageId === ids[1] || quiz.stageId === ids[2]).length, 4);
      }
      assert.ok(quizzes.every(quiz => saved.has(quiz.id)));
    }
  }
});

test('이전 주소는 통합 코스로 연결하고 이전 문제 행은 읽거나 갱신하지 않는다', async () => {
  assert.equal(n1CourseForRoute(2, 'VOCAB').stageNumber, 1);
  assert.equal(n1CourseForRoute(5, 'ASSEMBLY').stageNumber, 3);
  assert.equal(n1CourseForRoute(5, 'WORDLE').category, 'WORDLE');
  assert.equal(n1CourseForRoute(7).category, 'READING');
  assert.equal(await getN1Arena(prisma, 99, ''), null);
  assert.ok([...saved.keys()].every(id => id.startsWith('n1-q3-')));
});
