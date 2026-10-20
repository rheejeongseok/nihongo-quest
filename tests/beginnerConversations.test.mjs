import test from 'node:test';
import assert from 'node:assert/strict';
import { BEGINNER_CONVERSATIONS, pickBeginnerConversations } from '../src/data/beginnerConversations.mjs';

test('초보 회화 100개는 서로 다른 지문과 번역·학습 어휘를 갖는다', () => {
  assert.equal(BEGINNER_CONVERSATIONS.length, 100);
  assert.equal(new Set(BEGINNER_CONVERSATIONS.map(item => item.title)).size, 100);
  assert.equal(new Set(BEGINNER_CONVERSATIONS.map(item => item.description)).size, 100);
  for (const item of BEGINNER_CONVERSATIONS) {
    assert.ok(item.title && item.description && item.translation);
    assert.match(item.description, /[ぁ-んァ-ヶ一-龯]/u);
    assert.match(item.translation, /[가-힣]/u);
    assert.ok(item.n1Words.length >= 3);
    for (const word of item.n1Words) {
      assert.ok(word.word && word.reading && word.meaning);
      assert.doesNotMatch(word.reading, /[가-힣]/u);
    }
  }
});

test('각 추첨은 원본을 바꾸지 않고 실제 회화 5개를 중복 없이 뽑는다', () => {
  const original = [...BEGINNER_CONVERSATIONS];
  const seen = new Set();
  for (let seed = 1; seed <= 100; seed += 1) {
    let state = seed;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const selected = pickBeginnerConversations(random);
    assert.equal(selected.length, 5);
    assert.equal(new Set(selected).size, 5);
    selected.forEach(item => {
      assert.ok(original.includes(item));
      seen.add(item);
    });
  }
  assert.deepEqual(BEGINNER_CONVERSATIONS, original);
  assert.ok(seen.size > 90, '추첨이 앞의 다섯 회화에 고정되면 안 된다');
});
