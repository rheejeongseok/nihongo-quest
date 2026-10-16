import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
const devKey = randomBytes(32).toString('hex');
function key() {
  const value = process.env.MOCK_EXAM_SECRET || process.env.DATABASE_URL;
  if (!value && process.env.NODE_ENV === 'production') throw new Error('Exam signing key unavailable');
  return `nihongo-exam-v1:${value || devKey}`;
}
export function signExam(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${createHmac('sha256', key()).update(body).digest('base64url')}`;
}
export function readExam(token, userId, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 16000) throw new Error('잘못된 시험 세션입니다.');
  const [body, signature] = token.split('.');
  const expected = createHmac('sha256', key()).update(body || '').digest('base64url');
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('시험 세션을 확인할 수 없습니다.');
  const value = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (value.uid !== userId || value.expires < now || value.version !== 1) throw new Error('시험 세션이 만료되었습니다.');
  return value;
}
