import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
// Historical 400-question replacement. Retained for audit only; not a current seed command.
import { buildBeginnerQuizzes } from '../../src/data/beginnerRebuilt.mjs';

process.loadEnvFile('.env');
const db = new PrismaClient();
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  console.log(await db.$transaction(async tx => {
    const stages = await tx.stage.findMany();
    const ids = Object.fromEntries(stages.map(stage => [stage.stageNumber,stage.id]));
    if ([1,3,4,5].some(number=>!ids[number])) throw new Error('Required stages missing');
    const fresh = buildBeginnerQuizzes(ids);
    if (fresh.length !== 400 || new Set(fresh.map(q=>q.id)).size !== 400) throw new Error('Invalid replacement bank');
    const all = await tx.quiz.findMany({ orderBy: { id: 'asc' } });
    const freshIds = new Set(fresh.map(q=>q.id));
    const old = all.filter(q=>!freshIds.has(q.id) && (q.jlptLevel==='BEGINNER'
      || (q.jlptLevel!=='N1' && /^\[BEGINNER-/.test(q.questionText))));
    const oldIds = old.map(q=>q.id);
    const n1Before = all.filter(q=>q.jlptLevel==='N1');
    const attempts = await tx.quizAttempt.findMany({ where: { quizId: { in: oldIds } }, orderBy: { id: 'asc' } });
    const wrongNotes = await tx.wrongAnswer.findMany({ where: { quizId: { in: oldIds } }, orderBy: { id: 'asc' } });
    const existingNew = fresh.filter(q=>all.some(row=>row.id===q.id)).length;
    const plan = { oldBeginner: old.length, newBank: fresh.length, existingNew, linkedAttempts: attempts.length, linkedWrongNotes: wrongNotes.length };
    if (!process.argv.includes('--apply')) return { ...plan, applied: false };
    if (!old.length && existingNew===400) return { ...plan, applied: false, alreadyReplaced: true };
    if (existingNew) throw new Error('Partial new bank exists; inspect before replacement');
    const folder = resolve('.local-backups'); mkdirSync(folder,{recursive:true});
    const path = join(folder,`beginner-replacement-${Date.now()}-${randomUUID()}.json`);
    const backup = { version:1, createdAt:new Date().toISOString(), quizzes:old, attempts, wrongNotes };
    writeFileSync(path,JSON.stringify(backup,null,2),{flag:'wx'});
    if(digest(backup)!==digest(JSON.parse(readFileSync(path,'utf8'))))throw new Error('Backup check failed');
    // Existing beginner history refers to retired questions; it is backed up before the FK cascade.
    const deleted = await tx.quiz.deleteMany({where:{id:{in:oldIds}}});
    if(deleted.count!==old.length)throw new Error('Deletion count mismatch');
    await tx.quiz.createMany({data:fresh});
    const after=await tx.quiz.findMany({orderBy:{id:'asc'}});
    if(digest(n1Before)!==digest(after.filter(q=>q.jlptLevel==='N1')))throw new Error('N1 changed; transaction rolled back');
    const saved=after.filter(q=>q.jlptLevel==='BEGINNER');
    if(saved.length!==400)throw new Error('Beginner count mismatch');
    for(const q of fresh){const row=saved.find(r=>r.id===q.id);if(!row||Object.entries(q).some(([k,v])=>row[k]!==v))throw new Error('Saved content mismatch');}
    return {...plan,applied:true,deleted:deleted.count,inserted:400,n1Preserved:n1Before.length,backup:path,backupSha256:digest(backup)};
  }, { isolationLevel:'Serializable',timeout:60000 }));
} catch(error) {console.error(error);process.exitCode=1;}
finally {await db.$disconnect();}
