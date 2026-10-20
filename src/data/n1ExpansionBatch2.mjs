import { addBatch2Vocabulary } from './n1Batch2Vocabulary.mjs';
import { addBatch2Grammar } from './n1Batch2Grammar.mjs';
import { addBatch2Reading } from './n1Batch2Reading.mjs';
import { addBatch2Listening } from './n1Batch2Listening.mjs';

// Original practice material. Serving questions always reads the database.
export function buildN1ExpansionBatch2(ids) {
  const rows=[];
  const add=(category,key,itemType,quizType,questionText,japaneseWord,pronunciation,correctAnswer,wrong,hint)=>{
    const stimulusId=`n1-20261019-b2-${category.toLowerCase()}-${key}`;
    const stage=category==='VOCAB'?(itemType==='reading'?1:2):category==='LISTENING'?4:quizType==='ASSEMBLY'?5:3;
    rows.push({id:`${stimulusId}-${itemType}`,stageId:ids[stage],quizType,questionText:`[N1] ${questionText}`,
      japaneseWord,pronunciation,correctAnswer,wrongAnswers:JSON.stringify(wrong),hint,
      jlptLevel:'N1',arenaCategory:category,itemType,status:'ACTIVE',stimulusId,examOrder:null,examDomain:null});
  };
  addBatch2Vocabulary(add);addBatch2Grammar(add);addBatch2Reading(add);addBatch2Listening(add);
  return rows;
}
