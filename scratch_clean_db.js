const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 오답노트 데이터베이스 일괄 클리닝 작업을 시작합니다...");
  
  // 이미 복습을 1회 이상 시도하여 reviewCount가 2 이상인 오답 레코드를 즉시 해결 완료(isResolved = true)로 업데이트합니다.
  const result = await prisma.wrongAnswer.updateMany({
    where: {
      isResolved: false,
      reviewCount: {
        gt: 1
      }
    },
    data: {
      isResolved: true
    }
  });

  console.log(`✨ 클리닝 완료! 기존에 복습을 완료했으나 화면에 버티고 있던 오답 레코드 총 ${result.count}개가 완벽하게 해결 완료(isResolved: true) 처리되어 소탕되었습니다!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("❌ 클리닝 작업 중 에러 발생:", err);
  process.exit(1);
});
