import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { buildN1Expansion } from '../src/data/n1Expansion20261019.mjs';
import { buildN1ExpansionBatch2 } from '../src/data/n1ExpansionBatch2.mjs';
import { buildN1ExpansionBatch3 } from '../src/data/n1ExpansionBatch3.mjs';
import { buildN1Exam } from '../src/data/n1Exam.mjs';
import { evaluateQuizAnswer, getN1Assembly } from '../src/lib/quizScoring.mjs';

const ids = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
const rows = buildN1ExpansionBatch3(ids);
const previous = [...buildN1Quizzes(ids), ...buildN1Expansion(ids), ...buildN1ExpansionBatch2(ids), ...buildN1Exam(ids)];
const identity = quiz => JSON.stringify([
  quiz.quizType, quiz.questionText.replace(/^\[N1\]\s*/u, '').normalize('NFKC'),
  quiz.japaneseWord.normalize('NFKC'), quiz.correctAnswer.normalize('NFKC')
]);

test('N1의 네 연습 아레나에 중복 없는 100문항씩 추가한다', () => {
  const existingIds = new Set(previous.map(quiz => quiz.id));
  const existingContent = new Set(previous.map(identity));
  assert.equal(rows.length, 400);
  assert.equal(new Set(rows.map(quiz => quiz.id)).size, 400);
  assert.equal(new Set(rows.map(identity)).size, 400);
  for (const category of ['VOCAB', 'GRAMMAR', 'READING', 'LISTENING']) {
    assert.equal(rows.filter(quiz => quiz.arenaCategory === category).length, 100);
  }
  for (const quiz of rows) {
    assert.ok(!existingIds.has(quiz.id), quiz.id);
    assert.ok(!existingContent.has(identity(quiz)), quiz.id);
    assert.ok(quiz.stageId && quiz.stimulusId && quiz.correctAnswer, quiz.id);
    assert.equal(quiz.jlptLevel, 'N1');
    assert.equal(quiz.status, 'ACTIVE');
    assert.match(quiz.hint.split('\n')[0], /[가-힣]/u, quiz.id);
  }

  const previousWords = new Set(previous.filter(quiz => quiz.quizType === 'WORDLE' || quiz.id.endsWith('-reading')).map(quiz => quiz.japaneseWord));
  for (const type of ['reading', 'context', 'paraphrase', 'usage']) {
    assert.equal(rows.filter(quiz => quiz.arenaCategory === 'VOCAB' && quiz.itemType === type).length, 25);
  }
  for (const quiz of rows.filter(item => item.itemType === 'reading')) {
    assert.ok(!previousWords.has(quiz.japaneseWord), quiz.japaneseWord);
  }
});

test('새 ★ 문제의 정답 위치와 객관식 보기, 지문 및 대본 구성이 유효하다', () => {
  assert.equal(rows.filter(quiz => quiz.quizType === 'ASSEMBLY').length, 50);
  for (const quiz of rows) {
    const options = JSON.parse(quiz.wrongAnswers);
    if (quiz.quizType === 'ASSEMBLY') {
      const board = getN1Assembly(quiz);
      assert.ok(board?.prefix && board.suffix, quiz.id);
      assert.equal(board.prefix + board.options.join('') + board.suffix, quiz.correctAnswer);
      assert.equal(new Set(board.options).size, board.options.length, quiz.id);
      assert.ok(evaluateQuizAnswer(board.options[board.starSlot], { ...quiz, correctAnswer: board.options[board.starSlot], assemblyBoard: board }));
    } else {
      assert.equal(options.length, 3, quiz.id);
      assert.equal(new Set([quiz.correctAnswer, ...options]).size, 4, quiz.id);
      assert.ok(options.every(option => option.trim() && !evaluateQuizAnswer(option, quiz)), quiz.id);
    }
  }

  for (const type of ['READING', 'LISTENING']) {
    const selected = rows.filter(quiz => quiz.quizType === type);
    const sources = new Map();
    const previousTexts = new Set(previous.filter(quiz => quiz.quizType === type).map(quiz => quiz.japaneseWord));
    for (const quiz of selected) {
      assert.ok(!previousTexts.has(quiz.japaneseWord), quiz.id);
      assert.ok(quiz.japaneseWord.length >= 220, quiz.id);
      if (type === 'LISTENING') assert.ok(quiz.hint.endsWith(quiz.japaneseWord), quiz.id);
      const sameSource = sources.get(quiz.stimulusId) ?? [];
      sameSource.push(quiz);
      sources.set(quiz.stimulusId, sameSource);
    }
    assert.equal(sources.size, 20);
    assert.equal(new Set(selected.map(quiz => quiz.japaneseWord)).size, 20);
    for (const sameSource of sources.values()) {
      assert.equal(sameSource.length, 5);
      assert.equal(new Set(sameSource.map(quiz => quiz.questionText)).size, 5);
    }
    if (type === 'READING') {
      assert.equal(new Set(selected.filter(quiz => quiz.japaneseWord.length >= 800).map(quiz => quiz.stimulusId)).size, 3);
    }
  }
});
