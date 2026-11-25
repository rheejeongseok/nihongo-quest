'use client';

import ReadableText from '@/app/ReadableText';

// 제출 뒤 정답/오답 안내와 다음 문제 버튼
export default function AnswerFeedback({ quiz, isCorrect, isBeginner, assemblyBoard, pointsEarned, speedBonusEarned, isLast, onNext }) {
  return (
    <div className={`premium-card question-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
      <div>
        <span className="feedback-title">
          {isCorrect ? '🎉 정답입니다!' : '😢 아쉬운 오답입니다...'}
          <span className="feedback-chip">
            {isCorrect ? `+${pointsEarned} pts 획득` : '오답노트에 자동 적재'}
            {isCorrect && speedBonusEarned > 0 && ` (⚡ 속도 보너스 +${speedBonusEarned} pts 포함!)`}
          </span>
        </span>
        {quiz.pronunciation && (
          <p className="feedback-reading">
            요미가나(발음): <strong>{quiz.pronunciation}</strong>
          </p>
        )}
        <p className="feedback-answer">
          {assemblyBoard ? '★ 정답: ' : '정답: '}<strong className="underline"><ReadableText text={quiz.correctAnswer} /></strong>
          {isBeginner && <> 또는 <strong><ReadableText text={quiz.japaneseWord} /></strong></>}
        </p>
        {assemblyBoard && (
          <p className="feedback-note">
            완성 문장: <ReadableText text={quiz.japaneseWord} />
          </p>
        )}
        {quiz.hint && (
          <p className="feedback-note small">
            💡 설명: <ReadableText text={assemblyBoard ? quiz.hint.replace(/\r?\n완성문:.*$/u, '') : quiz.hint} />
          </p>
        )}
      </div>

      <button onClick={onNext} className="glow-btn feedback-next">
        {isLast ? '결과 확인 ➔' : '다음 문제 ➔'}
      </button>
    </div>
  );
}
