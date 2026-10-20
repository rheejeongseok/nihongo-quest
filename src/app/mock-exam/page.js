'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReadableText from '@/app/ReadableText';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';

const storageKey = 'nihongo-n1-exam-v1';
const initial = { phase: 'intro', questions: [], answers: {}, index: 0, deadline: 0, token: '' };
export default function MockExamPage() {
  const [exam, setExam] = useState(initial);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(0);
  const advanceRef = useRef(null);
  const { speak } = useJapaneseSpeech();
  const active = ['first', 'second'].includes(exam.phase);
  const question = exam.questions[exam.index];
  useEffect(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(storageKey)); if (saved?.token && ['first', 'second', 'results'].includes(saved.phase)) setExam(saved); } catch {}
    setReady(true);
    return () => window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => { if (ready) sessionStorage.setItem(storageKey, JSON.stringify(exam)); }, [exam, ready]);
  useEffect(() => {
    if (!active) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((exam.deadline - Date.now()) / 1000));
      setRemaining(left);
      if (!left) { clearInterval(timer); advanceRef.current?.(); }
    };
    const timer = setInterval(update, 1000);
    update();
    return () => clearInterval(timer);
  }, [active, exam.deadline]);
  useEffect(() => {
    if (exam.phase === 'second' && question?.audioText) speak(question.audioText, 1);
    return () => window.speechSynthesis?.cancel();
  }, [exam.phase, question?.id, question?.audioText, speak]);
  async function advance() {
    if (busy) return;
    setBusy(true); setError('');
    window.speechSynthesis?.cancel();
    try {
      const action = exam.phase === 'intro' ? 'start' : exam.phase === 'first' ? 'listening' : 'finish';
      const response = await fetch('/api/mock-exam', { method: 'POST', headers: getSyncHeaders({
        'Content-Type': 'application/json', 'x-nihongo-target-level': 'N1'
      }), body: JSON.stringify({ action, token: exam.token, answers: exam.answers }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '요청에 실패했습니다.');
      if (action === 'finish') setExam(previous => ({ ...previous, phase: 'results', results: data.results }));
      else setExam({ phase: action === 'start' ? 'first' : 'second', token: data.token, questions: data.questions, deadline: data.deadline, answers: {}, index: 0 });
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  advanceRef.current = active && ready ? advance : null;
  const completed = Object.keys(exam.answers).length;
  return <main className="container exam-page">
    <Link href="/">← 메인으로</Link>
    <h1>N1 모의고사 맛보기</h1>
    {error && <p role="alert">{error} <button className="outline-btn" onClick={advance} disabled={busy}>다시 시도</button></p>}
    {exam.phase === 'intro' && <section className="premium-card exam-intro">
      <h2>20문항 · 약 30분</h2>
      <p>1부 언어지식·독해 15문항 / 20분 → 2부 청해 5문항 / 10분</p>
      <p>1부에서는 답을 고치거나 미응답 문제로 돌아갈 수 있습니다. 청해로 넘어간 뒤에는 1부를 수정할 수 없습니다. 청해는 문항 순서대로 진행합니다.</p>
      <p>정답과 해설은 전체 종료 후 공개합니다. 제한 시간이 끝나면 다음 파트 또는 결과로 이동합니다.</p>
      <p>공식 공개 유형을 참고한 자체 문제 1회분입니다. 청해는 일본어 음성 합성으로 재생하며, 결과는 영역별 정답 수로 보여줍니다.</p>
      <button className="glow-btn" onClick={advance} disabled={busy || !ready}>{busy ? '시험 준비 중…' : '모의고사 시작'}</button>
    </section>}
    {active && question && <>
      <div className="exam-toolbar">
        <strong>{exam.phase === 'first' ? '1부 언어지식·독해' : '2부 청해'}</strong>
        <span>문제 {exam.index + 1} / {exam.questions.length} · 응답 {completed}</span>
        <time aria-label="남은 시간">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</time>
      </div>
      {exam.phase === 'first' && <nav className="exam-question-nav" aria-label="문항 이동">{exam.questions.map((item, index) =>
        <button key={item.id} aria-current={exam.index === index ? 'step' : undefined} className={exam.answers[item.id] ? 'answered' : ''}
          onClick={() => setExam(previous => ({ ...previous, index }))}>{index + 1}{exam.answers[item.id] ? ' ✓' : ''}</button>)}</nav>}
      <section className="premium-card exam-question">
        <p className="exam-prompt"><ReadableText text={question.questionText} /></p>
        {question.passage && <article className="reading-passage" lang="ja"><ReadableText text={question.passage} /></article>}
        {question.audioText && <div className="exam-audio"><button className="outline-btn" onClick={() => speak(question.audioText, 1)}>🎧 듣기 / 다시 듣기</button><span>자연 속도 · 대본은 종료 후 공개</span></div>}
        <div className="exam-options" role="group" aria-label="답안 선택">{question.options.map((option, index) =>
          <button className="outline-btn" key={option} aria-pressed={exam.answers[question.id] === option} disabled={busy}
            onClick={() => setExam(previous => ({ ...previous, answers: { ...previous.answers, [question.id]: option } }))}>
            <span>{index + 1}</span><ReadableText text={option} />
          </button>)}</div>
      </section>
      <div className="exam-controls">
        {exam.phase === 'first' && <button className="outline-btn" disabled={busy || !exam.index} onClick={() => setExam(previous => ({ ...previous, index: previous.index - 1 }))}>이전 문제</button>}
        {exam.index < exam.questions.length - 1 ? <button className="glow-btn" disabled={busy} onClick={() => setExam(previous => ({ ...previous, index: previous.index + 1 }))}>다음 문제 →</button> :
          <button className="glow-btn" disabled={busy} onClick={advance}>{busy ? '제출 중…' : exam.phase === 'first' ? '1부 제출하고 청해 시작' : '시험 종료 · 결과 보기'}</button>}
        {exam.index === exam.questions.length - 1 && completed < exam.questions.length && <span>미응답 {exam.questions.length - completed}문항은 오답으로 처리됩니다.</span>}
      </div>
    </>}
    {exam.phase === 'results' && <section className="exam-results">
      <h2>모의고사 결과 · {exam.results.filter(result => result.correct).length} / 20</h2>
      <div className="exam-summary">{['언어지식', '독해', '청해'].map(domain => {
        const rows = exam.results.filter(result => result.domain === domain);
        return <div className="premium-card" key={domain}><strong>{domain}</strong><span>{rows.filter(result => result.correct).length} / {rows.length}</span></div>;
      })}</div>
      <p>연습 문항의 정답 수입니다. 실제 JLPT 환산점수·합격 판정으로 변환하지 않습니다.</p>
      {exam.results.map((result, index) => <details className="premium-card exam-review" key={result.id}>
        <summary>{index + 1}. {result.domain} · {result.correct ? '정답' : result.selected ? '오답' : '미응답'}</summary>
        <p className="exam-prompt"><ReadableText text={result.question} /></p>
        {result.passage && <div className="reading-passage"><ReadableText text={result.passage} /></div>}
        <p>내 답: <ReadableText text={result.selected || '미응답'} /></p>
        <p>정답: <ReadableText text={result.answer} /></p>
        <p>해설: <ReadableText text={result.explanation} /></p>
      </details>)}
      <button className="outline-btn" onClick={() => { sessionStorage.removeItem(storageKey); setExam(initial); }}>같은 회차 다시 풀기</button>
    </section>}
  </main>;
}
