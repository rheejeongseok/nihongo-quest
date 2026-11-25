'use client';

import QuestionOptions from '@/app/components/QuestionOptions';

// 주관식 입력칸(초보 코스나 보기가 없는 문제)과 사지선다 보기
export default function AnswerInput({ quiz, isBeginner, hasDrawingFeature, typedAnswer, setTypedAnswer, submitted, handleSubmission }) {
  const hasOptions = quiz.options && quiz.options.length > 0;
  return (
    <>
      {(isBeginner || !quiz.options?.length) && (
        <div className="play-typed-answer">
          <span className="play-section-label">✍️ 손글씨 주관식 정답 입력</span>
          <div className="input-submit-group">
            <input
              type="text"
              className="play-typed-input"
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder={hasDrawingFeature ? '그림판에 쓰거나 직접 입력' : '정답 입력'}
              disabled={submitted}
            />
            <button onClick={() => handleSubmission(typedAnswer)} disabled={submitted || !typedAnswer} className="glow-btn play-typed-submit">
              <span className="pc-only">주관식 제출 ➔</span>
              <span className="mobile-only">➔</span>
            </button>
          </div>
        </div>
      )}
      {hasOptions && (
        <div className="play-options">
          <span className="play-section-label small">{isBeginner ? '💡 참고용 객관식 보기' : '답안 선택'}</span>
          <QuestionOptions currentQuiz={quiz} submitted={submitted} setTypedAnswer={setTypedAnswer} handleSubmission={handleSubmission} />
        </div>
      )}
    </>
  );
}
