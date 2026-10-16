// Run against a local production server. Requires Chrome and Node 22+.
// API requests are mocked: this check does not write learning records.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';

const baseUrl = process.env.ARENA_CHECK_URL || 'http://localhost:3102';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nihongo-arena-ui-'));
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = async predicate => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await predicate();
    if (result) return result;
    await delay(200);
  }
  throw new Error('Timed out waiting for browser state');
};
let socket;
try {
  const activePort = path.join(profile, 'DevToolsActivePort');
  await waitFor(() => fs.existsSync(activePort));
  const port = fs.readFileSync(activePort, 'utf8').split('\n')[0];
  const pages = await (await fetch(`http://localhost:${port}/json`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    const task = pending.get(message.id);
    if (task) {
      pending.delete(message.id);
      clearTimeout(task.timer);
      if (message.error) task.reject(new Error(JSON.stringify(message.error)));
      else task.resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const bank = buildN1Quizzes({ 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' });
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const bank = ${JSON.stringify(bank)};
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (url.pathname.startsWith('/api/stages/')) {
        const number = Number(url.pathname.split('/').pop());
        const category = url.searchParams.get('category') || 'CHARACTERS';
        const quiz = bank.find(q => category === 'READING' ? q.quizType === 'READING' :
          q.stageId === 's' + number && (category === 'WORDLE' || category === 'ASSEMBLY' ? q.quizType === category : q.quizType !== 'READING'));
        const values = JSON.parse(quiz.wrongAnswers);
        quiz.options = quiz.quizType === 'ASSEMBLY' ? [...values].reverse() : [quiz.correctAnswer, ...values];
        return Response.json({ success: true, stage: { title: 'UI test arena', category }, quizzes: [quiz] });
      }
      if (url.pathname === '/api/play/submit') {
        const body = JSON.parse(options.body);
        const quiz = bank.find(q => q.id === body.quizId);
        return Response.json({ success: true, isCorrect: body.selectedAnswer === quiz.correctAnswer, pointsEarned: 10 });
      }
      if (url.pathname.startsWith('/api/')) return Response.json({ success: true, news: [], bookmarks: [], wrongAnswers: [], user: {
        username: 'UI검증', points: 0, currentStreak: 0, maxStreak: 0, badges: '[]' }, wrongCount: 0, bookmarkCount: 0 });
      return originalFetch(input, options);
    };
  ` });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("!!document.querySelector('.mo-arena-btn button')"));
  await evaluate("localStorage.setItem('nihongo_quest_target_level','N1')");
  await evaluate("window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt: async () => {}, userChoice: Promise.resolve({outcome:'dismissed'}) }))");
  await waitFor(() => evaluate("!!document.querySelector('.pwa-install-button')"));
  for (const width of [320, 390, 768]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    await delay(300);
    const geometry = await evaluate(`(() => {
      const a = document.querySelector('.mo-arena-btn button');
      const b = document.querySelector('.pwa-install-button');
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
      return { aw:x.width, ah:x.height, bw:y.width, bh:y.height,
        overlap: x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top,
        label: getComputedStyle(document.querySelector('.pwa-install-label')).display,
        visible: getComputedStyle(a.parentElement).display !== 'none' };
    })()`);
    assert.equal(geometry.visible, true);
    assert.equal(geometry.overlap, false);
    assert.equal(geometry.label, 'none');
    for (const size of ['aw', 'ah', 'bw', 'bh']) assert.equal(geometry[size], 48);
    console.log(`PASS mobile ${width}px: 48px icons, no overlap`);
    const overview = await evaluate(`(() => {
      const card = document.querySelector('.dday-countdown-card');
      const sync = document.querySelector('.sync-panel-premium');
      const links = [...document.querySelectorAll('.dashboard-review-links a')];
      return { height: card.getBoundingClientRect().height,
        syncHeight: sync?.getBoundingClientRect().height,
        summary: getComputedStyle(document.querySelector('.count-timer-summary')).display,
        units: [...document.querySelectorAll('.count-timer-unit')].some(e => getComputedStyle(e).display !== 'none'),
        clippedLinks: links.some(e => e.scrollWidth > e.clientWidth + 1) };
    })()`);
    assert.ok(overview.height < 90, JSON.stringify(overview));
    if (overview.syncHeight) assert.ok(overview.syncHeight < 75, JSON.stringify(overview));
    assert.notEqual(overview.summary, 'none');
    assert.equal(overview.units, false);
    assert.equal(overview.clippedLinks, false, JSON.stringify(overview));
    console.log(`PASS mobile ${width}px: D-day ${overview.height}px, sync ${overview.syncHeight ?? 'hidden'}px, compact review links`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("document.querySelector('.mo-arena-btn button').click()");
  await waitFor(() => evaluate("!!document.querySelector('.modal-premium-content')"));
  assert.equal(await evaluate("!!document.querySelector('.modal-premium-content .difficulty-btn-grid')"), false);
  assert.equal(await evaluate("[...document.querySelectorAll('.modal-premium-content button')].filter(b => ['문자·어휘','문법·문장 구성','청해','독해'].some(name => b.textContent.includes(name))).length"), 4);
  await evaluate("[...document.querySelectorAll('.modal-premium-content button')].find(b => b.textContent.includes('문자·어휘')).click()");
  await waitFor(() => evaluate("location.pathname.startsWith('/play/')"));
  assert.equal(await evaluate("location.search.includes('difficulty=')"), false);
  assert.equal(await evaluate("!!document.querySelector('.pwa-install-button')"), false);
  console.log('PASS mobile N1: course picker, then direct play without difficulty');
  await send('Page.navigate', { url: `${baseUrl}/bookmarks` });
  await waitFor(() => evaluate("document.body?.textContent.includes('단어장')"));
  await evaluate("window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt: async () => {}, userChoice: Promise.resolve({outcome:'dismissed'}) }))");
  await delay(300);
  assert.equal(await evaluate("!!document.querySelector('.pwa-install-button')"), false);
  console.log('PASS install prompt: hidden on play and bookmarks');
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("!!document.querySelector('.mo-arena-btn button')"));
  assert.equal(await evaluate("document.querySelectorAll('.arena-card-wrapper').length"), 4);
  for (const width of [900, 1280, 1536]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await delay(300);
    const sizes = await evaluate(`(() => {
      const boxes = selector => [...document.querySelectorAll(selector)].map(e => e.getBoundingClientRect().height);
      return { removedCards: document.querySelectorAll('.info-card-wrapper').length,
        review: boxes('.dashboard-review-links'), arena: boxes('.arena-card-wrapper'),
        arenaFirst: !!(document.querySelector('.arena-section-container').compareDocumentPosition(document.querySelector('.nhk-news-briefing-card')) & Node.DOCUMENT_POSITION_FOLLOWING),
        timer: document.querySelector('.count-timer-value').getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > innerWidth };
    })()`);
    assert.equal(sizes.removedCards, 0);
    assert.ok(sizes.review.every(height => height <= 64), JSON.stringify(sizes));
    assert.ok(sizes.arena.every(height => height <= 270), JSON.stringify(sizes));
    assert.equal(sizes.arenaFirst, true);
    assert.equal(sizes.timer, 32);
    assert.equal(sizes.overflow, false);
    console.log(`PASS desktop ${width}px: review ${Math.max(...sizes.review)}px, arena ${Math.max(...sizes.arena)}px; no profile/streak cards, arena above news, no overflow`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate("document.querySelector('.arena-card-btn').click()");
  await waitFor(() => evaluate("location.pathname.startsWith('/play/')"));
  assert.equal(await evaluate("location.search.includes('difficulty=')"), false);
  console.log('PASS desktop N1: direct play');
  await evaluate("localStorage.setItem('nihongo_quest_target_level','BEGINNER')");
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("document.body?.textContent.includes('초보 스타터 아레나')"));
  await evaluate("[...document.querySelectorAll('.arena-card-wrapper')].find(c => c.textContent.includes('기초 문자')).querySelector('button').click()");
  await waitFor(() => evaluate("!!document.querySelector('.difficulty-btn-grid')"));
  assert.equal(await evaluate("document.querySelectorAll('.difficulty-btn-grid button').length"), 3);
  console.log('PASS beginner: difficulty selection preserved');
  await send('Page.navigate', { url: `${baseUrl}/play/5?jlptLevel=N1&category=ASSEMBLY` });
  await waitFor(() => evaluate("document.body?.textContent.includes('조립 보드')"));
  const answer = bank.find(q => q.quizType === 'ASSEMBLY').correctAnswer;
  assert.equal(await evaluate(`document.body.innerText.includes(${JSON.stringify(answer)})`), false);
  console.log('PASS assembly: full answer is hidden before submission');
  for (const [number, category] of [[2, 'VOCAB'], [3, 'GRAMMAR'], [4, 'LISTENING'], [7, 'READING']]) {
    await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `${baseUrl}/play/${number}?jlptLevel=N1&category=${category}` });
    await waitFor(() => evaluate("!!document.querySelector('.options-grid button')"));
    const textLayout = await evaluate(`(() => {
      const options = [...document.querySelectorAll('.options-grid button')];
      return { wordBreak: getComputedStyle(options[0]).wordBreak,
        overflow: options.some(el => el.scrollWidth > el.clientWidth + 1),
        boundaries: document.querySelectorAll('.play-arena-grid wbr').length };
    })()`);
    assert.equal(textLayout.wordBreak, 'keep-all');
    assert.equal(textLayout.overflow, false, JSON.stringify(textLayout));
    assert.ok(textLayout.boundaries > 0);
    console.log(`PASS mobile 320px ${category}: keep-all, Japanese word boundaries, no clipped options`);
    if (category === 'READING') {
      assert.ok(await evaluate("document.querySelector('.reading-passage')?.innerText.length > 150"));
      await evaluate("document.querySelector('.options-grid button').click()");
      await waitFor(() => evaluate("document.body?.textContent.includes('정답입니다!')"));
      assert.ok(await evaluate("document.body.innerText.includes('설명:')"));
      console.log('PASS reading: passage, option submission and explanation');
    }
  }
} finally {
  socket?.close();
  chrome.kill();
}
