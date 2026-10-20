'use client';

export default function SentenceAssembly({ currentQuiz, isBeginner, assemblyPads, setAssemblyPads, submitted, handleSubmission }) {
  return (<div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* 조립 보드 */}
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                    ⛓️ {isBeginner ? '초보 문장 조립 보드' : 'N1 문장 조립 보드'} (조립판의 단어를 클릭하면 취소할 수 있습니다)
                  </span>
                  <div style={{
                    minHeight: '74px',
                    background: 'var(--bg-secondary)',
                    border: '2.5px dashed var(--accent-color)',
                    borderRadius: 'var(--custom-radius)',
                    padding: '16px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    {assemblyPads.length === 0 ? (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        아래의 단어 조각 카드를 순서대로 탭하여 {isBeginner ? '기초' : '경어'} 문장을 완성하세요.
                      </span>
                    ) : (
                      assemblyPads.map((origIdx, wIdx) => (
                        <button
                          key={wIdx}
                          onClick={() => {
                            if (submitted) return;
                            setAssemblyPads(prev => prev.filter((_, idx) => idx !== wIdx));
                          }}
                          disabled={submitted}
                          className="glow-btn animate-scale"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.95rem',
                            background: 'linear-gradient(135deg, var(--accent-color) 0%, #9b5de5 100%)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(155, 93, 229, 0.2)'
                          }}
                        >
                          {currentQuiz.options?.[origIdx]} <span style={{ marginLeft: '4px', opacity: 0.7 }}>✕</span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* 단어 조각 풀 */}
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                    🃏 사용 가능한 단어 조각 카드 (클릭 시 조립판에 찰칵 결합!)
                  </span>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: 'center',
                    padding: '12px 0'
                  }}>
                    {currentQuiz.options?.map((word, oIdx) => {
                      const isSelected = assemblyPads.includes(oIdx);
                      if (isSelected) return null;
                      
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            if (submitted) return;
                            setAssemblyPads(prev => [...prev, oIdx]);
                          }}
                          disabled={submitted}
                          className="outline-btn hover-glow animate-scale"
                          style={{
                            padding: '10px 18px',
                            fontSize: '0.95rem',
                            fontWeight: '850',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            background: 'var(--card-bg)',
                            border: '2px solid var(--card-border)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {word}
                        </button>
                      );
                    })}
                    {assemblyPads.length === (currentQuiz.options?.length || 0) && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        모든 카드가 조립판에 결합되었습니다!
                      </span>
                    )}
                  </div>

                  {/* 제출 액션 버튼 */}
                  {!submitted && (
                    <button
                      onClick={() => {
                        const assembledSentence = assemblyPads.map(idx => currentQuiz.options?.[idx]).join('');
                        handleSubmission(assembledSentence);
                      }}
                      disabled={assemblyPads.length === 0}
                      className="glow-btn"
                      style={{
                        padding: '14px 28px',
                        fontSize: '1rem',
                        alignSelf: 'center',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    >
                      조합 검증 및 채점 제출 ⚔️
                    </button>
                  )}

                </div>);
}
