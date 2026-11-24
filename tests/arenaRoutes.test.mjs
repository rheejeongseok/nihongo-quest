import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { buildBeginnerQuizzes } from '../src/data/beginnerRebuilt.mjs';
import { getBeginnerArena } from '../src/lib/beginnerArena.mjs';
import { beginnerCourseForRoute } from '../src/data/beginnerCourses.mjs';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { n1CourseForRoute } from '../src/data/n1Courses.mjs';
import { getN1Arena } from '../src/lib/n1Arena.mjs';
import { ASSEMBLY_STAR_MODE, evaluateQuizAnswer, getN1Assembly, normalizeTimeTaken } from '../src/lib/quizScoring.mjs';
import { syncLearningData } from '../src/lib/learningData.mjs';

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
    upsert: async ({ create, update }) => {
      const existing = stages.find(stage => stage.stageNumber === create.stageNumber);
      if (existing) { Object.assign(existing, update); return existing; }
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
function loadHandler(path, handler, env = {}) {
  const source = fs.readFileSync(path, 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '');
  return Function('prisma', 'NextResponse', 'buildBeginnerQuizzes', 'buildN1Quizzes', 'getN1Arena', 'getBeginnerArena', 'createHash', 'timingSafeEqual', 'syncLearningData', 'getN1Assembly', 'process',
    `${source}\nreturn ${handler};`)(prisma, NextResponse, buildBeginnerQuizzes, buildN1Quizzes, getN1Arena, getBeginnerArena, createHash, timingSafeEqual, syncLearningData, getN1Assembly,
    { env: { NODE_ENV: 'test', DATABASE_URL: 'postgresql://memory', ...env } });
}

test('실제 생성 데이터로 두 트랙의 7개 아레나 × 3개 난이도 API를 검증한다', async t => {
  const seed = loadHandler('src/app/api/seed/route.js', 'POST');
  const seeded = await seed({});
  assert.equal(seeded.status, 200);
  assert.equal(seeded.body.success, true);
  assert.equal(seeded.body.totalQuizzesSeeded, 1696);
  const second = await seed({});
  assert.equal(second.body.created, 0);
  assert.equal(second.body.updated, 0);
  assert.equal(second.body.unchanged, 1696);
  const get = loadHandler('src/app/api/stages/[stageNumber]/route.js', 'GET');
  const prepareQuiz = loadHandler('src/app/api/stages/[stageNumber]/route.js', 'prepareQuizForClient');
  await t.test('N1 배열 문항의 길이에 맞춰 빈칸 수와 앞뒤 문맥을 정한다', () => {
    const assembly = quizzes.filter(quiz => quiz.jlptLevel === 'N1' && quiz.quizType === 'ASSEMBLY');
    assert.ok(assembly.length >= 130);
    const counts = new Set();
    for (const quiz of assembly) {
      const prepared = prepareQuiz(quiz);
      const { prefix, suffix, options, starSlot } = prepared.assemblyBoard;
      const pieces = JSON.parse(quiz.wrongAnswers);
      const start = pieces.findIndex((_, index) => pieces.slice(0, index).join('') === prefix);
      const middle = pieces.slice(start, start + options.length);
      assert.ok(prefix && suffix, quiz.id);
      assert.deepEqual([...options].sort(), [...middle].sort(), quiz.id);
      assert.equal(prefix + middle.join('') + suffix, quiz.correctAnswer, quiz.id);
      assert.equal(prepared.correctAnswer, middle[starSlot], quiz.id);
      assert.ok(evaluateQuizAnswer(middle[starSlot], prepared), quiz.id);
      assert.ok(!evaluateQuizAnswer(quiz.correctAnswer, prepared), quiz.id);
      for (const option of middle.filter(option => option !== middle[starSlot])) {
        assert.ok(!evaluateQuizAnswer(option, prepared), quiz.id);
      }
      counts.add(options.length);
    }
    assert.deepEqual([...counts].sort(), [3, 4, 5, 6]);
  });
  const categories = ['CHARACTERS', 'VOCAB', 'GRAMMAR', 'LISTENING', 'WORDLE', 'ASSEMBLY', 'MOCK_EXAM'];
  for (const track of ['N1', 'BEGINNER']) {
    for (const [index, category] of categories.entries()) {
      for (const difficulty of ['EASY', 'MEDIUM', 'HARD']) {
        await t.test(`${track} ${category} ${difficulty}`, async () => {
          const stageNumber = index < 5 ? index + 1 : category === 'ASSEMBLY' ? 5 : 6;
          const query = new URLSearchParams({ jlptLevel: track, difficulty, category });
          const result = await get({ url: `http://localhost/api/stages/${stageNumber}?${query}` },
            { params: Promise.resolve({ stageNumber: String(stageNumber) }) });
          if (track === 'N1' && category === 'MOCK_EXAM') {
            assert.equal(result.status, 410);
            assert.equal(result.body.redirectTo, '/mock-exam');
            return;
          }
          assert.equal(result.status, 200, JSON.stringify(result.body));
          assert.equal(result.body.stage.difficulty, track === 'N1' ? 'N1' : difficulty);
          assert.equal(result.body.stage.category, track === 'N1' ? n1CourseForRoute(stageNumber, category).category : beginnerCourseForRoute(stageNumber, category).category);
          const selected = result.body.quizzes;
          assert.equal(selected.length, 10);
          assert.equal(new Set(selected.map(quiz => quiz.id)).size, selected.length);
          for (const quiz of selected) {
            assert.ok(quiz.correctAnswer);
            if (quiz.quizType === 'ASSEMBLY') {
              const stored = quizzes.find(item => item.id === quiz.id);
              const pieces = JSON.parse(stored.wrongAnswers);
              if (track === 'N1') {
                assert.equal(pieces.join(''), quiz.japaneseWord);
                assert.deepEqual(quiz.options, quiz.assemblyBoard.options);
                assert.ok(quiz.options.includes(quiz.correctAnswer));
              } else {
                assert.equal(pieces.join(''), quiz.correctAnswer);
                assert.deepEqual([...quiz.options].sort(), [...pieces].sort());
                assert.equal(quiz.assemblyBoard, undefined);
              }
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
      if (category === 'MOCK_EXAM') {
        assert.equal(result.status, 410);
        assert.equal(result.body.redirectTo, '/mock-exam');
        return;
      }
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
  for (const difficulty of ['EASY','MEDIUM','HARD']) await t.test(`초보 독해 ${difficulty} DB 조회`, async () => {
    const result = await get({ url: `http://localhost/api/stages/7?jlptLevel=BEGINNER&category=READING&difficulty=${difficulty}` },
      { params: Promise.resolve({ stageNumber: '7' }) });
    assert.equal(result.status,200);
    assert.equal(result.body.stage.category,'READING');
    assert.equal(result.body.quizzes.length,10);
    assert.ok(result.body.quizzes.every(q=>q.quizType==='READING' && q.questionText.includes(`[BEGINNER-${difficulty}]`)));
  });
});

test('현재 문제만 갱신하고 과거 문제 ID·기록 연결은 보존한다', async () => {
  const legacy = { id: 'legacy-history-quiz', stageId: 's1', questionText: 'old historical question' };
  quizzes.push(legacy);
  const current = quizzes.find(quiz => quiz.id === 'n1-q3-lex84-reading');
  const referencedId = current.id;
  current.wrongAnswers = '[]';
  const kept = await syncLearningData(prisma);
  assert.equal(kept.updated, 0);
  assert.equal(current.wrongAnswers, '[]');
  const result = await syncLearningData(prisma, { overwrite: true });
  assert.equal(result.updated, 1);
  assert.equal(result.created, 0);
  assert.equal(result.unchanged, 1695);
  assert.equal(current.id, referencedId);
  assert.equal(JSON.parse(current.wrongAnswers).length, 3);
  assert.equal(quizzes.find(quiz => quiz.id === legacy.id), legacy);
});

test('운영 동기화는 관리자 토큰을 요구하고 GET은 거절한다', async () => {
  const post = loadHandler('src/app/api/seed/route.js', 'POST', { NODE_ENV: 'production', SEED_ADMIN_TOKEN: 'test-admin' });
  const before = quizzes.length;
  assert.equal((await post({ headers: new Headers() })).status, 404);
  assert.equal((await post({ headers: new Headers({ authorization: 'Bearer wrong' }) })).status, 404);
  assert.equal(quizzes.length, before);
  assert.equal((await post({ headers: new Headers({ authorization: 'Bearer test-admin' }) })).status, 200);
  assert.equal((await loadHandler('src/app/api/seed/route.js', 'GET')()).status, 405);
});

test('별표 보기 제출을 서버에 저장하고 완성 문장은 별표 답안으로 처리하지 않는다', async () => {
  const quiz = {
    id: 'n1-test-assembly',
    quizType: 'ASSEMBLY',
    jlptLevel: 'N1',
    arenaCategory: 'GRAMMAR',
    stage: { difficulty: 'EASY' },
    correctAnswer: '会議の後、今日の資料を全員に配った。',
    wrongAnswers: JSON.stringify(['会議の後、', '今日の', '資料を', '全員に', '配った。'])
  };
  const attempts = [];
  const user = { id: 'user', maxStreak: 0 };
  const memory = {
    quiz: { findUnique: async () => quiz },
    $transaction: callback => callback({
      quizAttempt: { create: async ({ data }) => attempts.push(data) },
      user: { update: async () => {} },
      wrongAnswer: {
        findFirst: async () => null,
        create: async () => {}
      }
    })
  };
  const source = fs.readFileSync('src/app/api/play/submit/route.js', 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/^export /gm, '');
  const post = Function('prisma', 'NextResponse', 'getOrCreateRequestUser', 'ASSEMBLY_STAR_MODE',
    'evaluateQuizAnswer', 'getN1Assembly', 'normalizeTimeTaken', source + '\nreturn POST;')(
    memory, NextResponse, async () => ({ user }), ASSEMBLY_STAR_MODE, evaluateQuizAnswer, getN1Assembly, normalizeTimeTaken);
  const submit = (selectedAnswer, answerMode) => post({ json: async () => ({ quizId: quiz.id, selectedAnswer, answerMode }) });
  const correct = await submit('資料を', ASSEMBLY_STAR_MODE);
  assert.equal(correct.body.isCorrect, true);
  assert.equal(correct.body.correctAnswer, '資料を');
  assert.equal((await submit('今日の', ASSEMBLY_STAR_MODE)).body.isCorrect, false);
  assert.equal((await submit(quiz.correctAnswer, ASSEMBLY_STAR_MODE)).body.isCorrect, false);
  assert.deepEqual(attempts.map(attempt => attempt.isCorrect), [true, false, false]);
});
