import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Expansion } from '../src/data/n1Expansion20261019.mjs';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { evaluateQuizAnswer } from '../src/lib/quizScoring.mjs';

const ids = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
const quizzes = buildN1Expansion(ids);
test('four non-exam N1 arenas receive 100 additional questions each', () => {
  assert.equal(quizzes.length, 400);
  assert.equal(new Set(quizzes.map(q => q.id)).size, 400);
  for (const category of ['VOCAB', 'GRAMMAR', 'LISTENING', 'READING']) {
    assert.equal(quizzes.filter(q => q.arenaCategory === category).length, 100);
  }
  assert.ok(quizzes.every(q => q.jlptLevel === 'N1' && q.status === 'ACTIVE' && !q.examOrder));
  const old = new Set(buildN1Quizzes(ids).map(q => `${q.questionText}|${q.japaneseWord}|${q.correctAnswer}`));
  assert.ok(quizzes.every(q => !old.has(`${q.questionText}|${q.japaneseWord}|${q.correctAnswer}`)));
});
test('all distractors are distinct, explanations present, and composition pieces reproduce the answer', () => {
  const unique = new Set();
  for (const quiz of quizzes) {
    const key = `${quiz.questionText}|${quiz.japaneseWord}|${quiz.correctAnswer}`;
    assert.ok(!unique.has(key), quiz.id); unique.add(key);
    assert.ok(quiz.hint?.length > 10, quiz.id);
    assert.ok(quiz.stimulusId && quiz.stageId && quiz.correctAnswer, quiz.id);
    assert.equal(evaluateQuizAnswer(quiz.correctAnswer, quiz), true, quiz.id);
    const options = JSON.parse(quiz.wrongAnswers);
    if (quiz.quizType === 'ASSEMBLY') {
      assert.ok(options.length >= 5, quiz.id);
      assert.equal(options.join(''), quiz.correctAnswer, quiz.id);
    } else {
      assert.equal(options.length, 3, quiz.id);
      assert.equal(new Set([quiz.correctAnswer, ...options]).size, 4, quiz.id);
      assert.ok(options.every(option => option.trim() && !evaluateQuizAnswer(option, quiz)), quiz.id);
    }
  }
});
test('vocabulary balances four types; reading and listening have 20 distinct stimuli each', () => {
  for (const type of ['reading', 'context', 'paraphrase', 'usage']) assert.equal(quizzes.filter(q => q.arenaCategory === 'VOCAB' && q.itemType === type).length, 25);
  for (const category of ['READING', 'LISTENING']) {
    const rows = quizzes.filter(q => q.arenaCategory === category);
    assert.equal(new Set(rows.map(q => q.stimulusId)).size, 20);
    assert.equal(new Set(rows.map(q => q.japaneseWord)).size, 20);
    assert.ok(rows.every(q => q.japaneseWord.length >= 200));
    for (const source of new Set(rows.map(q => q.stimulusId))) assert.equal(rows.filter(q => q.stimulusId === source).length, 5);
  }
  const reading = quizzes.filter(q => q.arenaCategory === 'READING');
  assert.ok(reading.filter(q => q.japaneseWord.length >= 850).length >= 15);
});
