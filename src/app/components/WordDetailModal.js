'use client';
import { createPortal } from 'react-dom';
import { getExampleSentence } from '@/utils/exampleSentences';

export default function WordDetailModal({ selectedWord, setSelectedWord, speak }) {
return createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div data-draggable-modal className="premium-card animate-scale modal-premium-content" style={{
            maxWidth: '520px',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'left',
            padding: '36px',
            position: 'relative'
          }}>
            {/* 상단 닫기 아이콘 */}
            <button 
              onClick={() => setSelectedWord(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: '900'
              }}
            >
              ✕
            </button>

            <span data-modal-drag-handle style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
              ⭐ 단어 상세 정보
            </span>

            {/* 일본어 표기 및 요미가나 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                {selectedWord.word}
              </h2>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                [{selectedWord.reading}]
              </span>
            </div>

            {/* 한글 뜻 */}
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              borderLeft: '4px solid var(--accent-color)',
              marginBottom: '24px' 
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '800', display: 'block', textTransform: 'uppercase' }}>
                한글 의미
              </span>
              <p style={{ fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: '800', margin: '4px 0 0 0' }}>
                {selectedWord.meaning}
              </p>
            </div>

            {/* 🍱 찰떡 매칭 예시 문장 영역 */}
            <div style={{
              background: 'rgba(255, 179, 126, 0.05)',
              border: '1px solid rgba(255, 179, 126, 0.25)',
              borderRadius: 'var(--custom-radius)',
              padding: '20px',
              marginBottom: '28px'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#ffb37e', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                📝 학습용 실전 예시 문장
              </span>
              
              {/* 일본어 예문 */}
              <p style={{ 
                fontSize: '1.1rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                lineHeight: '1.6',
                marginBottom: '10px',
                wordBreak: 'keep-all'
              }}>
                {getExampleSentence(selectedWord.word, selectedWord.meaning).sentence}
              </p>

              {/* 한국어 번역 */}
              <p style={{ 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: 'var(--text-secondary)', 
                lineHeight: '1.5',
                margin: 0
              }}>
                {getExampleSentence(selectedWord.word, selectedWord.meaning).translation}
              </p>
            </div>

            {/* 하단 제어 버튼 모음 */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => speak(selectedWord.word)}
                className="outline-btn"
                style={{ padding: '12px 20px', fontSize: '0.9rem', flex: 1, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
              >
                🔊 단어 듣기
              </button>
              
              <button 
                onClick={() => speak(getExampleSentence(selectedWord.word, selectedWord.meaning).sentence)}
                className="glow-btn"
                style={{ 
                  padding: '12px 24px', 
                  fontSize: '0.9rem', 
                  flex: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, #ff9494 100%)'
                }}
              >
                📢 예문 전체 듣기
              </button>
            </div>
          </div>
        </div>,
        document.body
);
}
