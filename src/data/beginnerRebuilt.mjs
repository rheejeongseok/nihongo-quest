import { addBeginnerKana } from './beginnerKana.mjs';
import { addBeginnerVocabulary } from './beginnerRebuiltVocabulary.mjs';
import { addBeginnerGrammar } from './beginnerRebuiltGrammar.mjs';
import { addBeginnerReading } from './beginnerRebuiltReading.mjs';
import { addBeginnerListening } from './beginnerRebuiltListening.mjs';

export function buildBeginnerQuizzes(ids) {
  const rows = [];
  const add = (category, key, difficulty, type, quizType, text, word, reading, answer, wrong, hint) => {
    const group = `beginner-20261019-${category.toLowerCase()}-${key}`;
    const stage = ['VOCAB','KANA'].includes(category) ? 1 : category === 'LISTENING' ? 4 : quizType === 'ASSEMBLY' ? 5 : 3;
    rows.push({ id: `${group}-${type}`, stageId: ids[stage], quizType,
      questionText: `[BEGINNER-${difficulty}] ${text}`, japaneseWord: word, pronunciation: reading,
      correctAnswer: answer, wrongAnswers: JSON.stringify(wrong), hint,
      jlptLevel: 'BEGINNER', arenaCategory: category, itemType: type, status: 'ACTIVE',
      stimulusId: group, examOrder: null, examDomain: null });
  };
  addBeginnerKana(add); addBeginnerVocabulary(add); addBeginnerGrammar(add); addBeginnerReading(add); addBeginnerListening(add);
  return rows;
}
