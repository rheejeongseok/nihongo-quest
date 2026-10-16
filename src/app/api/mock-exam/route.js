import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import prisma from '@/lib/prisma';
import { getOrCreateRequestUser } from '@/lib/requestUser';
import { examQuestionForClient, gradeN1Exam, EXAM_PARTS } from '@/lib/examFormat.mjs';
import { getN1Exam } from '@/lib/n1ExamRepository.mjs';
import { signExam, readExam } from '@/lib/examSession.mjs';
export const dynamic = 'force-dynamic';
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request) {
  try {
    const body = await request.json();
    if (!['start', 'listening', 'finish'].includes(body.action)) return json({ error: '잘못된 요청입니다.' }, 400);
    const { user } = await getOrCreateRequestUser(request);
    const items = await getN1Exam(prisma);
    if (!items) return json({ error: 'Mock exam data is not ready.' }, 409);
    const now = Date.now();
    const clean = (answers, quizzes) => Object.fromEntries(quizzes.flatMap(quiz =>
      typeof answers?.[quiz.id] === 'string' && answers[quiz.id].length <= 500 ? [[quiz.id, answers[quiz.id]]] : []));
    if (body.action === 'start') {
      const session = { id: randomUUID(), version: 1, uid: user.id, phase: 0, started: now, expires: now + 2 * 60 * 60 * 1000, deadline: now + EXAM_PARTS[0].seconds * 1000 };
      return json({ token: signExam(session), deadline: session.deadline, questions: items.slice(0, 15).map(quiz => examQuestionForClient(quiz)) });
    }
    const session = readExam(body.token, user.id);
    if (body.action === 'listening' && session.phase === 0) {
      const first = now <= session.deadline + 15000 ? clean(body.answers, items.slice(0, 15)) : {};
      const next = { ...session, phase: 1, first, deadline: now + EXAM_PARTS[1].seconds * 1000 };
      return json({ token: signExam(next), deadline: next.deadline, questions: items.slice(15).map(quiz => examQuestionForClient(quiz)) });
    }
    if (body.action !== 'finish' || session.phase !== 1) return json({ error: '시험 순서를 확인해 주세요.' }, 400);
    const second = now <= session.deadline + 15000 ? clean(body.answers, items.slice(15)) : {};
    const results = gradeN1Exam(items, { ...session.first, ...second });
    // Stable attempt IDs make retrying a final submission idempotent.
    await prisma.$transaction(async tx => {
      await tx.quizAttempt.createMany({ data: results.map(result => ({
        id: `exam-${session.id}-${result.id}`, userId: user.id, quizId: result.id,
        isCorrect: result.correct, timeTaken: Math.min(7200, Math.max(0, Math.round((now - session.started) / 1000 / items.length)))
      })), skipDuplicates: true });
    });
    return json({ results });
  } catch (error) {
    console.error('Mock exam request failed:', error.message);
    return json({ error: '시험 요청을 처리하지 못했습니다. 다시 시도해 주세요.' }, 400);
  }
}
