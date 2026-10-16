import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1Quizzes.mjs';
import { deduplicateN1, getN1Arena } from '../src/lib/n1Arena.mjs';
import { evaluateQuizAnswer } from '../src/lib/quizScoring.mjs';

const ids = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
const bank = buildN1Quizzes(ids);

test('보관된 이전 N1 자료 740개의 ID와 구성을 유지한다', () => {
  assert.equal(bank.length, 740);
  assert.equal(new Set(bank.map(quiz => quiz.id)).size, bank.length);
  assert.equal(deduplicateN1(bank).length, bank.length);
  for (const [stage, type, count] of [[1, 'MULTIPLE_CHOICE', 100], [2, 'MULTIPLE_CHOICE', 220],
    [3, 'MULTIPLE_CHOICE', 110], [4, 'LISTENING', 110], [5, 'WORDLE', 100], [5, 'ASSEMBLY', 100]]) {
    assert.equal(bank.filter(quiz => quiz.stageId === ids[stage] && quiz.quizType === type).length, count);
  }
});

test('모든 신규 객관식의 정답·오답은 비어 있거나 중복되지 않으며 저장된 정답으로 채점된다', () => {
  for (const quiz of bank) {
    assert.ok(quiz.questionText.startsWith('[N1] '), quiz.id);
    assert.doesNotMatch(quiz.questionText, /N1-(EASY|MEDIUM|HARD)/);
    assert.ok(quiz.japaneseWord && quiz.correctAnswer && quiz.hint, quiz.id);
    assert.equal(evaluateQuizAnswer(quiz.correctAnswer, quiz), true, quiz.id);
    assert.equal(evaluateQuizAnswer('不正解のテスト入力', quiz), false, quiz.id);
    const options = JSON.parse(quiz.wrongAnswers);
    if (['MULTIPLE_CHOICE', 'LISTENING'].includes(quiz.quizType)) {
      assert.equal(options.length, 3, quiz.id);
      assert.equal(new Set([quiz.correctAnswer, ...options]).size, 4, quiz.id);
      assert.ok(options.every(value => typeof value === 'string' && value.trim()), quiz.id);
      assert.ok(options.every(value => !evaluateQuizAnswer(value, quiz)), quiz.id);
    }
    if (quiz.quizType === 'ASSEMBLY') {
      assert.equal(options.join(''), quiz.correctAnswer, quiz.id);
      assert.ok(options.length >= 2, quiz.id);
      assert.doesNotMatch(quiz.correctAnswer, /[{}\/]/, quiz.id);
    }
    if (quiz.quizType === 'WORDLE') assert.equal(quiz.japaneseWord, quiz.correctAnswer, quiz.id);
  }
});

test('N1は文脈・言い換え・用法・文章文法・聴解4種を含む', () => {
  for (const type of ['漢字読み', '文脈規定', '言い換え', '用法', '文法形式', '文章の文法', '文の組み立て',
    '課題理解', 'ポイント理解', '概要理解', '即時応答']) {
    assert.ok(bank.some(quiz => quiz.questionText.includes(`【${type}】`)), type);
  }
});

test('기존 난이도별 중복은 합치되 서로 다른 문맥 문제는 유지한다', () => {
  const base = bank[0];
  const variants = ['EASY', 'MEDIUM', 'HARD'].map(level => ({ ...base,
    id: level, questionText: base.questionText.replace('[N1]', `[N1-${level}]`) }));
  assert.equal(deduplicateN1(variants).length, 1);
  assert.equal(deduplicateN1([...variants, { ...base, questionText: '[N1] 別の文脈で読む。' }]).length, 2);
});

test('운영 DB 동기화 없이 새 문제를 출제·저장하고 모의고사의 영역 균형을 유지한다', async () => {
  const saved = [];
  const stages = Object.entries(ids).map(([stageNumber, id]) => ({ stageNumber: Number(stageNumber), id }));
  const prisma = {
    stage: { findMany: async ({ where }) => stages.filter(stage => where.stageNumber.in.includes(stage.stageNumber)) },
    quiz: { findMany: async () => [], upsert: async ({ create }) => { saved.push(create); return create; } },
    $transaction: async operations => Promise.all(operations)
  };
  const result = await getN1Arena(prisma, 6, 'MOCK_EXAM', () => 0.5);
  assert.equal(result.quizzes.length, 15);
  assert.equal(result.quizzes.filter(quiz => quiz.quizType === 'READING').length, 3);
  assert.equal(result.quizzes.filter(quiz => quiz.quizType === 'LISTENING').length, 4);
  assert.equal(saved.length, 15);
  assert.ok(saved.every(quiz => quiz.correctAnswer));
  assert.equal(result.stage.difficulty, 'N1');
  assert.equal(await getN1Arena(prisma, 99, ''), null);
});
