import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { buildBeginnerQuizzes } from '../src/data/beginnerQuizzes.mjs';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { n1CourseForRoute } from '../src/data/n1Courses.mjs';
import { getN1Arena } from '../src/lib/n1Arena.mjs';

// 실제 시드와 GET 핸들러를 실행하되 DB만 메모리로 대체한다.
const stages = [];
const quizzes = [];
const matches = (quiz, where = {}) => Object.entries(where).every(([key, value]) => {
  if (key === 'OR') return value.some(condition => matches(quiz, condition));
  if (key === 'stage') return Object.entries(value).every(([field, expected]) =>
    stages.find(stage => stage.id === quiz.stageId)?.[field] === expected);
  if (value && typeof value === 'object') {
    if ('contains' in value) return quiz[key]?.includes(value.contains);
    if ('in' in value) return value.in.includes(quiz[key]);
  }
  return quiz[key] === value;
});
const prisma = {
  user: { upsert: async ({ create }) => create },
  stage: {
    findMany: async ({ where }) => stages.filter(stage => where.stageNumber.in.includes(stage.stageNumber)),
    upsert: async ({ create }) => {
      const stage = { ...create, id: `s${create.stageNumber}` };
      stages.push(stage);
      return stage;
    },
    findUnique: async ({ where }) => stages.find(stage => stage.stageNumber === where.stageNumber)
  },
  quiz: {
    findMany: async ({ where, skip = 0, take } = {}) => {
      const pool = quizzes.filter(quiz => matches(quiz, where));
      return pool.slice(skip, take === undefined ? undefined : skip + take);
    },
    count: async ({ where }) => quizzes.filter(quiz => matches(quiz, where)).length,
    createMany: async ({ data }) => quizzes.push(...data),
    upsert: async ({ create, update, where }) => {
      const existing = quizzes.find(quiz => quiz.id === where.id);
      if (existing) Object.assign(existing, update);
      else quizzes.push(create);
      return existing || create;
    }
  },
  $transaction: async operations => Promise.all(operations)
};
const NextResponse = { json: (body, options) => ({ body, status: options?.status || 200 }) };
function loadHandler(path, handler) {
  const source = fs.readFileSync(path, 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '');
  return Function('prisma', 'NextResponse', 'buildBeginnerQuizzes', 'buildN1Quizzes', 'getN1Arena', 'createHash', 'timingSafeEqual', 'process',
    `${source}\nreturn ${handler};`)(prisma, NextResponse, buildBeginnerQuizzes, buildN1Quizzes, getN1Arena, createHash, timingSafeEqual,
    { env: { NODE_ENV: 'test', DATABASE_URL: 'postgresql://memory' } });
}

test('실제 생성 데이터로 두 트랙의 7개 아레나 × 3개 난이도 API를 검증한다', async t => {
  const seed = loadHandler('src/app/api/seed/route.js', 'POST');
  const seeded = await seed({});
  assert.equal(seeded.status, 200);
  assert.equal(seeded.body.success, true);
  const get = loadHandler('src/app/api/stages/[stageNumber]/route.js', 'GET');
  const categories = ['CHARACTERS', 'VOCAB', 'GRAMMAR', 'LISTENING', 'WORDLE', 'ASSEMBLY', 'MOCK_EXAM'];
  for (const track of ['N1', 'BEGINNER']) {
    for (const [index, category] of categories.entries()) {
      for (const difficulty of ['EASY', 'MEDIUM', 'HARD']) {
        await t.test(`${track} ${category} ${difficulty}`, async () => {
          const stageNumber = index < 5 ? index + 1 : category === 'ASSEMBLY' ? 5 : 6;
          const query = new URLSearchParams({ jlptLevel: track, difficulty, category });
          const result = await get({ url: `http://localhost/api/stages/${stageNumber}?${query}` },
            { params: Promise.resolve({ stageNumber: String(stageNumber) }) });
          assert.equal(result.status, 200, JSON.stringify(result.body));
          assert.equal(result.body.stage.difficulty, track === 'N1' ? 'N1' : difficulty);
          assert.equal(result.body.stage.category, track === 'N1' ? n1CourseForRoute(stageNumber, category).category : category);
          const selected = result.body.quizzes;
          assert.equal(selected.length, category === 'MOCK_EXAM' && track === 'N1' ? 15 : 10);
          assert.equal(new Set(selected.map(quiz => quiz.id)).size, selected.length);
          for (const quiz of selected) {
            assert.ok(quiz.correctAnswer);
            if (quiz.quizType === 'ASSEMBLY') {
              const stored = quizzes.find(item => item.id === quiz.id);
              const pieces = JSON.parse(stored.wrongAnswers);
              assert.equal(pieces.join(''), quiz.correctAnswer);
              assert.deepEqual([...quiz.options].sort(), [...pieces].sort());
            }
            if (track === 'BEGINNER') {
              assert.ok(quiz.questionText.includes(`[${track}-${difficulty}]`), quiz.questionText);
            } else {
              assert.doesNotMatch(quiz.questionText, /BEGINNER/);
            }
            if (quiz.quizType === 'MULTIPLE_CHOICE' || quiz.quizType === 'LISTENING') {
              assert.ok(quiz.options.includes(quiz.correctAnswer));
            }
          }
        });
      }
    }
  }
  for (const [index, category] of categories.entries()) {
    await t.test(`N1 ${category} 난이도 없는 URL`, async () => {
      const number = index < 5 ? index + 1 : category === 'ASSEMBLY' ? 5 : 6;
      const result = await get({ url: `http://localhost/api/stages/${number}?jlptLevel=N1&category=${category}` },
        { params: Promise.resolve({ stageNumber: String(number) }) });
      assert.equal(result.status, 200);
      assert.equal(result.body.stage.difficulty, 'N1');
      assert.equal(result.body.stage.category, n1CourseForRoute(number, category).category);
    });
  }
  await t.test('N1 독해는 별도 DB Stage 생성 없이 지문과 보기를 반환한다', async () => {
    const result = await get({ url: 'http://localhost/api/stages/7?jlptLevel=N1&category=READING' },
      { params: Promise.resolve({ stageNumber: '7' }) });
    assert.equal(result.status, 200);
    assert.equal(result.body.stage.category, 'READING');
    assert.equal(result.body.quizzes.length, 10);
    assert.ok(result.body.quizzes.every(quiz => quiz.quizType === 'READING' && quiz.japaneseWord.length >= 150 && quiz.options.length === 4));
  });
});
