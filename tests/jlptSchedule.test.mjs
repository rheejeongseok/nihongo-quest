import test from 'node:test';
import assert from 'node:assert/strict';
import { getJlptRegistration } from '../src/data/jlptSchedule.mjs';
const exam = new Date('2026-12-06T13:10:00+09:00');
test('공식 접수 날짜를 한국 날짜 경계와 종료일 포함으로 판정한다', () => {
  for (const [date, expected] of [
    ['2026-08-31T23:59:59+09:00', '접수 예정'],
    ['2026-09-01T00:00:00+09:00', '정규 접수 기간'],
    ['2026-09-20T23:59:59+09:00', '정규 접수 기간'],
    ['2026-09-21T00:00:00+09:00', '추가 접수 예정'],
    ['2026-09-28T00:00:00+09:00', '추가 접수 기간'],
    ['2026-10-04T23:59:59+09:00', '추가 접수 기간'],
    ['2026-10-05T00:00:00+09:00', '접수 마감']
  ]) assert.equal(getJlptRegistration(exam, new Date(date)).status, expected, date);
});
test('미확인 회차의 접수 기간을 임의로 추정하지 않는다', () => {
  assert.equal(getJlptRegistration(new Date('2027-07-04T13:10:00+09:00')).source, undefined);
});
