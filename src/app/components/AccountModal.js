'use client';
import { createPortal } from 'react-dom';

// 학습 계정(닉네임) 바꾸기
export default function AccountModal({ inputName, setInputName, setIsModalOpen, handleSaveUsername }) {
  return createPortal(
    <div className="modal-overlay">
      <div data-draggable-modal className="premium-card animate-scale modal-premium-content account-modal">
        <span className="account-modal-icon">☁️</span>
        <h3 data-modal-drag-handle className="account-modal-title">학습 계정</h3>
        <p className="account-modal-desc">
          같은 닉네임으로 접속하면 PC와 모바일에서 단어장과 오답노트를 이어서 사용할 수 있습니다.
        </p>

        <div className="account-modal-field">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="사용할 닉네임 입력"
            className="account-modal-input"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); }}
          />
        </div>

        <div className="account-modal-actions">
          <button onClick={() => setIsModalOpen(false)} className="outline-btn account-modal-cancel">취소</button>
          <button onClick={handleSaveUsername} className="glow-btn account-modal-save">저장</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
