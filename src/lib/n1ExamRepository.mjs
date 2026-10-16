export async function getN1Exam(prisma) {
  const rows = await prisma.quiz.findMany({
    where: { jlptLevel: 'N1', arenaCategory: 'MOCK_EXAM', status: 'ACTIVE' },
    orderBy: { examOrder: 'asc' }
  });
  if (rows.length !== 20 || rows.some((row, index) => row.examOrder !== index + 1
    || row.examDomain !== (index < 9 ? '언어지식' : index < 15 ? '독해' : '청해')
    || (index >= 15 && row.quizType !== 'LISTENING'))) return null;
  return rows.map(row => ({ ...row, domain: row.examDomain }));
}
