export const EXAM_PARTS = [
  { name: '언어지식·독해', seconds: 1200, count: 15 },
  { name: '청해', seconds: 600, count: 5 }
];
export function examQuestionForClient(quiz, random = Math.random) {
  const options = [quiz.correctAnswer, ...JSON.parse(quiz.wrongAnswers)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { id: quiz.id, domain: quiz.domain, quizType: quiz.quizType,
    questionText: quiz.questionText.replace(/^\[N1\]\s*/, ''), passage: quiz.quizType === 'READING' ? quiz.japaneseWord : '',
    audioText: quiz.quizType === 'LISTENING' ? quiz.japaneseWord : '', options };
}
export function gradeN1Exam(items, answers) {
  return items.map(quiz => ({ id: quiz.id, domain: quiz.domain, question: quiz.questionText.replace(/^\[N1\]\s*/, ''),
    passage: ['READING', 'LISTENING'].includes(quiz.quizType) ? quiz.japaneseWord : '',
    selected: typeof answers[quiz.id] === 'string' ? answers[quiz.id] : '',
    correct: String(answers[quiz.id] || '').normalize('NFKC').trim() === quiz.correctAnswer.normalize('NFKC').trim(),
    answer: quiz.correctAnswer, explanation: quiz.hint }));
}
