import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { resolve, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { isObsoleteN1Quiz } from '../src/lib/legacyQuizCleanup.mjs';

process.loadEnvFile('.env');
const db = new PrismaClient();
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  const result = await db.$transaction(async tx => {
    const candidates = await tx.quiz.findMany({ where: { jlptLevel: 'LEGACY', status: 'ARCHIVED' }, orderBy: { id: 'asc' } });
    const quizzes = candidates.filter(isObsoleteN1Quiz);
    const ids = quizzes.map(quiz => quiz.id);
    const related = { quizId: { in: ids } };
    const attempts = await tx.quizAttempt.findMany({ where: related, orderBy: { id: 'asc' } });
    const wrongNotes = await tx.wrongAnswer.findMany({ where: related, orderBy: { id: 'asc' } });
    const plan = { obsoleteN1: quizzes.length, linkedAttempts: attempts.length, linkedWrongNotes: wrongNotes.length };
    if (!process.argv.includes('--apply') || !ids.length) return { ...plan, applied: false };

    const preserved = await tx.quiz.findMany({ where: { id: { notIn: ids } }, orderBy: { id: 'asc' } });
    const backup = { version: 1, createdAt: new Date().toISOString(), quizzes, attempts, wrongNotes };
    const folder = resolve('.local-backups');
    mkdirSync(folder, { recursive: true });
    const path = join(folder, `legacy-n1-${Date.now()}-${randomUUID()}.json`);
    writeFileSync(path, JSON.stringify(backup, null, 2), { flag: 'wx' });
    const verified = JSON.parse(readFileSync(path, 'utf8'));
    if (digest(backup) !== digest(verified)) throw new Error('Backup verification failed; nothing deleted.');

    // The DB foreign keys cascade only the linked attempts and wrong notes backed up above.
    const deleted = await tx.quiz.deleteMany({ where: { id: { in: ids }, jlptLevel: 'LEGACY', status: 'ARCHIVED' } });
    if (deleted.count !== ids.length) throw new Error('Deletion count changed; rolling back.');
    const after = await tx.quiz.findMany({ orderBy: { id: 'asc' } });
    if (digest(preserved) !== digest(after)) throw new Error('Preserved quiz data changed; rolling back.');
    if (await tx.quizAttempt.count({ where: related }) || await tx.wrongAnswer.count({ where: related })) {
      throw new Error('Linked records remain; rolling back.');
    }
    return { ...plan, applied: true, deleted: deleted.count, remaining: after.length, backup: path, backupSha256: digest(verified) };
  }, { isolationLevel: 'Serializable', timeout: 60000 });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
