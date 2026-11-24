'use client';

import { useRef, useState } from 'react';
import styles from './N1SentenceAssembly.module.css';

export default function N1SentenceAssembly({ board, submitted, onSubmit }) {
  const { prefix, suffix, options, starSlot } = board;
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const locked = submitted || pending;

  async function submit() {
    if (locked || submitting.current || selected === null) return;
    submitting.current = true;
    setPending(true);
    try {
      await onSubmit(options[selected]);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className={styles.board} aria-label="N1 문장 조립 보드">
      <p className={styles.instruction}>문장이 완성되도록 보기를 배열했을 때, ★에 들어갈 보기를 하나 고르세요.</p>
      <div className={styles.card}>
        <div className={styles.sentence}>
          <strong>문제</strong>
          {prefix && <span lang="ja">{prefix}</span>}
          <span className={styles.slots} aria-label="문장 빈칸" role="group">
            {options.map((_, slot) => {
              const star = slot === starSlot;
              const label = `${slot + 1}번${star ? ' 별표' : ''} 칸`;
              return (
                <span key={slot} className={styles.slot} role="img" aria-label={label}>
                  {star && <span className={styles.star} aria-hidden="true">★</span>}
                </span>
              );
            })}
          </span>
          {suffix && <span lang="ja">{suffix}</span>}
        </div>
        <ol className={styles.options} aria-label="별표에 들어갈 보기">
          {options.map((word, index) => (
            <li key={index}>
              <button
                type="button"
                className={styles.option}
                disabled={locked}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                <span>{index + 1}.</span><span lang="ja">{word}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      {!submitted && (
        <button type="button" className={`glow-btn ${styles.submit}`} onClick={submit} disabled={selected === null || pending}>
          {pending ? '채점 중…' : '정답 제출'}
        </button>
      )}
    </section>
  );
}
