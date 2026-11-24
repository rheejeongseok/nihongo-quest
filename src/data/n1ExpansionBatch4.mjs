import { addBatch4Vocabulary } from './n1Batch4Vocabulary.mjs';
import { addBatch4Grammar } from './n1Batch4Grammar.mjs';
import { addBatch4Reading } from './n1Batch4Reading.mjs';
import { addBatch4Listening } from './n1Batch4Listening.mjs';

export function buildN1ExpansionBatch4(ids) {
  const rows = [];
  const add = (category, key, itemType, quizType, questionText, japaneseWord, pronunciation, correctAnswer, wrong, hint) => {
    const stimulusId = `n1-20261124-b4-${category.toLowerCase()}-${key}`;
    const stageNumber = category === 'VOCAB' ? (itemType === 'reading' ? 1 : 2)
      : category === 'LISTENING' ? 4 : quizType === 'ASSEMBLY' ? 5 : 3;
    rows.push({
      id: `${stimulusId}-${itemType}`, stageId: ids[stageNumber], quizType,
      questionText: `[N1] ${questionText}`, japaneseWord, pronunciation, correctAnswer,
      wrongAnswers: JSON.stringify(wrong), hint, jlptLevel: 'N1', arenaCategory: category,
      itemType, status: 'ACTIVE', stimulusId, examOrder: null, examDomain: null
    });
  };
  addBatch4Vocabulary(add);
  addBatch4Grammar(add);
  addBatch4Reading(add);
  addBatch4Listening(add);
  return rows;
}
