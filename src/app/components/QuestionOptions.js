'use client';
import ReadableText from '@/app/ReadableText';

export default function QuestionOptions({ currentQuiz, submitted, setTypedAnswer, handleSubmission }) {
  return (<div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {currentQuiz.options?.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setTypedAnswer(option);
                              handleSubmission(option);
                            }}
                            disabled={submitted}
                            className="outline-btn"
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.8rem',
                              textAlign: 'left',
                              whiteSpace: 'normal',
                              wordBreak: 'keep-all',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {idx + 1}. <ReadableText text={option} />
                          </button>
                        ))}
                      </div>
  );
}
