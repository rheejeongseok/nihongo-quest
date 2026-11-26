'use client';
import ReadableText from '@/app/ReadableText';

export default function QuestionOptions({ currentQuiz, submitted, setTypedAnswer, handleSubmission }) {
  return (<div className="options-grid">
                        {currentQuiz.options?.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTypedAnswer(option);
                              handleSubmission(option);
                            }}
                            disabled={submitted}
                            className="outline-btn option-btn"
                          >
                            {idx + 1}. <ReadableText text={option} />
                          </button>
                        ))}
                      </div>
  );
}
