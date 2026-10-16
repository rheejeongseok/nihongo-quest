import test from 'node:test';
import assert from 'node:assert/strict';
import { isObsoleteN1Quiz } from '../src/lib/legacyQuizCleanup.mjs';

const base = { id: 'old-quiz', jlptLevel: 'LEGACY', status: 'ARCHIVED', questionText: '[N1-HARD] old question' };
test('only explicitly identified archived legacy N1 questions can be removed', () => {
  assert.equal(isObsoleteN1Quiz(base), true);
  assert.equal(isObsoleteN1Quiz({ ...base, questionText: '[NHK시사-N1-EASY] question' }), true);
  for (const change of [
    { jlptLevel: 'N1' }, { jlptLevel: 'BEGINNER' }, { status: 'ACTIVE' },
    { questionText: '[BEGINNER-EASY] question' }, { questionText: '[N1] [BEGINNER] question' },
    { id: 'beginner-old' }, { questionText: 'unclassified question' }
  ]) assert.equal(isObsoleteN1Quiz({ ...base, ...change }), false, JSON.stringify(change));
});
