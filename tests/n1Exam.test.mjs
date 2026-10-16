import test from 'node:test';
import assert from 'node:assert/strict';
import { buildN1Exam, examQuestionForClient, gradeN1Exam, EXAM_PARTS } from '../src/data/n1Exam.mjs';
import { signExam, readExam } from '../src/lib/examSession.mjs';
const items = buildN1Exam({ 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' });
test('味見試験は言語知識9・読解6・聴解5の順で、20分と10分に分かれる', () => {
  assert.equal(items.length, 20);
  assert.equal(new Set(items.map(item => item.id)).size, 20);
  assert.deepEqual(items.map(item => item.domain), [...Array(9).fill('언어지식'), ...Array(6).fill('독해'), ...Array(5).fill('청해')]);
  assert.deepEqual(EXAM_PARTS.map(part => [part.seconds, part.count]), [[1200, 15], [600, 5]]);
  assert.ok(items.some(item => item.domain === '독해' && item.japaneseWord.length >= 900));
  for (const type of ['漢字読み', '文脈規定', '言い換え', '用法', '文法形式', '文の組み立て', '文章の文法', '統合理解', '情報検索', '即時応答']) {
    assert.ok(items.some(item => item.questionText.includes(`【${type}】`)), type);
  }
});
test('出題レスポンスには正解・解説が含まれず、全設問の四択は重複しない', () => {
  for (const item of items) {
    const client = examQuestionForClient(item, () => 0.5);
    assert.equal(client.options.length, 4);
    assert.equal(new Set(client.options).size, 4);
    assert.ok(client.options.includes(item.correctAnswer));
    assert.equal('correctAnswer' in client, false);
    assert.equal('hint' in client, false);
    assert.ok(item.hint.length > 20);
    if (item.quizType === 'LISTENING') assert.ok(client.audioText && !client.passage);
  }
});
test('採点は未回答を誤答とし、クライアントの得点フラグを使わない', () => {
  const answers = Object.fromEntries(items.map(item => [item.id, item.correctAnswer]));
  assert.equal(gradeN1Exam(items, answers).filter(item => item.correct).length, 20);
  delete answers[items[0].id];
  answers[items[1].id] = '不正解';
  assert.equal(gradeN1Exam(items, answers).filter(item => item.correct).length, 18);
  assert.ok(gradeN1Exam(items, answers).every(item => item.explanation && item.answer));
});
test('署名セッションは改ざん・別ユーザー・期限切れを拒否する', () => {
  const token = signExam({ version: 1, uid: 'u1', phase: 0, expires: 2000 });
  assert.equal(readExam(token, 'u1', 1000).phase, 0);
  assert.throws(() => readExam(token, 'u2', 1000));
  assert.throws(() => readExam(token, 'u1', 3000));
  assert.throws(() => readExam(token.replace(/^./, token[0] === 'a' ? 'b' : 'a'), 'u1', 1000));
});
