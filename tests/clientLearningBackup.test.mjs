import test from 'node:test';
import assert from 'node:assert/strict';
import { getSyncHeaders } from '../src/lib/clientProfile.mjs';
import { exportLearningBackup, importLearningBackup } from '../src/lib/learningBackup.mjs';
import { HIRAGANA_GRID } from '../src/data/kanaPractice.mjs';
import { KANA_CHART } from '../src/data/beginnerKana.mjs';

function profile(t, values) {
  for (const [key, value] of Object.entries({ window: {}, localStorage: { getItem: key => values[key] ?? null } })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis,key,previous) : delete globalThis[key]);
  }
}
test('nickname and beginner headers stay encoded and preserve explicit N1 exam override',t=>{
  profile(t,{nihongo_quest_username:'지인 / 학습',nihongo_quest_target_level:'BEGINNER'});
  assert.deepEqual(getSyncHeaders(),{'x-nihongo-username':encodeURIComponent('지인 / 학습'),'x-nihongo-target-level':'BEGINNER'});
  assert.equal(getSyncHeaders({'x-nihongo-target-level':'N1'})['x-nihongo-target-level'],'N1');
});
test('backup transport keeps both data types and code/JSON payloads separate',async t=>{
  profile(t,{nihongo_quest_username:'학습자',nihongo_quest_target_level:'N1'});
  const requests=[];
  t.mock.method(globalThis,'fetch',async(url,options)=>{requests.push({url,options});return {json:async()=>({success:true,addedCount:1})};});
  for(const type of ['bookmarks','wrong-notes']){
    await exportLearningBackup(type);
    const exported=requests.at(-1);
    assert.equal(exported.url,`/api/sync?type=${type}`);assert.equal(exported.options.body,undefined);
    assert.equal(exported.options.headers['x-nihongo-username'],encodeURIComponent('학습자'));
    for(const payload of [{backupCode:'コード\n원문'},{rawJson:type==='bookmarks'?{bookmarks:[{word:'踏襲',reading:'とうしゅう',meaning:'답습'}]}:{wrongAnswers:[{quizId:'existing-id',reviewCount:3,isResolved:false}]}}]){
      await importLearningBackup(type,payload);
      const imported=requests.at(-1);assert.equal(imported.url,exported.url);assert.equal(imported.options.method,'POST');
      assert.equal(imported.options.headers['Content-Type'],'application/json');assert.deepEqual(JSON.parse(imported.options.body),payload);
    }
  }
  const before=requests.length;
  await assert.rejects(()=>importLearningBackup('other',{}));assert.equal(requests.length,before);
});
test('handwriting grid keeps all 46 canonical pairs and the original five-column gaps',()=>{
  assert.equal(HIRAGANA_GRID.length,11);assert.ok(HIRAGANA_GRID.every(row=>row.length===5));
  const flat=HIRAGANA_GRID.flat().filter(Boolean);assert.equal(flat.length,46);
  assert.deepEqual(flat.map(k=>[k.h,k.k,k.r]),KANA_CHART.map(k=>[k.hiragana,k.katakana,k.sound]));
  assert.deepEqual(HIRAGANA_GRID[7].map(k=>k?.h??null),['や',null,'ゆ',null,'よ']);
  assert.deepEqual(HIRAGANA_GRID[9].map(k=>k?.h??null),['わ',null,null,null,'を']);
});
