import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function loadAssemblyQuizzes() {
  const source = fs.readFileSync('src/app/api/stages/[stageNumber]/route.js', 'utf8');
  const declaration = source.indexOf('const assemblyQuizzes = [');
  const arrayStart = source.indexOf('[', declaration);
  const arrayEnd = source.indexOf('\n      ];', arrayStart);
  assert.ok(declaration >= 0 && arrayEnd > arrayStart, 'N1 문장조립 문제 배열을 찾을 수 없습니다.');
  return Function(`"use strict"; return ${source.slice(arrayStart, arrayEnd + 8)}`)();
}

const quizzes = loadAssemblyQuizzes();

test('N1 문장조립 문제는 100개이며 ID가 중복되지 않는다', () => {
  assert.equal(quizzes.length, 100);
  assert.equal(new Set(quizzes.map(quiz => quiz.id)).size, 100);
});

test('N1 일본어 필드에는 한글이나 잘못 삽입된 영문이 없다', () => {
  for (const quiz of quizzes) {
    const japaneseFields = `${quiz.japaneseWord}${quiz.pronunciation}${quiz.correctAnswer}`;
    assert.doesNotMatch(japaneseFields, /[가-힣]/, quiz.id);
    assert.doesNotMatch(japaneseFields, /this/i, quiz.id);
    assert.doesNotMatch(japaneseFields, /になられ/, quiz.id);
    assert.doesNotMatch(japaneseFields, /もういちす|ぜきを|てとも|いかんん|おもうしわけ/, quiz.id);
  }
});

test('N1 문장 조각을 붙이면 원문과 일치한다', () => {
  for (const quiz of quizzes) {
    assert.equal(
      quiz.correctAnswer.replace(/\s+/g, ''),
      quiz.japaneseWord.replace(/\s+/g, ''),
      quiz.id
    );
  }
});
