import {PrismaClient} from '@prisma/client';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {buildN1ExpansionBatch2} from '../src/data/n1ExpansionBatch2.mjs';
import {getN1Arena} from '../src/lib/n1Arena.mjs';
process.loadEnvFile('.env');
const db=new PrismaClient();
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const content=q=>JSON.stringify([q.quizType,q.questionText.replace(/\[[^\]]*\]/g,'').replace(/\s+/g,' ').trim(),q.japaneseWord,q.correctAnswer]);
try{
 const result=await db.$transaction(async tx=>{
  const stages=await tx.stage.findMany();
  const ids=Object.fromEntries(stages.map(s=>[s.stageNumber,s.id]));
  if([1,2,3,4,5].some(n=>!ids[n]))throw Error('Missing stages');
  const rows=buildN1ExpansionBatch2(ids);
  if(rows.length!==400||new Set(rows.map(q=>q.id)).size!==400)throw Error('Invalid bank');
  for(const c of ['VOCAB','GRAMMAR','READING','LISTENING'])if(rows.filter(q=>q.arenaCategory===c).length!==100)throw Error('Invalid arena count');
  const before=await tx.quiz.findMany({orderBy:{id:'asc'}});
  const byId=new Map(before.map(q=>[q.id,q]));
  for(const row of rows){const saved=byId.get(row.id);if(saved&&Object.entries(row).some(([k,v])=>saved[k]!==v))throw Error(`Existing batch edited; refusing overwrite: ${row.id}`);}
  const existingContent=new Set(before.map(content));
  const missing=rows.filter(q=>!byId.has(q.id));
  if(missing.some(q=>existingContent.has(content(q))))throw Error('Question content already exists');
  const plan={planned:rows.length,existing:rows.length-missing.length,toInsert:missing.length,existingRows:before.length};
  if(!process.argv.includes('--apply'))return {...plan,applied:false};
  if(missing.length)await tx.quiz.createMany({data:missing});
  const after=await tx.quiz.findMany({orderBy:{id:'asc'}});
  const prior=after.filter(q=>byId.has(q.id));
  if(hash(before)!==hash(prior))throw Error('Existing rows changed; rolling back');
  for(const q of rows){const saved=after.find(r=>r.id===q.id);if(!saved||Object.entries(q).some(([k,v])=>saved[k]!==v))throw Error('Saved content mismatch');}
  for(const [n,c]of [[1,'VOCAB'],[3,'GRAMMAR'],[4,'LISTENING'],[7,'READING']]){
   const arena=await getN1Arena(tx,n,c);
   if(arena?.quizzes.length!==10||new Set(arena.quizzes.map(q=>q.stimulusId)).size!==10)throw Error('Arena sampling failed');
  }
  const counts={};
  for(const q of after.filter(q=>q.jlptLevel==='N1'&&q.status==='ACTIVE'))counts[q.arenaCategory]=(counts[q.arenaCategory]||0)+1;
  return {...plan,applied:true,inserted:missing.length,preservedExisting:before.length,total:after.length,n1Counts:counts,existingDigest:hash(before),newBankDigest:hash(rows)};
 },{isolationLevel:'Serializable',timeout:60000});
 if(result.applied){mkdirSync('.local-backups',{recursive:true});const path=`.local-backups/n1-batch2-import-${Date.now()}.json`;writeFileSync(path,JSON.stringify(result,null,2),{flag:'wx'});result.report=path;}
 console.log(result);
}finally{await db.$disconnect();}
