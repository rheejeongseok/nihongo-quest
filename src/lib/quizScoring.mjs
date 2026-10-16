export function normalizeQuizAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim();
}

export function evaluateQuizAnswer(selectedAnswer, quiz) {
  const submitted = normalizeQuizAnswer(selectedAnswer);
  if (!submitted) return false;

  const answers = quiz?.id?.startsWith('n1-q3-') && ['MULTIPLE_CHOICE', 'LISTENING', 'READING'].includes(quiz?.quizType)
    ? [quiz?.correctAnswer]
    : [quiz?.correctAnswer, quiz?.japaneseWord];
  return answers
    .map(normalizeQuizAnswer)
    .filter(Boolean)
    .some(answer => answer === submitted);
}

export function normalizeTimeTaken(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.round(parsed), 0), 60 * 60);
}
