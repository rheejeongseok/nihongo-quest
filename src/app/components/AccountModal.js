'use client';
import { createPortal } from 'react-dom';

export default function AccountModal({ inputName, setInputName, setIsModalOpen, handleSaveUsername }) {
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
            maxWidth: '28.75rem',
            width: '90%',
            border: '2px solid var(--accent-color)',
            boxShadow: 'var(--neon-glow)',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>☁️</span>
            <h3 data-modal-drag-handle style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px' }}>
              학습 계정
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.6' }}>
              같은 닉네임으로 접속하면 PC와 모바일에서 단어장과 오답노트를 이어서 사용할 수 있습니다.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="사용할 닉네임 입력"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--custom-radius)',
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--card-border)',
                  color: 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveUsername();
                }}
              />
            </div>

            {/* 모달 버튼 */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="outline-btn"
                style={{ padding: '0.625rem 1.25rem', fontSize: '0.85rem', flex: 1 }}
              >
                취소
              </button>
              <button 
                onClick={handleSaveUsername}
                className="glow-btn"
                style={{ padding: '0.625rem 1.5rem', fontSize: '0.85rem', flex: 1 }}
              >
                저장
              </button>
            </div>
          </div>
        </div>,
        document.body
  );
}
