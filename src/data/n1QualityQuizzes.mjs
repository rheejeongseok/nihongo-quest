import { addQualityVocabulary } from './n1QualityVocabulary.mjs';
import { addQualityGrammar } from './n1QualityGrammar.mjs';
import { addQualityListening } from './n1QualityListening.mjs';
import { addQualityReading } from './n1QualityReading.mjs';

export function buildN1Quizzes(stageIds) {
  const result = [];
  const add = (group, task, stage, type, question, word, reading, answer, wrong, explanation) => {
    result.push({ id: `n1-q3-${group}-${task}`, stageId: stageIds[stage], quizType: type,
      questionText: `[N1] ${question}`, japaneseWord: word, pronunciation: reading,
      correctAnswer: answer, wrongAnswers: JSON.stringify(wrong), hint: explanation });
  };
  addQualityVocabulary(add);
  addQualityGrammar(add);
  addQualityListening(add);
  addQualityReading(add);
  return result;
}
