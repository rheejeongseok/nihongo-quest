import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
// Historical kana addition and grammar correction. Retained for audit only.
import { buildBeginnerQuizzes } from '../../src/data/beginnerRebuilt.mjs';
import { getBeginnerArena } from '../../src/lib/beginnerArena.mjs';
process.loadEnvFile('.env');
const db=new PrismaClient();
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  console.log(await db.$transaction(async tx=>{
    const stages=await tx.stage.findMany();
    const ids=Object.fromEntries(stages.map(s=>[s.stageNumber,s.id]));
    const fresh=buildBeginnerQuizzes(ids);
    const before=await tx.quiz.findMany({orderBy:{id:'asc'}});
    const byId=new Map(before.map(q=>[q.id,q]));
    const changes=fresh.filter(q=>!byId.has(q.id)||Object.entries(q).some(([k,v])=>byId.get(q.id)[k]!==v));
    if(changes.some(q=>q.arenaCategory!=='KANA'&&!/^beginner-20261019-grammar-hard(10|14|15|16)-/.test(q.id)))throw Error('Unexpected change outside reviewed scope');
    const plan={inserted:changes.filter(q=>!byId.has(q.id)).length,updated:changes.filter(q=>byId.has(q.id)).length};
    if(!process.argv.includes('--apply'))return {...plan,applied:false};
    mkdirSync('.local-backups',{recursive:true});
    const backup=`.local-backups/beginner-kana-${Date.now()}.json`;
    const originals=changes.map(q=>byId.get(q.id)).filter(Boolean);
    writeFileSync(backup,JSON.stringify(originals,null,2),{flag:'wx'});
    if(hash(originals)!==hash(JSON.parse(readFileSync(backup,'utf8'))))throw Error('Backup mismatch');
    for(const q of changes){const {id,...data}=q;await tx.quiz.upsert({where:{id},update:data,create:q});}
    const after=await tx.quiz.findMany({orderBy:{id:'asc'}});
    if(hash(before.filter(q=>q.jlptLevel!=='BEGINNER'))!==hash(after.filter(q=>q.jlptLevel!=='BEGINNER')))throw Error('Other tracks changed');
    for(const q of fresh){const saved=after.find(row=>row.id===q.id);if(!saved||Object.entries(q).some(([k,v])=>saved[k]!==v))throw Error('Saved bank mismatch');}
    for(const [number,category] of [[8,'KANA'],[1,'VOCAB'],[3,'GRAMMAR'],[4,'LISTENING'],[7,'READING']])for(const difficulty of ['EASY','MEDIUM','HARD']){
      const result=await getBeginnerArena(tx,number,category,difficulty);
      if(result?.quizzes.length!==10||new Set(result.quizzes.map(q=>q.stimulusId)).size!==10)throw Error('Arena retrieval failed');
    }
    return {...plan,applied:true,backup,beginnerTotal:after.filter(q=>q.jlptLevel==='BEGINNER').length,otherRowsPreserved:before.filter(q=>q.jlptLevel!=='BEGINNER').length};
  },{timeout:60000,isolationLevel:'Serializable'}));
}finally{await db.$disconnect();}
