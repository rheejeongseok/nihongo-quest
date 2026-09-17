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
