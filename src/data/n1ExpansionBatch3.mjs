import { addBatch3Vocabulary } from './n1Batch3Vocabulary.mjs';
import { addBatch3Grammar } from './n1Batch3Grammar.mjs';
import { addBatch3Reading } from './n1Batch3Reading.mjs';
import { addBatch3Listening } from './n1Batch3Listening.mjs';

export function buildN1ExpansionBatch3(ids) {
  const rows = [];
  const add = (category, key, itemType, quizType, questionText, japaneseWord, pronunciation, correctAnswer, wrong, hint) => {
    const stimulusId = `n1-20261124-b3-${category.toLowerCase()}-${key}`;
    const stageNumber = category === 'VOCAB' ? (itemType === 'reading' ? 1 : 2)
      : category === 'LISTENING' ? 4 : quizType === 'ASSEMBLY' ? 5 : 3;
    rows.push({
      id: `${stimulusId}-${itemType}`, stageId: ids[stageNumber], quizType,
      questionText: `[N1] ${questionText}`, japaneseWord, pronunciation, correctAnswer,
      wrongAnswers: JSON.stringify(wrong), hint, jlptLevel: 'N1', arenaCategory: category,
      itemType, status: 'ACTIVE', stimulusId, examOrder: null, examDomain: null
    });
  };
  addBatch3Vocabulary(add);
  addBatch3Grammar(add);
  addBatch3Reading(add);
  addBatch3Listening(add);
  return rows;
}
