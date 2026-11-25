'use client';

// 손글씨 판독 그림판: 캔버스, 정답 겹쳐보기, 붓 두께, 구글 손글씨 인식 추천 글자
export default function DrawingPanel({
  quiz, canvasRef, drawHandlers, showOverlayGuide, setShowOverlayGuide, brushSize, setBrushSize,
  candidates, recognizing, submitted, onPick, onClear
}) {
  return (
    <div className="premium-card drawing-panel">
      <div className="drawing-head">
        <h4>🖌️ 손글씨 판독기 (Drawing OCR)</h4>
        <button onClick={() => setShowOverlayGuide(!showOverlayGuide)} className={`drawing-guide-toggle${showOverlayGuide ? ' on' : ''}`}>
          {showOverlayGuide ? '가이드 숨기기' : '정답 겹쳐보기 👁️'}
        </button>
      </div>

      <div className="drawing-canvas-box">
        {showOverlayGuide && quiz.quizType !== 'LISTENING' && <div className="drawing-guide">{quiz.japaneseWord}</div>}
        {/* 그리는 동안 페이지가 스크롤되지 않도록 touch-action: none (CSS) */}
        <canvas ref={canvasRef} width={340} height={340} className="drawing-canvas" {...drawHandlers} />
      </div>

      <div className="drawing-controls">
        <div className="drawing-brush">
          <span className="drawing-brush-label">두께</span>
          <input type="range" min={2} max={16} value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} />
          <span className="drawing-brush-size">{brushSize}px</span>
        </div>
        <div className="drawing-actions">
          {candidates.length > 0 && (
            <button onClick={() => onPick(candidates[0])} disabled={submitted} className="glow-btn drawing-quick-pick">
              ✨ 즉시 입력 (1순위)
            </button>
          )}
          <button onClick={onClear} className="outline-btn drawing-clear">🧹 그림판 지우기</button>
        </div>
      </div>

      <div className="drawing-candidates">
        <span className="drawing-candidates-label">
          {recognizing ? '⏳ 인공지능이 손글씨 해독 중...' : '🧠 구글 실시간 해독 추천 (클릭 시 입력 및 자동 지우기):'}
        </span>
        <div className="drawing-candidate-list">
          {candidates.length === 0 ? (
            <span className="drawing-empty">왼쪽 그림판에 마우스/터치 펜으로 일본어를 그려주세요.</span>
          ) : (
            candidates.map((char, index) => (
              <button key={index} onClick={() => onPick(char)} disabled={submitted} className="drawing-candidate">{char}</button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
