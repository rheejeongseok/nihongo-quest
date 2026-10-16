import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildN1Exam, examQuestionForClient, gradeN1Exam, EXAM_PARTS } from '../src/data/n1Exam.mjs';
import { signExam, readExam } from '../src/lib/examSession.mjs';
import { getN1Exam } from '../src/lib/n1ExamRepository.mjs';
test('실제 모의고사 API가 두 파트를 잠그고 정답은 종료 후 공개하며 DB 재전송은 중복되지 않는다', async () => {
  const stages = [1, 2, 3, 4, 5].map(number => ({ stageNumber: number, id: `s${number}` }));
  const quizzes = new Map(), attempts = new Map();
  const ids = Object.fromEntries(stages.map(stage => [stage.stageNumber, stage.id]));
  buildN1Exam(ids).forEach(({ domain, ...quiz }, index) => quizzes.set(quiz.id, {
    ...quiz, jlptLevel: 'N1', arenaCategory: 'MOCK_EXAM', status: 'ACTIVE', examOrder: index + 1, examDomain: domain
  }));
  const first = quizzes.values().next().value;
  first.questionText = 'DB exam question';
  first.correctAnswer = 'DB exam answer';
  const tx = { quizAttempt: { createMany: async ({ data }) => {
    for (const attempt of data) if (!attempts.has(attempt.id)) attempts.set(attempt.id, attempt);
  } } };
  const prisma = {
    stage: { findMany: async () => stages },
    quiz: {
      findMany: async ({ where }) => [...quizzes.values()].filter(quiz => Object.entries(where).every(([field, value]) => quiz[field] === value)).sort((a,b) => a.examOrder - b.examOrder),
      upsert: async () => { throw new Error('Exam must read DB without writing quiz content'); }
    },
    $transaction: async operation => typeof operation === 'function' ? operation(tx) : Promise.all(operation)
  };
  const source = fs.readFileSync('src/app/api/mock-exam/route.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const handler = Function('NextResponse', 'randomUUID', 'prisma', 'getOrCreateRequestUser', 'getN1Exam', 'examQuestionForClient', 'gradeN1Exam', 'EXAM_PARTS', 'signExam', 'readExam',
    `${source}\nreturn POST;`)(
    { json: (body, options) => ({ body, status: options.status }) }, () => 'attempt-1', prisma,
    async () => ({ user: { id: 'u1' } }), getN1Exam, examQuestionForClient, gradeN1Exam, EXAM_PARTS, signExam, readExam);
  const post = data => handler({ json: async () => data });
  const started = await post({ action: 'start' });
  assert.equal(started.status, 200);
  assert.equal(started.body.questions.length, 15);
  assert.equal(started.body.questions[0].questionText, 'DB exam question');
  assert.ok(started.body.questions[0].options.includes('DB exam answer'));
  assert.equal(quizzes.size, 20);
  assert.ok(started.body.questions.every(quiz => !('correctAnswer' in quiz) && !('hint' in quiz)));
  const outOfOrder = await post({ action: 'finish', token: started.body.token });
  assert.equal(outOfOrder.status, 400);
  const answers = Object.fromEntries([...quizzes.values()].map(quiz => [quiz.id, quiz.correctAnswer]));
  const second = await post({ action: 'listening', token: started.body.token, answers });
  assert.equal(second.status, 200);
  assert.equal(second.body.questions.length, 5);
  assert.ok(second.body.questions.every(quiz => quiz.audioText && !('correctAnswer' in quiz)));
  const finished = await post({ action: 'finish', token: second.body.token, answers });
  assert.equal(finished.body.results.length, 20);
  assert.equal(finished.body.results.filter(result => result.correct).length, 20);
  assert.equal(attempts.size, 20);
  await post({ action: 'finish', token: second.body.token, answers });
  assert.equal(attempts.size, 20);
  first.status = 'ARCHIVED';
  assert.equal((await post({ action: 'start' })).status, 409);
});
