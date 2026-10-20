'use client';

export default function ArenaCourseGrid({ targetLevel, getDynamicStages, categoryMeta, handleMouseMove, handleMouseLeave, router, openDifficultyModal }) {
  return (<div className="arena-section-container">
        <div className="arena-section-heading">
        <div>
        <span className="section-eyebrow">CHOOSE YOUR PRACTICE</span>
        <h2 className="arena-section-title">
          {targetLevel === 'BEGINNER' ? '초보 스타터 아레나' : 'N1 실전 아레나'}
        </h2>
        </div>
        <p>{targetLevel === 'BEGINNER' ? '문자부터 차근차근, 내 속도로 시작해요.' : '10문제로 집중 연습. 모의고사는 20문항·30분.'}</p>
        </div>

        <div className="arena-cards-grid">
          {getDynamicStages().map((stage) => {
            const meta = categoryMeta[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
            const dynamicLabel = targetLevel === 'BEGINNER' ? {
              CALLIGRAPHY: "글자 쓰기",
              CHARACTERS: "기초 문자",
              VOCAB: "문자·어휘",
              GRAMMAR: "문법·문장 구성",
              READING: "독해",
              LISTENING: "일상 청해",
              WORDLE: "기초 워들",
              ASSEMBLY: "기초 조립",
              MOCK_EXAM: "실력 진단"
            }[stage.category] || meta.label : meta.label;

            return (
              <div
                key={stage.id}
                data-category={stage.category}
                className="glass-premium-card rainbow-border interactive-arena arena-card-wrapper"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.02), 0 0 20px ${meta.color}0a`
                }}
              >
                {/* 상단: 카테고리 정보 및 아이콘 */}
                <div className="arena-card-body-wrapper">
                  <div className="arena-card-top">
                    <span className="arena-card-emoji">{stage.emoji || meta.emoji}</span>
                    <span
                      className="arena-card-badge"
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}66`
                      }}
                    >
                      {stage.category === 'KANA' ? '문자 입문' : stage.category === 'MOCK_EXAM' ? '실전 리허설' : dynamicLabel}
                    </span>
                  </div>

                  <h4 className="arena-card-title">
                    {stage.title}
                  </h4>

                  <p className="arena-card-desc">
                    {stage.desc || (targetLevel === 'BEGINNER'
                      ? '문자 입문부터 중급 입문까지 DB 문제에서 무작위 출제'
                      : 'N1 출제 유형에 맞춘 자체 연습문제를 무작위 출제')}
                  </p>
                </div>

                {/* 하단: 입장 버튼 및 매칭 명세 */}
                <div className="arena-card-footer">
                  {targetLevel === 'N1' && stage.category === 'VOCAB' && (
                    <button className="outline-btn arena-card-btn" onClick={() => router.push('/play/5?jlptLevel=N1&category=WORDLE')}>🧩 워들 복습</button>
                  )}
                  <span className="arena-card-footer-label">
                    독자 아레나 코스
                  </span>
                  <button
                    onClick={() => openDifficultyModal(stage)}
                    className="glass-neon-btn arena-card-btn"
                  >
                    {stage.category === 'MOCK_EXAM' ? '모의고사 시작 ↗' : '연습 시작 →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>);
}
