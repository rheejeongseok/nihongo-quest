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
