import { addExpansionVocabulary } from './n1ExpansionVocabulary.mjs';
import { addExpansionGrammar } from './n1ExpansionGrammar.mjs';
import { addExpansionReading } from './n1ExpansionReading.mjs';
import { addExpansionListening } from './n1ExpansionListening.mjs';

// Authored import material only. Runtime arenas read Quiz rows from PostgreSQL.
export function buildN1Expansion(ids) {
  const rows = [];
  const add = (category, key, itemType, quizType, questionText, japaneseWord, pronunciation, correctAnswer, wrong, hint) => {
    const group = `n1-20261019-${category.toLowerCase()}-${key}`;
    const stage = category === 'VOCAB' ? (itemType === 'reading' ? 1 : 2)
      : category === 'LISTENING' ? 4 : quizType === 'ASSEMBLY' ? 5 : 3;
    rows.push({ id: `${group}-${itemType}`, stageId: ids[stage], quizType,
      questionText: `[N1] ${questionText}`, japaneseWord, pronunciation, correctAnswer,
      wrongAnswers: JSON.stringify(wrong), hint, jlptLevel: 'N1', arenaCategory: category,
      itemType, status: 'ACTIVE', stimulusId: group, examOrder: null, examDomain: null });
  };
  addExpansionVocabulary(add);
  addExpansionGrammar(add);
  addExpansionReading(add);
  addExpansionListening(add);
  return rows;
}
