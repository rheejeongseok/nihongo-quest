// 읽기 전용 점검: 미해결 오답 목록을 출력합니다(DB를 바꾸지 않음).
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wrongAnswers = await prisma.wrongAnswer.findMany({
    where: { isResolved: false },
    include: { quiz: true, user: true },
  });

  console.log("=== Active Wrong Answers ===");
  wrongAnswers.forEach((wa, idx) => {
    console.log(`[${idx}] ID: ${wa.id}, User: ${wa.user.username}, Word: ${wa.quiz.japaneseWord}, reviewCount: ${wa.reviewCount}, lastFailed: ${wa.lastFailed}`);
  });
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
