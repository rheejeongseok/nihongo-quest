import test from 'node:test';
import assert from 'node:assert/strict';
import {buildN1ExpansionBatch2} from '../src/data/n1ExpansionBatch2.mjs';
import {buildN1Expansion} from '../src/data/n1Expansion20261019.mjs';
import {buildN1Quizzes} from '../src/data/n1QualityQuizzes.mjs';
import {getN1Arena} from '../src/lib/n1Arena.mjs';
import {evaluateQuizAnswer} from '../src/lib/quizScoring.mjs';
const ids={1:'s1',2:'s2',3:'s3',4:'s4',5:'s5'};
const rows=buildN1ExpansionBatch2(ids);
const identity=q=>JSON.stringify([q.quizType,q.questionText.replace(/\[[^\]]*\]/g,'').replace(/\s+/g,' ').trim(),q.japaneseWord,q.correctAnswer]);
test('second expansion adds 100 per arena with no reused IDs or question content',()=>{
 assert.equal(rows.length,400);assert.equal(new Set(rows.map(q=>q.id)).size,400);
 const old=[...buildN1Quizzes(ids),...buildN1Expansion(ids)];
 const oldIds=new Set(old.map(q=>q.id)),oldContent=new Set(old.map(identity));
 assert.equal(new Set(rows.map(identity)).size,400);
 for(const q of rows){assert.ok(!oldIds.has(q.id));assert.ok(!oldContent.has(identity(q)),q.id);assert.equal(q.jlptLevel,'N1');assert.equal(q.status,'ACTIVE');assert.equal(q.examOrder,null);}
 for(const c of ['VOCAB','GRAMMAR','READING','LISTENING'])assert.equal(rows.filter(q=>q.arenaCategory===c).length,100);
});
test('every distractor is unique, grading is strict, and every assembly reconstructs its source',()=>{
 for(const q of rows){
  assert.ok(q.hint.length>10,q.id);assert.ok(q.stageId&&q.stimulusId&&q.correctAnswer);
  assert.ok(evaluateQuizAnswer(q.correctAnswer,q),q.id);
  const wrong=JSON.parse(q.wrongAnswers);
  if(q.quizType==='ASSEMBLY'){assert.ok(wrong.length>=5,q.id);assert.equal(wrong.join(''),q.correctAnswer,q.id);}
  else{assert.equal(wrong.length,3,q.id);assert.equal(new Set([q.correctAnswer,...wrong]).size,4,q.id);for(const w of wrong)assert.ok(w.trim()&&!evaluateQuizAnswer(w,q),q.id);}
 }
});
test('types and stimuli support the existing runtime quotas without repeating a source',async()=>{
 for(const t of ['reading','context','paraphrase','usage'])assert.equal(rows.filter(q=>q.arenaCategory==='VOCAB'&&q.itemType===t).length,25);
 for(const c of ['READING','LISTENING']){
  const qs=rows.filter(q=>q.arenaCategory===c);
  assert.equal(new Set(qs.map(q=>q.stimulusId)).size,20);
  assert.equal(new Set(qs.map(q=>q.japaneseWord)).size,20);
  assert.ok(qs.every(q=>q.japaneseWord.length>=200));
  for(const source of new Set(qs.map(q=>q.stimulusId)))assert.equal(qs.filter(q=>q.stimulusId===source).length,5);
 }
 assert.ok(new Set(rows.filter(q=>q.arenaCategory==='READING'&&q.japaneseWord.length>=850).map(q=>q.stimulusId)).size>=3);
 const prisma={stage:{findMany:async()=>Object.entries(ids).map(([stageNumber,id])=>({stageNumber:Number(stageNumber),id}))},quiz:{findMany:async({where})=>rows.filter(q=>q.arenaCategory===where.arenaCategory&&q.jlptLevel===where.jlptLevel&&q.status===where.status)}};
 for(let seed=1;seed<=30;seed++)for(const [n,c]of [[1,'VOCAB'],[3,'GRAMMAR'],[4,'LISTENING'],[7,'READING']]){
  let x=seed;const random=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};
  const arena=await getN1Arena(prisma,n,c,random);
  assert.equal(arena.quizzes.length,10);assert.equal(new Set(arena.quizzes.map(q=>q.stimulusId)).size,10);
  if(c==='GRAMMAR')assert.equal(arena.quizzes.filter(q=>q.quizType==='ASSEMBLY').length,4);
  if(c==='VOCAB')for(const [type,count] of [['reading',3],['context',3],['paraphrase',2],['usage',2]])assert.equal(arena.quizzes.filter(q=>q.itemType===type).length,count);
 }
});
