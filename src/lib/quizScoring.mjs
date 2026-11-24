export function normalizeQuizAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim();
}

export const ASSEMBLY_STAR_MODE = 'assembly-star';

export function getN1Assembly(quiz, pieces) {
  if (quiz.quizType !== 'ASSEMBLY' || quiz.jlptLevel !== 'N1' || quiz.arenaCategory !== 'GRAMMAR') {
    return undefined;
  }

  if (pieces === undefined) {
    try {
      pieces = JSON.parse(quiz.wrongAnswers);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(pieces) || pieces.length < 3 ||
      !pieces.every(piece => typeof piece === 'string' && piece.trim()) || pieces.join('') !== quiz.correctAnswer) {
    return undefined;
  }

  const count = Math.min(6, Math.max(3, Math.ceil((pieces.length + 1) / 2)));
  const start = Math.floor((pieces.length - count) / 2);
  const end = start + count;
  return {
    prefix: pieces.slice(0, start).join(''),
    suffix: pieces.slice(end).join(''),
    options: pieces.slice(start, end),
    starSlot: Math.floor(count / 2)
  };
}

export function evaluateQuizAnswer(selectedAnswer, quiz) {
  const submitted = normalizeQuizAnswer(selectedAnswer);
  if (!submitted) return false;
  if (quiz?.assemblyBoard) return submitted === normalizeQuizAnswer(quiz.correctAnswer);

  const answers = (quiz?.jlptLevel === 'N1' || quiz?.id?.startsWith('n1-q3-') || quiz?.id?.startsWith('beginner-20261019-')) && ['MULTIPLE_CHOICE', 'LISTENING', 'READING'].includes(quiz?.quizType)
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
