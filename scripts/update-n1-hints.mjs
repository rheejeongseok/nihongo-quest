// N1 문제 해설(hint)만 코드의 최신 내용(한국어)으로 바꿉니다. 문제·정답·공개 상태 등 다른 칸은 건드리지 않습니다.
// 기본은 미리보기(바뀔 개수만 출력)이고, --apply를 붙여야 실제로 저장합니다.
//   node scripts/update-n1-hints.mjs          → 미리보기
//   node scripts/update-n1-hints.mjs --apply  → 저장
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { buildN1Exam } from '../src/data/n1Exam.mjs';
import { buildN1Expansion } from '../src/data/n1Expansion20261019.mjs';
import { buildN1ExpansionBatch2 } from '../src/data/n1ExpansionBatch2.mjs';
import { buildN1ExpansionBatch3 } from '../src/data/n1ExpansionBatch3.mjs';
import { buildN1ExpansionBatch4 } from '../src/data/n1ExpansionBatch4.mjs';

if (existsSync('.env')) process.loadEnvFile('.env');
const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();
try {
  const ids = Object.fromEntries((await prisma.stage.findMany()).map(stage => [stage.stageNumber, stage.id]));
  const quizzes = [...buildN1Quizzes(ids), ...buildN1Expansion(ids), ...buildN1ExpansionBatch2(ids), ...buildN1ExpansionBatch3(ids), ...buildN1ExpansionBatch4(ids), ...buildN1Exam(ids)];
  const hints = new Map(quizzes.map(quiz => [quiz.id, quiz.hint]));
  const existing = await prisma.quiz.findMany({ where: { id: { in: [...hints.keys()] } }, select: { id: true, hint: true } });
  const changed = existing.filter(quiz => quiz.hint !== hints.get(quiz.id));
  console.log({ inCode: hints.size, inDb: existing.length, toUpdate: changed.length, mode: apply ? 'apply' : 'preview' });
  if (apply) {
    for (let index = 0; index < changed.length; index += 100) {
      await prisma.$transaction(changed.slice(index, index + 100).map(({ id }) => prisma.quiz.update({ where: { id }, data: { hint: hints.get(id) } })));
    }
    console.log(`해설 ${changed.length}개를 바꿨습니다.`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
