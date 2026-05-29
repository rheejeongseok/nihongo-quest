import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// =========================================================================
// 🌸 [ULTRA PRIMITIVE MULTI-CONTAINER SELF-HEALING ENGINE]
// Vercel 서버리스 격리 구조 극복을 위해 Prisma 최초 임포트 시 완제품 DB 강제 복제
// DATABASE_URL 환경변수 파싱 오류를 방지하기 위해 항상 고정 상대경로 사용
// =========================================================================
try {
  // 항상 process.cwd() 기준 prisma 디렉토리로 고정 (절대경로 파싱 버그 원천 차단)
  const prismaDir = path.join(process.cwd(), 'prisma');
  const destDbPath = path.join(prismaDir, 'dev.db');
  const srcDbPath = path.join(prismaDir, 'template.db');

  let shouldCopy = false;

  // 1. 목적지 디비 파일이 아예 없거나
  if (!fs.existsSync(destDbPath)) {
    shouldCopy = true;
  } else {
    // 2. 테이블이 없는 빈 껍데기 파일(보통 50KB 미만)이 생성되어 있는 경우 덮어씌움
    const stats = fs.statSync(destDbPath);
    if (stats.size < 50 * 1024) {
      shouldCopy = true;
    }
  }

  if (shouldCopy && fs.existsSync(srcDbPath)) {
    console.log(`[PRISMA SELF-HEALING] 자가 복구 가동: ${srcDbPath} -> ${destDbPath}`);
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }
    fs.copyFileSync(srcDbPath, destDbPath);
    console.log("[PRISMA SELF-HEALING] 완제품 SQLite 템플릿 복제 완수!");
  }
} catch (err) {
  console.error("[PRISMA SELF-HEALING] 자가 복구 엔진 오작동:", err);
}

export default prisma;
