import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { buildN1Expansion } from '../src/data/n1Expansion20261019.mjs';
import { buildN1ExpansionBatch2 } from '../src/data/n1ExpansionBatch2.mjs';
import { buildN1ExpansionBatch3 } from '../src/data/n1ExpansionBatch3.mjs';
import { buildN1ExpansionBatch4 } from '../src/data/n1ExpansionBatch4.mjs';
import { buildN1Exam } from '../src/data/n1Exam.mjs';
import { getN1Assembly, normalizeQuizAnswer } from '../src/lib/quizScoring.mjs';

const ids = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
const before = [...buildN1Quizzes(ids), ...buildN1Expansion(ids), ...buildN1ExpansionBatch2(ids), ...buildN1ExpansionBatch3(ids), ...buildN1Exam(ids)];
const batch = buildN1ExpansionBatch4(ids);
const categories = ['VOCAB', 'GRAMMAR', 'READING', 'LISTENING'];
const content = quiz => JSON.stringify([
  quiz.quizType, quiz.questionText.replace(/^\[N1\]\s*/u, '').replace(/\s+/gu, ' ').normalize('NFKC'),
  quiz.japaneseWord.normalize('NFKC'), quiz.correctAnswer.normalize('NFKC')
]);

test('네 아레나에 중복 없는 새 문항 100개씩을 등록할 수 있다', () => {
  assert.equal(batch.length, 400);
  assert.equal(new Set(batch.map(q => q.id)).size, 400);
  assert.equal(new Set(batch.map(content)).size, 400);
  const existingIds = new Set(before.map(q => q.id));
  const existingContent = new Set(before.map(content));
  const knownWords = new Set(before.filter(q => q.quizType === 'WORDLE' || q.id.endsWith('-reading')).map(q => q.japaneseWord));
  const knownSources = new Set(before.filter(q => ['READING', 'LISTENING'].includes(q.quizType)).map(q => q.japaneseWord));
  for (const category of categories) assert.equal(batch.filter(q=>q.arenaCategory===category).length, 100);
  for (const quiz of batch) {
    assert.ok(!existingIds.has(quiz.id), quiz.id);
    assert.ok(!existingContent.has(content(quiz)), quiz.id);
    assert.ok(quiz.stageId && quiz.stimulusId && quiz.status === 'ACTIVE', quiz.id);
    assert.match(quiz.hint.split('\n')[0], /[가-힣]/u, quiz.id);
    if (quiz.itemType === 'reading') assert.ok(!knownWords.has(quiz.japaneseWord), quiz.id);
    if (['READING','LISTENING'].includes(quiz.quizType)) assert.ok(!knownSources.has(quiz.japaneseWord), quiz.id);
  }
});

test('★ 정답과 일반 보기의 구성이 유효하고 독해·청해의 소재와 유형이 다양하다', () => {
  const blanks = new Set();
  for (const quiz of batch) {
    const pieces = JSON.parse(quiz.wrongAnswers);
    if (quiz.quizType === 'ASSEMBLY') {
      const board = getN1Assembly(quiz);
      assert.ok(board?.prefix && board.suffix, quiz.id);
      assert.equal(board.prefix + board.options.join('') + board.suffix, quiz.correctAnswer);
      assert.equal(new Set(board.options.map(normalizeQuizAnswer)).size, board.options.length, quiz.id);
      assert.ok(board.options[board.starSlot], quiz.id);
      blanks.add(board.options.length);
    } else {
      assert.ok(pieces.every(piece => piece.trim()), quiz.id);
      assert.equal(pieces.length, 3, quiz.id);
      assert.equal(new Set([quiz.correctAnswer, ...pieces].map(normalizeQuizAnswer)).size, 4, quiz.id);
      if (quiz.id.endsWith('-choice')) assert.ok(quiz.questionText.includes('（　）'), quiz.id);
    }
  }
  assert.deepEqual([...blanks].sort(), [3, 4]);
  assert.equal(batch.filter(q => q.quizType === 'ASSEMBLY').length, 50);
  const reading = new Set(batch.filter(q => q.quizType === 'READING').map(q => q.japaneseWord));
  assert.equal(reading.size, 20);
  assert.equal([...reading].filter(text => text.length >= 680 && text.includes('\n\n')).length, 3);
  const listening = batch.filter(q => q.quizType === 'LISTENING');
  assert.equal(new Set(listening.map(q => q.japaneseWord)).size, 50);
  assert.equal(listening.filter(q => q.itemType === 'reply').length, 40);
  assert.ok(listening.every(q => q.hint.endsWith(q.japaneseWord)));
});

test('기존 ★의 위치를 바꿀 수 있었던 수식·인용 조각을 고정한다', () => {
  const quiz = id => before.find(q => q.id === 'n1-20261124-b3-grammar-form' + id + '-assembly');
  const placement = getN1Assembly(quiz(10));
  assert.ok(placement.prefix.endsWith('緊急時に'));
  const location = getN1Assembly(quiz(19));
  assert.equal(location.prefix, '窓口では、');
  assert.ok(location.suffix.startsWith('と告げられた'));
  assert.ok(getN1Assembly(quiz(50)).prefix.endsWith('開けた'));
});
