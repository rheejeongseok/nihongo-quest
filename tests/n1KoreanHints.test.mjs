import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { buildN1Exam } from '../src/data/n1Exam.mjs';
import { buildN1Expansion } from '../src/data/n1Expansion20261019.mjs';
import { buildN1ExpansionBatch2 } from '../src/data/n1ExpansionBatch2.mjs';
import { buildN1ExpansionBatch3 } from '../src/data/n1ExpansionBatch3.mjs';
import { buildN1ExpansionBatch4 } from '../src/data/n1ExpansionBatch4.mjs';

// 해설(hint)은 한국어로 보여 줍니다. 첫 줄(설명 본문)에 한글이 있어야 합니다.
test('every N1 explanation is written in Korean', () => {
  const ids = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
  const all = [...buildN1Quizzes(ids), ...buildN1Expansion(ids), ...buildN1ExpansionBatch2(ids), ...buildN1ExpansionBatch3(ids), ...buildN1ExpansionBatch4(ids), ...buildN1Exam(ids)];
  assert.ok(all.length > 1000);
  for (const quiz of all) assert.match(quiz.hint.split('\n')[0], /[가-힣]/, quiz.id);
});
