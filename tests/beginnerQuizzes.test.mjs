import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBeginnerQuizzes } from '../src/data/beginnerQuizzes.mjs';

const stageIds = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
const quizzes = buildBeginnerQuizzes(stageIds);
const difficulties = ['EASY', 'MEDIUM', 'HARD'];

test('초보 문제는 고유 ID를 가진 278문항이다', () => {
  assert.equal(quizzes.length, 278);
  assert.equal(new Set(quizzes.map(quiz => quiz.id)).size, quizzes.length);
});

test('각 난이도와 아레나에 10문항 이상 있다', () => {
  const arenaFilters = [
    quiz => quiz.stageId === 's1',
    quiz => quiz.stageId === 's2',
    quiz => quiz.stageId === 's3',
    quiz => quiz.stageId === 's4',
    quiz => quiz.stageId === 's5' && quiz.quizType === 'WORDLE',
    quiz => quiz.stageId === 's5' && quiz.quizType === 'ASSEMBLY'
  ];

  for (const difficulty of difficulties) {
    const tag = `[BEGINNER-${difficulty}]`;
    for (const filterArena of arenaFilters) {
      const count = quizzes.filter(quiz => filterArena(quiz) && quiz.questionText.includes(tag)).length;
      assert.ok(count >= 10, `${tag} 아레나 문제 수: ${count}`);
    }
  }
});

test('객관식 보기는 중복되지 않고 문장 조각은 정답으로 결합된다', () => {
  for (const quiz of quizzes) {
    const values = JSON.parse(quiz.wrongAnswers);
    if (quiz.quizType === 'ASSEMBLY') {
      assert.equal(values.join(''), quiz.correctAnswer, quiz.id);
      continue;
    }
    if (quiz.quizType === 'WORDLE') continue;

    assert.equal(new Set(values).size, values.length, quiz.id);
    assert.equal(values.includes(quiz.correctAnswer), false, quiz.id);
  }
});
