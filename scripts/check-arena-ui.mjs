// Run against a local production server. Requires Chrome and Node 22+.
// API requests are mocked: this check does not write learning records.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { buildN1Quizzes } from '../src/data/n1QualityQuizzes.mjs';
import { buildN1Exam } from '../src/data/n1Exam.mjs';
import { buildN1Expansion } from '../src/data/n1Expansion20261019.mjs';
import { buildBeginnerQuizzes } from '../src/data/beginnerRebuilt.mjs';

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
  const checkModalDrag = async (selector, desktop) => {
    await delay(350);
    const geometry = () => evaluate(`(() => { const m=document.querySelector(${JSON.stringify(selector)}); const r=m.getBoundingClientRect(); const h=m.querySelector('[data-modal-drag-handle]').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,cx:h.left+10,cy:h.top+10,vw:document.documentElement.clientWidth,vh:document.documentElement.clientHeight}; })()`);
    const before=await geometry();
    assert.ok(Math.abs(before.x+before.w/2-before.vw/2)<3,`horizontal center ${selector}: ${JSON.stringify(before)}`);
    assert.ok(Math.abs(before.y+before.h/2-before.vh/2)<3,`vertical center ${selector}`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.cx,y:before.cy});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:before.cx,y:before.cy});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',buttons:1,x:before.cx+60,y:before.cy+15});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:before.cx+60,y:before.cy+15});
    const after=await geometry();
    assert.ok(Math.abs(after.x-before.x-(desktop?60:0))<3,`drag x ${selector}`);
    assert.ok(Math.abs(after.y-before.y-(desktop?15:0))<3,`drag y ${selector}`);
    if(desktop){
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:after.cx,y:after.cy});
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',buttons:1,x:after.vw+1000,y:after.vh+1000});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:after.vw+1000,y:after.vh+1000});
      const bounded=await geometry();
      assert.ok(bounded.x>=-1&&bounded.y>=-1&&bounded.x+bounded.w<=bounded.vw+1&&bounded.y+bounded.h<=bounded.vh+1,`drag bounds ${selector}`);
    }
  };
  const stageIds = { 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' };
  const bank = [...buildN1Expansion(stageIds), ...buildN1Quizzes(stageIds), ...buildBeginnerQuizzes(stageIds)];
  const examItems = buildN1Exam({ 1: 's1', 2: 's2', 3: 's3', 4: 's4', 5: 's5' });
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const bank = ${JSON.stringify(bank)};
    const examItems = ${JSON.stringify(examItems)};
    let firstAnswers = {};
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (url.pathname === '/api/mock-exam') {
        const body = JSON.parse(options.body);
        const questions = examItems.map(q => ({ id:q.id, domain:q.domain, questionText:q.questionText, quizType:q.quizType,
          passage:q.quizType === 'READING' ? q.japaneseWord : '', audioText:q.quizType === 'LISTENING' ? q.japaneseWord : '',
          options:[q.correctAnswer,...JSON.parse(q.wrongAnswers)] }));
        if (body.action === 'start') return Response.json({token:'test-start',deadline:Date.now()+1200000,questions:questions.slice(0,15)});
        if (body.action === 'listening') { firstAnswers=body.answers; return Response.json({token:'test-second',deadline:Date.now()+600000,questions:questions.slice(15)}); }
        return Response.json({results:examItems.map(q=>({id:q.id,domain:q.domain,question:q.questionText,selected:({...firstAnswers,...body.answers})[q.id]||'',correct:({...firstAnswers,...body.answers})[q.id]===q.correctAnswer,answer:q.correctAnswer,explanation:q.hint}))});
      }
      if (url.pathname.startsWith('/api/stages/')) {
        const number = Number(url.pathname.split('/').pop());
        const category = url.searchParams.get('category') || 'CHARACTERS';
        const beginner = url.searchParams.get('jlptLevel') === 'BEGINNER';
        const difficulty = url.searchParams.get('difficulty') || 'EASY';
        const quiz = bank.find(q => (beginner ? q.jlptLevel === 'BEGINNER' && q.questionText.includes('[BEGINNER-'+difficulty+']') : q.jlptLevel !== 'BEGINNER') && (category === 'KANA' ? q.arenaCategory === 'KANA' : category === 'READING' ? q.quizType === 'READING' :
          q.stageId === 's' + number && (category === 'WORDLE' || category === 'ASSEMBLY' ? q.quizType === category : q.quizType !== 'READING')));
        const values = JSON.parse(quiz.wrongAnswers);
        quiz.options = quiz.quizType === 'ASSEMBLY' ? [...values].reverse() : [quiz.correctAnswer, ...values];
        return Response.json({ success: true, stage: { title: 'UI test arena', category }, quizzes: [quiz] });
      }
      if (url.pathname === '/api/play/submit') {
        const body = JSON.parse(options.body);
        const quiz = bank.find(q => q.id === body.quizId);
        return Response.json({ success: true, isCorrect: body.selectedAnswer === quiz.correctAnswer, pointsEarned: 10 });
      }
      if (url.pathname === '/api/bookmarks') return Response.json({success:true,bookmarks:[{id:'ui-word',word:'踏襲',reading:'とうしゅう',meaning:'기존 방식이나 방침을 그대로 따름'}]});
      if (url.pathname === '/api/wrong-notes') {const q=bank.find(q=>q.jlptLevel!=='BEGINNER'&&q.quizType==='MULTIPLE_CHOICE');return Response.json({success:true,wrongAnswers:[{id:'ui-note',quizId:q.id,reviewCount:1,lastFailed:'2026-10-01T00:00:00Z',isResolved:false,quiz:q}]});}
      if (url.pathname === '/api/sync') return Response.json({success:true,backupCode:'dGVzdC1iYWNrdXA=',rawJson:url.searchParams.get('type')==='bookmarks'?{bookmarks:[]}:{wrongAnswers:[]},addedCount:1});
      if (url.pathname === '/api/nhk-news') return Response.json({success:true,source:'the-news-api',news:[
        {title:'地域の図書館で新しい読書会が始まる',description:'地域の人々が本について語り合い、異なる見方を知るための読書会が始まります。',translation:'지역 도서관에서 새로운 독서 모임이 시작됩니다.',pubDate:'2026-10-20T00:00:00Z',sourceName:'UI検証',n1Words:[]},
        {title:'展覧会の予約方法を見直す動き',description:'来館者の意見をもとに案内方法を改善します。',pubDate:'2026-10-20T00:00:00Z',sourceName:'UI検証',n1Words:[]},
        {title:'地域の資料を次の世代へ引き継ぐ',description:'資料の保存と利用について考えます。',pubDate:'2026-10-20T00:00:00Z',sourceName:'UI検証',n1Words:[]}
      ]});
      if (url.pathname.startsWith('/api/')) return Response.json({ success: true, news: [], bookmarks: [], wrongAnswers: [], user: {
        username: 'UI검증', points: 0, currentStreak: 0, maxStreak: 0, badges: '[]' }, wrongCount: 0, bookmarkCount: 0 });
      return originalFetch(input, options);
    };
  ` });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("!!document.querySelector('.mo-arena-btn button')"));
  await evaluate("document.querySelector('.mobile-menu-trigger').click()");
  await waitFor(() => evaluate("!!document.querySelector('.quest-drawer')"));
  assert.equal(await evaluate("document.querySelectorAll('.drawer-track-switch [aria-pressed=true]').length"),1);
  await evaluate("document.querySelector('.drawer-close-btn').click()");
  await waitFor(() => evaluate("!document.querySelector('.quest-drawer')"));
  console.log('PASS mobile header: menu opens, active track is indicated, close works');
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
        visibleCourses: [...document.querySelectorAll('.arena-card-wrapper')].every(e=>e.getBoundingClientRect().height>0),
        overflow: document.documentElement.scrollWidth > innerWidth,
        units: [...document.querySelectorAll('.count-timer-unit')].some(e => getComputedStyle(e).display !== 'none'),
        clippedLinks: links.some(e => e.scrollWidth > e.clientWidth + 1) };
    })()`);
    assert.ok(overview.height < 110, JSON.stringify(overview));
    assert.equal(overview.syncHeight, undefined);
    assert.notEqual(overview.summary, 'none');
    assert.equal(overview.units, false);
    assert.equal(overview.visibleCourses,true);
    assert.equal(overview.overflow,false);
    assert.equal(overview.clippedLinks, false, JSON.stringify(overview));
    if(width===390){fs.mkdirSync('.local-backups',{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('.local-backups/dashboard-mobile.png',Buffer.from(shot.data,'base64'));}
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
  assert.equal(await evaluate("document.querySelectorAll('.arena-card-wrapper').length"), 5);
  for (const width of [900, 1280, 1536]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await delay(300);
    const sizes = await evaluate(`(() => {
      const boxes = selector => [...document.querySelectorAll(selector)].map(e => e.getBoundingClientRect().height);
      const banner=document.querySelector('.home-banner-wrapper').getBoundingClientRect();
      const dday=document.querySelector('.dday-countdown-card').getBoundingClientRect();
      return { removedCards: document.querySelectorAll('.info-card-wrapper').length,
        sameRow: banner.right<=dday.left && Math.abs((banner.top+banner.height/2)-(dday.top+dday.height/2))<3,
        review: boxes('.dashboard-review-links'), arena: boxes('.arena-card-wrapper'),
        arenaFirst: !!(document.querySelector('.arena-section-container').compareDocumentPosition(document.querySelector('.nhk-news-briefing-card')) & Node.DOCUMENT_POSITION_FOLLOWING),
        timer: document.querySelector('.count-timer-value').getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > innerWidth };
    })()`);
    assert.equal(sizes.removedCards, 0);
    assert.equal(sizes.review.length,0);
    assert.equal(sizes.sameRow,true,JSON.stringify(sizes));
    assert.ok(sizes.arena.every(height => height <= 270), JSON.stringify(sizes));
    assert.equal(sizes.arenaFirst, true);
    assert.equal(sizes.timer, 0);
    assert.equal(sizes.overflow, false);
    const header=await evaluate(`(() => {const r=s=>document.querySelector(s).getBoundingClientRect();const logo=r('.header-logo'),nav=r('.header-nav'),tools=r('.header-btns');return {overlap:logo.right>nav.left||nav.right>tools.left,active:document.querySelector('.header-nav [aria-current=page]')?.textContent.trim(),track:document.querySelectorAll('.target-level-pill-switch [aria-pressed=true]').length};})()`);
    assert.equal(header.overlap,false,JSON.stringify(header));
    assert.equal(header.active,'메인');assert.equal(header.track,1);
    if(width===1280){fs.mkdirSync('.local-backups',{recursive:true}); const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('.local-backups/dashboard-desktop.png',Buffer.from(shot.data,'base64'));}
    console.log(`PASS desktop ${width}px: intro and D-day in one row, no duplicate review links, no overflow`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate("document.querySelector('.nhk-news-briefing-card').scrollIntoView()");
  await waitFor(() => evaluate("document.querySelectorAll('.nhk-news-item-trigger').length===3"));
  assert.equal(await evaluate("document.querySelector('.news-item-number').textContent"),'01');
  await evaluate("document.querySelector('.nhk-news-item-trigger').click()");
  await waitFor(() => evaluate("!!document.querySelector('.news-detail-modal')"));
  await checkModalDrag('.news-detail-modal',true);
  await evaluate("document.querySelector('.news-detail-modal-close').click(); window.scrollTo(0,0)");
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate("document.querySelector('.nhk-news-briefing-card').scrollIntoView()");
  assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth"),false);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.nhk-news-list')).gridTemplateColumns.split(' ').length"),1);
  const newsShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync('.local-backups/dashboard-news-mobile.png',Buffer.from(newsShot.data,'base64'));
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate("window.scrollTo(0,0)");
  console.log('PASS news: numbered list, feature article, detail popup and desktop dragging');
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('설정 & 학습 도구')).click()");
  await waitFor(() => evaluate("!!document.querySelector('.tools-dropdown a[href=\"/wrong-notes\"]')"));
  assert.ok(await evaluate("!!document.querySelector('.tools-dropdown a[href=\"/bookmarks\"]')"));
  await evaluate("document.body.click()");
  console.log('PASS desktop: review links moved into learning tools');
  await evaluate("document.querySelector('.arena-card-btn').click()");
  await waitFor(() => evaluate("location.pathname.startsWith('/play/')"));
  assert.equal(await evaluate("location.search.includes('difficulty=')"), false);
  console.log('PASS desktop N1: direct play');
  await evaluate("localStorage.setItem('nihongo_quest_target_level','BEGINNER')");
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("document.body?.textContent.includes('초보 스타터 아레나')"));
  await evaluate("document.querySelector('.nhk-news-briefing-card').scrollIntoView()");
  await waitFor(() => evaluate("document.querySelectorAll('.nhk-news-item-trigger').length === 5"));
  assert.equal(await evaluate("new Set([...document.querySelectorAll('.nhk-news-item-title')].map(x=>x.textContent)).size"), 5);
  await evaluate("(() => { const saved=Math.random; try { Math.random=()=>0; document.querySelector('[aria-label=\"회화 5개 다시 뽑기\"]').click(); } finally { Math.random=saved; } })()");
  await delay(100);
  const firstConversations = await evaluate("[...document.querySelectorAll('.nhk-news-item-title')].map(x=>x.textContent)");
  await evaluate("(() => { const saved=Math.random; try { Math.random=()=>0.999999; document.querySelector('[aria-label=\"회화 5개 다시 뽑기\"]').click(); } finally { Math.random=saved; } })()");
  await waitFor(() => evaluate("document.querySelector('.nhk-news-item-title')?.textContent.includes('차슈 추가')"));
  const nextConversations = await evaluate("[...document.querySelectorAll('.nhk-news-item-title')].map(x=>x.textContent)");
  assert.equal(nextConversations.length, 5);
  assert.notDeepEqual(nextConversations, firstConversations);
  console.log('PASS beginner conversations: five distinct examples and redraw');
  await evaluate("[...document.querySelectorAll('button')].find(button => button.textContent.includes('설정 & 학습 도구')).click()");
  assert.ok(await evaluate("!!document.querySelector('.tools-dropdown a[href=\"/?practiceWriting=1\"]')"));
  await evaluate("document.body.click()");
  assert.equal(await evaluate("document.querySelectorAll('.arena-card-wrapper').length"), 5);
  await evaluate("[...document.querySelectorAll('.arena-card-wrapper')].find(c => c.textContent.includes('처음 문자 익히기')).querySelector('button').click()");
  await waitFor(() => evaluate("document.body.textContent.includes('히라가나·가타카나 문자표 보기')"));
  assert.equal(await evaluate("!!document.querySelector('.difficulty-btn-grid')"),false);
  await evaluate("[...document.querySelectorAll('.modal-premium-content button')].find(b=>b.textContent.includes('아레나 입장')).click()");
  await waitFor(() => evaluate("location.pathname === '/play/8' && !!document.querySelector('.options-grid button')"));
  assert.equal(await evaluate("document.querySelectorAll('.options-grid button').length"),4);
  await evaluate("document.querySelector('.options-grid button').click()");
  await waitFor(() => evaluate("document.body.textContent.includes('정답입니다!')"));
  console.log('PASS kana: chart, no difficulty selection, DB question display and answer');
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("document.querySelectorAll('.arena-card-wrapper').length === 5"));
  await delay(500); // Allow Header's custom-event subscription to mount after navigation.
  await evaluate("[...document.querySelectorAll('.arena-card-wrapper')].find(c => c.textContent.includes('문자·어휘')).querySelector('button').click()");
  await waitFor(() => evaluate("!!document.querySelector('.difficulty-btn-grid')"));
  assert.equal(await evaluate("document.querySelectorAll('.difficulty-btn-grid button').length"), 3);
  await checkModalDrag('.modal-premium-content',true);
  console.log('PASS beginner: difficulty selection preserved');
  await evaluate("[...document.querySelectorAll('.modal-premium-content button')].find(b=>b.textContent==='닫기').click()");
  await evaluate("window.dispatchEvent(new CustomEvent('open-calligraphy-modal'))");
  await waitFor(() => evaluate("!!document.querySelector('.calligraphy-modal-window')"));
  await checkModalDrag('.calligraphy-modal-window',true);
  await evaluate("document.querySelector('.calligraphy-modal-close-btn').click()");
  console.log('PASS desktop popup drag: centered arena and handwriting; viewport bounds');
  await send('Page.navigate', { url: `${baseUrl}/play/7?jlptLevel=BEGINNER&category=READING&difficulty=EASY` });
  await waitFor(() => evaluate("!!document.querySelector('.reading-passage')"));
  await evaluate("document.querySelector('.options-grid button').click()");
  await waitFor(() => evaluate("document.body?.textContent.includes('정답입니다!')"));
  console.log('PASS beginner: four integrated courses, reading passage and answer submission');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: baseUrl });
  await waitFor(() => evaluate("!!document.querySelector('.mo-arena-btn button')"));
  await evaluate("document.querySelector('.mo-arena-btn button').click()");
  await waitFor(() => evaluate("!!document.querySelector('.modal-premium-content')"));
  assert.equal(await evaluate("!!document.querySelector('.difficulty-btn-grid')"),false);
  await evaluate("[...document.querySelectorAll('.modal-premium-content button')].find(b=>b.textContent.includes('문자·어휘')).click()");
  await waitFor(() => evaluate("!!document.querySelector('.difficulty-btn-grid')"));
  assert.equal(await evaluate("[...document.querySelectorAll('.modal-premium-content button')].filter(button => ['문자·어휘','문법·문장 구성','청해','독해'].some(name => button.textContent.includes(name))).length"),4);
  console.log('PASS mobile beginner: four-course picker and difficulty selection');
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
      assert.ok(await evaluate("document.querySelector('.reading-passage')?.innerText.length > 850"));
      await evaluate("document.querySelector('.options-grid button').click()");
      await waitFor(() => evaluate("document.body?.textContent.includes('정답입니다!')"));
      assert.ok(await evaluate("document.body.innerText.includes('설명:')"));
      console.log('PASS reading: passage, option submission and explanation');
    }
  }
  await send('Page.navigate', { url: `${baseUrl}/play/6?jlptLevel=N1&category=MOCK_EXAM` });
  await waitFor(() => evaluate("location.pathname === '/mock-exam'"));
  console.log('PASS old N1 mixed-practice URL: redirects to mock exam');
  await waitFor(() => evaluate("document.querySelector('.exam-intro button')?.disabled === false"));
  await evaluate("document.querySelector('.exam-intro button').click()");
  await waitFor(() => evaluate("document.querySelectorAll('.exam-question-nav button').length === 15"));
  assert.equal(await evaluate("!!document.querySelector('.exam-review')"), false);
  await evaluate("document.querySelector('.exam-options button').click(); document.querySelectorAll('.exam-question-nav button')[14].click()");
  await evaluate("document.querySelector('.exam-controls .glow-btn').click()");
  await waitFor(() => evaluate("document.querySelector('.exam-toolbar')?.textContent.includes('2부')"));
  assert.equal(await evaluate("!!document.querySelector('.exam-question-nav')"), false);
  for (let index=0; index<5; index++) {
    await evaluate("document.querySelector('.exam-options button').click()");
    await evaluate("document.querySelector('.exam-controls .glow-btn').click()");
    await delay(100);
  }
  await waitFor(() => evaluate("document.querySelectorAll('.exam-review').length === 20"));
  console.log('PASS mock exam: 15-question first part, locked listening, delayed 20-answer review');
  for(const width of [320,1280])for(const route of ['/bookmarks','/wrong-notes']){
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===320});
    await send('Page.navigate',{url:baseUrl+route});
    await waitFor(()=>evaluate("document.querySelectorAll('.library-page .wrong-note-card').length===1"));
    const layout=await evaluate("(() => {const c=document.querySelector('.library-page .wrong-note-card');return {overflow:document.documentElement.scrollWidth>innerWidth,shadow:getComputedStyle(c).boxShadow,heading:document.querySelector('.library-page h1').textContent.trim()};})()");
    assert.equal(layout.overflow,false,JSON.stringify(layout));assert.equal(layout.shadow,'none');
    assert.equal(layout.heading,route==='/bookmarks'?'단어장':'오답노트');
    await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});document.querySelector('.sync-hub-header').click()");
    await waitFor(()=>evaluate("!!document.querySelector('.export-code-btn')"));
    await evaluate("document.querySelector('.export-code-btn').click()");
    await waitFor(()=>evaluate("document.querySelector('.backup-code-input')?.value==='dGVzdC1iYWNrdXA='"));
    await evaluate("document.querySelector('.sync-hub-header').click()");
    if(route==='/bookmarks'){
      await evaluate("document.querySelector('.wrong-note-card').click()");
      await waitFor(()=>evaluate("!!document.querySelector('[data-draggable-modal]')"));
      await evaluate("[...document.querySelectorAll('[data-draggable-modal] button')].find(b=>b.textContent.trim()==='✕').click()");
      await evaluate("document.querySelector('.flashcard-switch input').click()");
      await waitFor(()=>evaluate("!!document.querySelector('.flashcard')"));
      await evaluate("document.querySelector('.flashcard').click()");
      await waitFor(()=>evaluate("!!document.querySelector('.flashcard.flipped')"));
      await delay(700);
      assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.flashcard')).transform"),'none');
      assert.equal(await evaluate("(() => {const p=document.querySelector('.flashcard-example-jp');return p.scrollWidth<=p.clientWidth+1;})()"),true);
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.flashcard-back')).overflowY"),'auto');
    }
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    fs.writeFileSync(`.local-backups/simple-${route.slice(1)}-${width}.png`,Buffer.from(shot.data,'base64'));
    console.log(`PASS simple UI ${width}px ${route}: populated cards, no overflow; library dialog and flashcard preserved`);
  }
  for(const theme of ['zen','cyber']){
    await evaluate(`document.documentElement.setAttribute('data-theme',${JSON.stringify(theme)}); document.documentElement.setAttribute('data-concept','retro')`);
    const style=await evaluate("(() => {const c=getComputedStyle(document.querySelector('.wrong-note-card')),b=getComputedStyle(document.querySelector('.wrong-note-card .outline-btn'));return {shadow:c.boxShadow,radius:c.borderRadius,buttonRadius:b.borderRadius,buttonShadow:b.boxShadow};})()");
    assert.equal(style.shadow,'none');assert.equal(style.radius,'12px');assert.equal(style.buttonRadius,'9px');assert.equal(style.buttonShadow,'none');
  }
  console.log('PASS light and dark themes: shared card/button shapes override decorative concepts');
} finally {
  socket?.close();
  chrome.kill();
}
