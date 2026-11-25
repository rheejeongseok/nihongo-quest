'use client';

import ReadableText from '@/app/ReadableText';

const cleanQuestion = text => text
  .replace(/\[(?:N[12](?:-(?:EASY|MEDIUM|HARD|ASSEMBLY))?|BEGINNER-(?:EASY|MEDIUM|HARD))\]\s*/g, '')
  .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
  .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '');

// 정답을 미리 보여 주면 안 되는 문제(문법·조립·단어가 없는 문제)인지
const hidesWord = (quiz, stage) => quiz.quizType === 'ASSEMBLY' || !quiz.japaneseWord || stage.category === 'GRAMMAR'
  || quiz.questionText.includes('【文法形式】') || quiz.questionText.includes('【文章の文法】');

// 문제 지문: 질문, 독해 지문, 크게 보여 줄 단어(제출 전에는 정답이 드러나지 않게), 청해 재생 버튼
export default function QuestionPrompt({ quiz, stage, submitted, onListen }) {
  const isListening = quiz.quizType === 'LISTENING';
  let word = null;
  if (!isListening && quiz.quizType !== 'READING') {
    if (submitted) word = <h3 className="play-word"><ReadableText text={quiz.japaneseWord} /></h3>;
    else if (quiz.quizType === 'WORDLE') word = <h3 className="play-word wordle">🧩 숨겨진 {quiz.japaneseWord.length}글자 단어 맞추기</h3>;
    else if (!hidesWord(quiz, stage)) word = <h3 className="play-word"><ReadableText text={quiz.japaneseWord} /></h3>;
  }
  return (
    <div className="play-question">
      <p className="play-question-text">
        <ReadableText text={cleanQuestion(quiz.questionText)} />
      </p>

      {quiz.quizType === 'READING' && (
        <section className="reading-passage" aria-label="독해 지문" lang="ja">
          <ReadableText text={quiz.japaneseWord} />
        </section>
      )}
      {!isListening && quiz.quizType !== 'READING' && <div className="play-word-box">{word}</div>}

      {isListening && (
        <div className="play-listening">
          <button onClick={onListen} className="pulse-ani play-listen-btn" aria-label="일본어 발음 듣기">🎧</button>
          <span className="play-listen-hint">스피커를 눌러 원어민 일본어 발음을 청취하세요.</span>
        </div>
      )}
    </div>
  );
}
