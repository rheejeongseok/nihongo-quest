import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { syncLearningData } from '../src/lib/learningData.mjs';

if (existsSync('.env')) process.loadEnvFile('.env');
const prisma = new PrismaClient();
try {
  console.log(await syncLearningData(prisma, { level: 'BEGINNER', overwrite: process.argv.includes('--overwrite') }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
