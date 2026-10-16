export function isObsoleteN1Quiz(quiz) {
  return quiz.jlptLevel === 'LEGACY' && quiz.status === 'ARCHIVED'
    && !/BEGINNER/i.test(quiz.questionText)
    && !quiz.id.startsWith('beginner-')
    && /(?:\[|-)N1(?:[-\]])/.test(quiz.questionText);
}
