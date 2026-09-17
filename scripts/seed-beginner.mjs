import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { buildBeginnerQuizzes } from '../src/data/beginnerQuizzes.mjs';

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) continue;
  const key = match[1].trim();
  const value = match[2].trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = value;
}

const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.stage.findMany({
    where: { stageNumber: { in: [1, 2, 3, 4, 5] } },
    select: { id: true, stageNumber: true }
  });
  const stageIds = Object.fromEntries(stages.map(stage => [stage.stageNumber, stage.id]));
  const missingStages = [1, 2, 3, 4, 5].filter(number => !stageIds[number]);
  if (missingStages.length) {
    throw new Error(`필수 스테이지가 없습니다: ${missingStages.join(', ')}`);
  }

  const quizzes = buildBeginnerQuizzes(stageIds);
  const chunkSize = 100;
  for (let i = 0; i < quizzes.length; i += chunkSize) {
    const chunk = quizzes.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map(quiz => {
        const { id, ...data } = quiz;
        return prisma.quiz.upsert({
          where: { id },
          update: data,
          create: quiz
        });
      })
    );
  }
  console.log(`초보 스타터 문제 ${quizzes.length}개를 학습 기록 보존 방식으로 동기화했습니다.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
