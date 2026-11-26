'use client';
import { createPortal } from 'react-dom';
import { getExampleSentence } from '@/utils/exampleSentences';

// 단어장에서 단어를 누르면 뜨는 상세 정보: 읽기, 뜻, 예문, 듣기 버튼
export default function WordDetailModal({ selectedWord, setSelectedWord, speak }) {
  const example = getExampleSentence(selectedWord.word, selectedWord.meaning);
  return createPortal(
    <div className="modal-overlay">
      <div data-draggable-modal className="premium-card animate-scale modal-premium-content word-modal">
        <button onClick={() => setSelectedWord(null)} className="word-modal-close" aria-label="닫기">✕</button>

        <span data-modal-drag-handle className="word-modal-kicker">⭐ 단어 상세 정보</span>

        <div className="word-modal-head">
          <h2>{selectedWord.word}</h2>
          <span className="word-modal-reading">[{selectedWord.reading}]</span>
        </div>

        <div className="word-modal-meaning">
          <span className="word-modal-label">한글 의미</span>
          <p>{selectedWord.meaning}</p>
        </div>

        <div className="word-modal-example">
          <span className="word-modal-example-label">📝 학습용 실전 예시 문장</span>
          <p className="word-modal-example-jp">{example.sentence}</p>
          <p className="word-modal-example-kr">{example.translation}</p>
        </div>

        <div className="word-modal-actions">
          <button onClick={() => speak(selectedWord.word)} className="outline-btn word-modal-speak">🔊 단어 듣기</button>
          <button onClick={() => speak(example.sentence)} className="glow-btn word-modal-speak-all">📢 예문 전체 듣기</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
