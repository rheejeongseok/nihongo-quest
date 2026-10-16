import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateQuizAnswer,
  normalizeQuizAnswer,
  normalizeTimeTaken
} from "../src/lib/quizScoring.mjs";

test("normalizes whitespace and full-width characters", () => {
  assert.equal(normalizeQuizAnswer("  ＡＢＣ  "), "ABC");
});

test("accepts the stored correct answer", () => {
  assert.equal(evaluateQuizAnswer(" けんねん ", {
    correctAnswer: "けんねん",
    japaneseWord: "懸念"
  }), true);
});

test("accepts the Japanese word used by drawing and wordle quizzes", () => {
  assert.equal(evaluateQuizAnswer("懸念", {
    correctAnswer: "けんねん",
    japaneseWord: "懸念"
  }), true);
});

test("rejects empty and incorrect answers", () => {
  const quiz = { correctAnswer: "けんねん", japaneseWord: "懸念" };
  assert.equal(evaluateQuizAnswer("", quiz), false);
  assert.equal(evaluateQuizAnswer("かいじょ", quiz), false);
});

test("clamps invalid attempt durations", () => {
  assert.equal(normalizeTimeTaken("12.6"), 13);
  assert.equal(normalizeTimeTaken(-5), 0);
  assert.equal(normalizeTimeTaken(99999), 3600);
  assert.equal(normalizeTimeTaken("invalid"), 0);
});

test('새 N1 객관식·청해·독해는 제시문을 답으로 인정하지 않는다', () => {
  for (const quizType of ['MULTIPLE_CHOICE', 'LISTENING', 'READING']) {
    const quiz = { id: 'n1-q3-test-choice', quizType, japaneseWord: '本文', correctAnswer: '選択肢' };
    assert.equal(evaluateQuizAnswer('本文', quiz), false);
    assert.equal(evaluateQuizAnswer('選択肢', quiz), true);
  }
  assert.equal(evaluateQuizAnswer('日本', { id: 'beginner-1', quizType: 'MULTIPLE_CHOICE', japaneseWord: '日本', correctAnswer: 'にほん' }), true);
});

test('DB에서 직접 추가한 ID도 N1이면 DB의 정답만 인정한다', () => {
  const quiz = { id: 'custom-db-quiz', jlptLevel: 'N1', quizType: 'MULTIPLE_CHOICE', japaneseWord: '本文', correctAnswer: '選択肢' };
  assert.equal(evaluateQuizAnswer('本文', quiz), false);
  assert.equal(evaluateQuizAnswer('選択肢', quiz), true);
});
