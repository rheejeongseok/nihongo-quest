'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';
import { HIRAGANA_GRID } from '@/data/kanaPractice.mjs';

export default function CalligraphyPractice({ open, targetLevel, onClose, setUser }) {
  const { speak } = useJapaneseSpeech();
  const [selectedChar, setSelectedChar] = useState({ h: 'あ', k: 'ア', r: 'a' });
  const [isHiraganaTab, setIsHiraganaTab] = useState(true);
  const [brushColor, setBrushColor] = useState('#486b48');
  const [brushWidth, setBrushWidth] = useState(6);
  const [showStamp, setShowStamp] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);



  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);

  // 캔버스 가이드 글자 그리기 헬퍼
  const drawGuideText = (ctx, text) => {
    if (!ctx) return;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.font = '900 160px "M PLUS Rounded 1c", "NanumSquareRound", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isDark = typeof window !== 'undefined' && localStorage.getItem('nihongo_quest_theme') === 'cyber';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    ctx.fillText(text, width / 2, height / 2);
  };

  // 캔버스 초기화 및 selectedChar 변경 감지 리스너
  useEffect(() => {
    if (targetLevel !== 'BEGINNER' || !open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 반응형 크기에 따른 고해상도 세팅
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const char = isHiraganaTab ? selectedChar.h : selectedChar.k;
    drawGuideText(ctx, char);
  }, [selectedChar, isHiraganaTab, targetLevel, open]);

  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const coords = getCoordinates(e, canvas);
    lastXRef.current = coords.x;
    lastYRef.current = coords.y;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e, canvas);

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastXRef.current = coords.x;
    lastYRef.current = coords.y;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const char = isHiraganaTab ? selectedChar.h : selectedChar.k;
    drawGuideText(ctx, char);
  };

  const spawnConfetti = () => {
    const colors = ['#ff9494', '#ffb37e', '#a6cf98', '#90b4fc', '#b19ffb', '#ffd32a'];
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: Math.random().toString(),
        left: `${Math.random() * 100}vw`,
        top: `-20px`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        transform: `rotate(${Math.random() * 360}deg)`,
        animationDelay: `${Math.random() * 1.5}s`
      });
    }
    setConfettiParticles(particles);
    setTimeout(() => {
      setConfettiParticles([]);
    }, 4500);
  };

  const handleDrawSuccess = async () => {
    if (showStamp) return;

    setShowStamp(true);
    setTimeout(() => setShowStamp(false), 2000);

    spawnConfetti();

    const char = isHiraganaTab ? selectedChar.h : selectedChar.k;
    speak(`${char}. 참 잘그렸어요! 💮`);

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'calligraphy_complete' })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (e) {
      console.error("포인트 누적 동기화 에러:", e);
      setUser(prev => prev ? { ...prev, points: prev.points + 10 } : null);
    }
  };


  return <>
{confettiParticles.length > 0 && (
        <div className="pure-confetti-container">
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className="pure-confetti-particle"
              style={{
                left: p.left,
                top: p.top,
                backgroundColor: p.backgroundColor,
                transform: p.transform,
                animationDelay: p.animationDelay
              }}
            />
          ))}
        </div>
      )}


{open && createPortal(
        <div className="calligraphy-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}>
          <div data-draggable-modal className="calligraphy-modal-window">

            {/* 모달 헤더 */}
            <div data-modal-drag-handle className="calligraphy-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🌱</span>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)' }}>왕초보 문자 비법서 & 손글씨 연습장</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>히라가나/가타카나 표준 50음도 정복 코스</p>
                </div>
              </div>
              <button
                onClick={() => onClose()}
                className="calligraphy-modal-close-btn"
                title="코스 종료 및 대시보드로 돌아가기"
              >
                ✕
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="calligraphy-modal-body">
              <div className="beginner-quest-board">

                {/* 좌측: 50음도 그리드 */}
                <div className="beginner-left-pane">
                  <div className="beginner-tabs-container">
                    <div className="beginner-tabs">
                      <button
                        onClick={() => { setIsHiraganaTab(true); clearCanvas(); }}
                        className={`beginner-tab-btn ${isHiraganaTab ? 'active' : ''}`}
                      >
                        히라가나 (ひらがな)
                      </button>
                      <button
                        onClick={() => { setIsHiraganaTab(false); clearCanvas(); }}
                        className={`beginner-tab-btn ${!isHiraganaTab ? 'active' : ''}`}
                      >
                        가타카나 (カタカナ)
                      </button>
                    </div>
                  </div>

                  <div className="alphabet-grid-container">
                    <div className="alphabet-grid">
                      {HIRAGANA_GRID.flat().map((char, index) => {
                        if (!char) {
                          return <div key={`empty-${index}`} className="alphabet-cell empty" />;
                        }
                        const isSelected = selectedChar.h === char.h;
                        return (
                          <div
                            key={char.h}
                            onClick={() => {
                              setSelectedChar(char);
                              speak(isHiraganaTab ? char.h : char.k);
                            }}
                            className={`alphabet-cell ${isSelected ? 'active' : ''}`}
                          >
                            <span className="cell-char">{isHiraganaTab ? char.h : char.k}</span>
                            <span className="cell-roman">{char.r}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 우측: 드로잉 연습장 */}
                <div className="beginner-right-pane">
                  <div className="canvas-panel">
                    <h4 className="beginner-pane-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      ✍️ {isHiraganaTab ? '히라가나' : '가타카나'} 손글씨 연습장
                    </h4>
                    <p className="canvas-header-desc">
                      격자 칠판에서 가이드를 보며 마우스나 손가락으로 글자를 따라 그려 보세요! 완료 후 성공 확인을 누르면 보너스 포인트가 지급됩니다.
                    </p>

                    <div className="canvas-container-relative">
                      <div className="canvas-traditional-grid-bg" />
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
                        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
                        className="drawing-canvas"
                      />

                      {/* 스탬프 레이어 */}
                      <div className={`canvas-stamp-overlay ${showStamp ? 'show' : ''}`}>
                        💮
                      </div>
                    </div>

                    <div className="canvas-tools-bar">
                      {/* 색상 선택 */}
                      <div className="tools-group">
                        <span className="tools-label">붓 색상</span>
                        <div className="color-palette">
                          {[
                            { color: '#486b48', label: '젠 그린' },
                            { color: '#ff6b6b', label: '네온 핑크' },
                            { color: '#54a0ff', label: '샤인 블루' },
                            { color: '#ffd32a', label: '선샤인 옐로' },
                            { color: '#2d382e', label: '진한 묵즙' }
                          ].map((c) => (
                            <div
                              key={c.color}
                              onClick={() => setBrushColor(c.color)}
                              className={`color-chip ${brushColor === c.color ? 'active' : ''}`}
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* 굵기 선택 */}
                      <div className="tools-group">
                        <span className="tools-label">붓 굵기</span>
                        <div className="brush-sizes">
                          {[
                            { size: 3, label: '가늘게' },
                            { size: 6, label: '보통' },
                            { size: 10, label: '두껍게' },
                            { size: 15, label: '아주두껍게' }
                          ].map((b) => (
                            <button
                              key={b.size}
                              onClick={() => setBrushWidth(b.size)}
                              className={`brush-btn ${brushWidth === b.size ? 'active' : ''}`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 작업 단추 */}
                      <div className="action-buttons">
                        <button onClick={clearCanvas} className="action-btn clear">
                          🔄 칠판 지우기
                        </button>
                        <button onClick={handleDrawSuccess} className="action-btn success">
                          💮 참 잘했어요! (+10 pts)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>,
        document.body
)}
</>;
}
