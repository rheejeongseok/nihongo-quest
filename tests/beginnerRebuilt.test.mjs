import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBeginnerQuizzes } from '../src/data/beginnerRebuilt.mjs';
import { getBeginnerArena } from '../src/lib/beginnerArena.mjs';
import { evaluateQuizAnswer } from '../src/lib/quizScoring.mjs';
import { KANA_CHART } from '../src/data/beginnerKana.mjs';
const ids = { 1:'s1', 2:'s2', 3:'s3', 4:'s4', 5:'s5' };
const rows = buildBeginnerQuizzes(ids);

test('kana practice covers both complete basic alphabets with matching pronunciation aids',()=>{
  assert.equal(KANA_CHART.length,46);
  for(const script of ['hiragana','katakana']){
    assert.equal(new Set(KANA_CHART.map(k=>k[script])).size,46);
    for(const k of KANA_CHART){
      const q=rows.find(q=>q.arenaCategory==='KANA'&&q.japaneseWord===k[script]);
      assert.ok(q);assert.equal(q.correctAnswer,k.sound);
      assert.ok(q.hint.includes(k.hiragana)&&q.hint.includes(k.katakana));
    }
  }
  assert.ok(rows.find(q=>q.arenaCategory==='KANA'&&q.japaneseWord==='を').hint.includes('o로 발음'));
});
test('rebuilt beginner bank contains four arenas of 100 plus 92 kana questions', () => {
  assert.equal(rows.length,492);
  assert.equal(new Set(rows.map(q=>q.id)).size,492);
  for(const c of ['VOCAB','GRAMMAR','READING','LISTENING'])assert.equal(rows.filter(q=>q.arenaCategory===c).length,100);
  assert.ok(rows.every(q=>q.jlptLevel==='BEGINNER'&&q.status==='ACTIVE'));
});
test('correct options are unique and composition pieces reconstruct the sentence', () => {
  const unique=new Set();
  for(const q of rows){
    const key=`${q.questionText}|${q.japaneseWord}|${q.correctAnswer}`;
    assert.ok(!unique.has(key),q.id);unique.add(key);
    assert.ok(q.hint?.trim().length>0,q.id);
    assert.equal(evaluateQuizAnswer(q.correctAnswer,q),true,q.id);
    const values=JSON.parse(q.wrongAnswers);
    if(q.quizType==='ASSEMBLY'){assert.equal(values.join(''),q.correctAnswer,q.id);assert.ok(values.length>=4,q.id);}
    else{assert.equal(values.length,3,q.id);assert.equal(new Set([q.correctAnswer,...values]).size,4,q.id);assert.ok(values.every(v=>v.trim()&&!evaluateQuizAnswer(v,q)),q.id);}
  }
});
test('all four arenas draw ten distinct sources at each beginner difficulty from DB only',async()=>{
  const prisma={stage:{findMany:async()=>Object.entries(ids).map(([stageNumber,id])=>({stageNumber:Number(stageNumber),id}))},quiz:{findMany:async({where})=>rows.filter(q=>q.jlptLevel===where.jlptLevel&&q.status===where.status&&q.arenaCategory===where.arenaCategory&&q.questionText.includes(where.questionText.contains))}};
  for(const difficulty of ['EASY','MEDIUM','HARD'])for(const [number,category]of [[8,'KANA'],[1,'VOCAB'],[3,'GRAMMAR'],[4,'LISTENING'],[7,'READING']]){
    const result=await getBeginnerArena(prisma,number,category,difficulty,()=>0.4);
    assert.ok(result,`${category} ${difficulty}`);assert.equal(result.quizzes.length,10);
    assert.equal(new Set(result.quizzes.map(q=>q.stimulusId)).size,10);
    assert.ok(result.quizzes.every(q=>q.questionText.includes(`[BEGINNER-${category==='KANA'?'EASY':difficulty}]`)));
    if(category==='GRAMMAR')assert.equal(result.quizzes.filter(q=>q.quizType==='ASSEMBLY').length,4);
    if(category==='VOCAB')assert.equal(result.quizzes.filter(q=>q.itemType==='reading').length,5);
  }
  assert.equal(await getBeginnerArena({...prisma,quiz:{findMany:async()=>[]}},7,'READING'),null);
});
