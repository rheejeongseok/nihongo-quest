import { NEWS_POOL } from "@/data/newsFallback.mjs";
import prisma from "@/lib/prisma";



// =========================================================================
// 🌸 [N1 PREMIUM NEWS POOL] 25개 다양한 시사 뉴스 풀
// 매 요청 시 랜덤 5개 추출 → 언제나 다른 뉴스 조합 제공
// 주제: 경제/기술/사회/환경/정치/국제/문화/재난/의료/교육
// =========================================================================


// Fisher-Yates 셔플 후 3개 랜덤 추출
function pickRandom5(arr) {
  return pickRandom(arr, 3);
}

function pickRandom(arr, count) {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// 간단한 XML 파서 함수
function parseNhkRss(xmlText) {
  const items = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
  if (!itemMatches) return null;
  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/);
    const linkMatch  = itemXml.match(/<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/);
    const descMatch  = itemXml.match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/);
    const dateMatch  = itemXml.match(/<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/pubDate>/);
    items.push({
      title:       (titleMatch?.[1] || titleMatch?.[2] || "").trim(),
      link:        (linkMatch?.[1]  || linkMatch?.[2]  || "").trim(),
      description: (descMatch?.[1]  || descMatch?.[2]  || "").trim(),
      pubDate:     (dateMatch?.[1]  || dateMatch?.[2]  || "").trim()
    });
  }
  return items.length > 0 ? items : null;
}

// 실시간 일본 뉴스에 N1 어휘 바인딩
async function enrichNewsWithN1Learning(newsList) {
  // =========================================================================
  // 🌸 N1 종합 어휘 풀 (160개+) — NHK 뉴스 주제별 필수 어휘
  // 정치·외교 / 경제·금융 / 사회·인구 / 기술·AI / 환경·기후 /
  // 의료·건강 / 재난·안전 / 교육·문화 / 법률·행정 / 기타 시사
  // =========================================================================
  const vocabularyPool = [

    // ── 🏛️ 정치·외교 ──
    { word: "懸念",       reading: "けねん",       meaning: "우려, 걱정" },
    { word: "是正",       reading: "ぜせい",       meaning: "시정 (올바르게 고침)" },
    { word: "模索",       reading: "もさく",       meaning: "모색" },
    { word: "推進",       reading: "すいしん",     meaning: "추진" },
    { word: "閣議決定",   reading: "かくぎけってい", meaning: "각의 결정 (국무회의 의결)" },
    { word: "首脳会談",   reading: "しゅのうかいだん", meaning: "정상 회담" },
    { word: "合意",       reading: "ごうい",       meaning: "합의" },
    { word: "解散",       reading: "かいさん",     meaning: "해산" },
    { word: "総選挙",     reading: "そうせんきょ", meaning: "총선거" },
    { word: "過半数",     reading: "かはんすう",   meaning: "과반수" },
    { word: "争点",       reading: "そうてん",     meaning: "쟁점" },
    { word: "政権交代",   reading: "せいけんこうたい", meaning: "정권 교체" },
    { word: "安全保障",   reading: "あんぜんほしょう", meaning: "안전 보장 (안보)" },
    { word: "防衛費",     reading: "ぼうえいひ",   meaning: "방위비" },
    { word: "同盟",       reading: "どうめい",     meaning: "동맹" },
    { word: "外交",       reading: "がいこう",     meaning: "외교" },
    { word: "制裁",       reading: "せいさい",     meaning: "제재" },
    { word: "批准",       reading: "ひじゅん",     meaning: "비준" },
    { word: "署名",       reading: "しょめい",     meaning: "서명" },
    { word: "対話",       reading: "たいわ",       meaning: "대화" },
    { word: "緊張",       reading: "きんちょう",   meaning: "긴장" },
    { word: "紛争",       reading: "ふんそう",     meaning: "분쟁" },
    { word: "停戦",       reading: "ていせん",     meaning: "정전, 휴전" },
    { word: "国際社会",   reading: "こくさいしゃかい", meaning: "국제 사회" },
    { word: "国連",       reading: "こくれん",     meaning: "유엔 (UN)" },
    { word: "表明",       reading: "ひょうめい",   meaning: "표명" },
    { word: "方針",       reading: "ほうしん",     meaning: "방침" },
    { word: "承認",       reading: "しょうにん",   meaning: "승인" },
    { word: "否決",       reading: "ひけつ",       meaning: "부결" },
    { word: "採択",       reading: "さいたく",     meaning: "채택" },

    // ── 💹 경제·금융 ──
    { word: "高騰",       reading: "こうとう",     meaning: "급등 (물가·가격이 급격히 오름)" },
    { word: "急騰",       reading: "きゅうとう",   meaning: "급등 (갑작스러운 폭등)" },
    { word: "急落",       reading: "きゅうらく",   meaning: "급락" },
    { word: "円安",       reading: "えんやす",     meaning: "엔저 (엔화 가치 하락)" },
    { word: "円高",       reading: "えんだか",     meaning: "엔고 (엔화 가치 상승)" },
    { word: "金利",       reading: "きんり",       meaning: "금리" },
    { word: "利上げ",     reading: "りあげ",       meaning: "금리 인상" },
    { word: "利下げ",     reading: "りさげ",       meaning: "금리 인하" },
    { word: "景気",       reading: "けいき",       meaning: "경기" },
    { word: "物価",       reading: "ぶっか",       meaning: "물가" },
    { word: "インフレ",   reading: "いんふれ",     meaning: "인플레이션" },
    { word: "デフレ",     reading: "でふれ",       meaning: "디플레이션" },
    { word: "財政",       reading: "ざいせい",     meaning: "재정" },
    { word: "財源",       reading: "ざいげん",     meaning: "재원" },
    { word: "補助金",     reading: "ほじょきん",   meaning: "보조금" },
    { word: "税収",       reading: "ぜいしゅう",   meaning: "세수 (세금 수입)" },
    { word: "赤字",       reading: "あかじ",       meaning: "적자" },
    { word: "黒字",       reading: "くろじ",       meaning: "흑자" },
    { word: "倒産",       reading: "とうさん",     meaning: "도산, 파산" },
    { word: "再建",       reading: "さいけん",     meaning: "재건" },
    { word: "輸出",       reading: "ゆしゅつ",     meaning: "수출" },
    { word: "輸入",       reading: "ゆにゅう",     meaning: "수입" },
    { word: "貿易",       reading: "ぼうえき",     meaning: "무역" },
    { word: "投資",       reading: "とうし",       meaning: "투자" },
    { word: "株価",       reading: "かぶか",       meaning: "주가" },
    { word: "国産化",     reading: "こくさんか",   meaning: "국산화" },
    { word: "供給",       reading: "きょうきゅう", meaning: "공급" },
    { word: "需要",       reading: "じゅよう",     meaning: "수요" },
    { word: "経済成長",   reading: "けいざいせいちょう", meaning: "경제 성장" },
    { word: "雇用",       reading: "こよう",       meaning: "고용" },

    // ── 🏘️ 사회·인구 ──
    { word: "深刻",       reading: "しんこく",     meaning: "심각" },
    { word: "急増",       reading: "きゅうぞう",   meaning: "급증" },
    { word: "高齢化",     reading: "こうれいか",   meaning: "고령화" },
    { word: "少子化",     reading: "しょうしか",   meaning: "저출생(저출산) 현상" },
    { word: "人口減少",   reading: "じんこうげんしょう", meaning: "인구 감소" },
    { word: "就業率",     reading: "しゅうぎょうりつ", meaning: "취업률" },
    { word: "労働力",     reading: "ろうどうりょく", meaning: "노동력" },
    { word: "人手不足",   reading: "ひとでぶそく", meaning: "인력 부족" },
    { word: "格差",       reading: "かくさ",       meaning: "격차" },
    { word: "貧困",       reading: "ひんこん",     meaning: "빈곤" },
    { word: "孤立",       reading: "こりつ",       meaning: "고립" },
    { word: "移民",       reading: "いみん",       meaning: "이민" },
    { word: "外国人労働者", reading: "がいこくじんろうどうしゃ", meaning: "외국인 노동자" },
    { word: "社会保障",   reading: "しゃかいほしょう", meaning: "사회 보장" },
    { word: "年金",       reading: "ねんきん",     meaning: "연금" },
    { word: "介護",       reading: "かいご",       meaning: "요양, 간병" },
    { word: "福祉",       reading: "ふくし",       meaning: "복지" },
    { word: "待機児童",   reading: "たいきじどう", meaning: "대기 아동 (보육원 대기)" },
    { word: "過疎地",     reading: "かそち",       meaning: "과소 지역 (인구 희소)" },
    { word: "地方創生",   reading: "ちほうそうせい", meaning: "지방 창생 (지방 활성화)" },

    // ── 🤖 기술·AI ──
    { word: "普及",       reading: "ふきゅう",     meaning: "보급" },
    { word: "活用",       reading: "かつよう",     meaning: "활용" },
    { word: "導入",       reading: "どうにゅう",   meaning: "도입" },
    { word: "実用化",     reading: "じつようか",   meaning: "실용화" },
    { word: "本格化",     reading: "ほんかくか",   meaning: "본격화" },
    { word: "革新",       reading: "かくしん",     meaning: "혁신" },
    { word: "開発",       reading: "かいはつ",     meaning: "개발" },
    { word: "研究",       reading: "けんきゅう",   meaning: "연구" },
    { word: "知的財産",   reading: "ちてきざいさん", meaning: "지적 재산" },
    { word: "著作権",     reading: "ちょさくけん", meaning: "저작권" },
    { word: "自動運転",   reading: "じどううんてん", meaning: "자율주행" },
    { word: "量子",       reading: "りょうし",     meaning: "양자 (퀀텀)" },
    { word: "半導体",     reading: "はんどうたい", meaning: "반도체" },
    { word: "最先端",     reading: "さいせんたん", meaning: "최첨단" },
    { word: "サイバー攻撃", reading: "さいばーこうげき", meaning: "사이버 공격" },
    { word: "情報漏洩",   reading: "じょうほうろうえい", meaning: "정보 유출" },
    { word: "デジタル化", reading: "でじたるか",   meaning: "디지털화" },
    { word: "規制",       reading: "きせい",       meaning: "규제" },
    { word: "標的",       reading: "ひょうてき",   meaning: "표적" },
    { word: "障害",       reading: "しょうがい",   meaning: "장애 (시스템 오류·정지)" },

    // ── 🌱 환경·기후 ──
    { word: "気候変動",   reading: "きこうへんどう", meaning: "기후 변화" },
    { word: "温暖化",     reading: "おんだんか",   meaning: "온난화" },
    { word: "温室効果ガス", reading: "おんしつこうかがす", meaning: "온실가스" },
    { word: "排出量",     reading: "はいしゅつりょう", meaning: "배출량" },
    { word: "削減",       reading: "さくげん",     meaning: "삭감" },
    { word: "再生可能エネルギー", reading: "さいせいかのうえねるぎー", meaning: "재생 가능 에너지" },
    { word: "脱炭素",     reading: "だつたんそ",   meaning: "탈탄소 (탄소 중립)" },
    { word: "洪水",       reading: "こうずい",     meaning: "홍수" },
    { word: "猛暑",       reading: "もうしょ",     meaning: "폭염" },
    { word: "熱中症",     reading: "ねっちゅうしょう", meaning: "열사병" },
    { word: "干ばつ",     reading: "かんばつ",     meaning: "가뭄" },
    { word: "台風",       reading: "たいふう",     meaning: "태풍" },
    { word: "豪雨",       reading: "ごうう",       meaning: "호우, 폭우" },
    { word: "環境負荷",   reading: "かんきょうふか", meaning: "환경 부하" },
    { word: "持続可能",   reading: "じぞくかのう", meaning: "지속 가능" },
    { word: "前倒し",     reading: "まえだおし",   meaning: "예정보다 앞당김" },
    { word: "自然災害",   reading: "しぜんさいがい", meaning: "자연재해" },
    { word: "生態系",     reading: "せいたいけい", meaning: "생태계" },

    // ── 🏥 의료·건강 ──
    { word: "感染症",     reading: "かんせんしょう", meaning: "감염증" },
    { word: "ウイルス",   reading: "ういるす",     meaning: "바이러스" },
    { word: "ワクチン",   reading: "わくちん",     meaning: "백신" },
    { word: "接種",       reading: "せっしゅ",     meaning: "접종" },
    { word: "医療",       reading: "いりょう",     meaning: "의료" },
    { word: "治療",       reading: "ちりょう",     meaning: "치료" },
    { word: "免疫",       reading: "めんえき",     meaning: "면역" },
    { word: "薬剤",       reading: "やくざい",     meaning: "약제" },
    { word: "臨床試験",   reading: "りんしょうしけん", meaning: "임상 시험" },
    { word: "承認",       reading: "しょうにん",   meaning: "승인" },
    { word: "画期的",     reading: "かっきてき",   meaning: "획기적" },
    { word: "早期発見",   reading: "そうきはっけん", meaning: "조기 발견" },
    { word: "脆弱",       reading: "ぜいじゃく",   meaning: "취약" },
    { word: "死者数",     reading: "ししゃすう",   meaning: "사망자 수" },
    { word: "重症化",     reading: "じゅうしょうか", meaning: "중증화" },
    { word: "公衆衛生",   reading: "こうしゅうえいせい", meaning: "공중 보건" },

    // ── 🚨 재난·안전 ──
    { word: "地震",       reading: "じしん",       meaning: "지진" },
    { word: "津波",       reading: "つなみ",       meaning: "쓰나미" },
    { word: "避難",       reading: "ひなん",       meaning: "대피, 피난" },
    { word: "被災者",     reading: "ひさいしゃ",   meaning: "피재자 (재해 피해자)" },
    { word: "仮設住宅",   reading: "かせつじゅうたく", meaning: "임시 주택" },
    { word: "復旧",       reading: "ふっきゅう",   meaning: "복구" },
    { word: "発令",       reading: "はつれい",     meaning: "발령" },
    { word: "備蓄",       reading: "びちく",       meaning: "비축" },
    { word: "臨時情報",   reading: "りんじじょうほう", meaning: "임시 정보 (긴급 발표)" },
    { word: "相次ぐ",     reading: "あいつぐ",     meaning: "잇따르다" },
    { word: "警戒",       reading: "けいかい",     meaning: "경계" },
    { word: "安否",       reading: "あんぴ",       meaning: "안부, 생사 확인" },
    { word: "救助",       reading: "きゅうじょ",   meaning: "구조" },
    { word: "行方不明",   reading: "ゆくえふめい", meaning: "행방불명" },

    // ── 📚 교육·문화 ──
    { word: "必修",       reading: "ひっしゅう",   meaning: "필수 (이수가 의무인 과목)" },
    { word: "育成",       reading: "いくせい",     meaning: "육성" },
    { word: "告示",       reading: "こくじ",       meaning: "고시 (공식 발표)" },
    { word: "授与",       reading: "じゅよ",       meaning: "수여" },
    { word: "功績",       reading: "こうせき",     meaning: "공적" },
    { word: "確立",       reading: "かくりつ",     meaning: "확립" },
    { word: "基盤",       reading: "きばん",       meaning: "기반" },
    { word: "インバウンド", reading: "いんばうんど", meaning: "인바운드 (방일 외국인 소비)" },
    { word: "文化財",     reading: "ぶんかざい",   meaning: "문화재" },
    { word: "世界遺産",   reading: "せかいいさん", meaning: "세계 유산" },
    { word: "継承",       reading: "けいしょう",   meaning: "계승" },

    // ── ⚖️ 법률·행정 ──
    { word: "不正",       reading: "ふせい",       meaning: "부정 (불공정·부당한 행위)" },
    { word: "透明性",     reading: "とうめいせい", meaning: "투명성" },
    { word: "抜本的",     reading: "ばっぽんてき", meaning: "근본적" },
    { word: "法整備",     reading: "ほうせいび",   meaning: "법제도 정비" },
    { word: "規制緩和",   reading: "きせいかんわ", meaning: "규제 완화" },
    { word: "策定",       reading: "さくてい",     meaning: "책정 (방안을 세움)" },
    { word: "義務化",     reading: "ぎむか",       meaning: "의무화" },
    { word: "徴収",       reading: "ちょうしゅう", meaning: "징수" },
    { word: "充当",       reading: "じゅうとう",   meaning: "충당 (비용을 특정 목적에 사용)" },
    { word: "是非",       reading: "ぜひ",         meaning: "시비, 옳고 그름" },
    { word: "裁判",       reading: "さいばん",     meaning: "재판" },
    { word: "判決",       reading: "はんけつ",     meaning: "판결" },
    { word: "訴訟",       reading: "そしょう",     meaning: "소송" },
    { word: "摘発",       reading: "てきはつ",     meaning: "적발" },
    { word: "逮捕",       reading: "たいほ",       meaning: "체포" },
    { word: "捜査",       reading: "そうさ",       meaning: "수사" },

    // ── 📰 시사 표현·동사·부사 ──
    { word: "影響",       reading: "えいきょう",   meaning: "영향" },
    { word: "対策",       reading: "たいさく",     meaning: "대책" },
    { word: "支援",       reading: "しえん",       meaning: "지원" },
    { word: "維持",       reading: "いじ",         meaning: "유지" },
    { word: "確保",       reading: "かくほ",       meaning: "확보" },
    { word: "強化",       reading: "きょうか",     meaning: "강화" },
    { word: "拡充",       reading: "かくじゅう",   meaning: "확충" },
    { word: "緩和",       reading: "かんわ",       meaning: "완화" },
    { word: "急務",       reading: "きゅうむ",     meaning: "급무 (시급한 사안)" },
    { word: "懸案",       reading: "けんあん",     meaning: "현안" },
    { word: "課題",       reading: "かだい",       meaning: "과제" },
    { word: "取り組み",   reading: "とりくみ",     meaning: "대처, 노력" },
    { word: "見直し",     reading: "みなおし",     meaning: "재검토" },
    { word: "打撃",       reading: "だげき",       meaning: "타격" },
    { word: "事態",       reading: "じたい",       meaning: "사태" },
    { word: "局面",       reading: "きょくめん",   meaning: "국면" },
    { word: "動向",       reading: "どうこう",     meaning: "동향" },
    { word: "展望",       reading: "てんぼう",     meaning: "전망" },
    { word: "懸命",       reading: "けんめい",     meaning: "열심히, 필사적으로" },
    { word: "一方",       reading: "いっぽう",     meaning: "한편, 반면" },
    { word: "相次いで",   reading: "あいついで",   meaning: "잇달아" },
    { word: "大幅",       reading: "おおはば",     meaning: "대폭" },
    { word: "急速",       reading: "きゅうそく",   meaning: "급속" },
    { word: "本格的",     reading: "ほんかくてき", meaning: "본격적" },
    { word: "積極的",     reading: "せっきょくてき", meaning: "적극적" },
    { word: "抜本",       reading: "ばっぽん",     meaning: "근본 (발본)" },
    { word: "懸念される", reading: "けねんされる", meaning: "우려된다" },
    { word: "注目",       reading: "ちゅうもく",   meaning: "주목" },
    { word: "期待",       reading: "きたい",       meaning: "기대" },
    { word: "実現",       reading: "じつげん",     meaning: "실현" }
  ];

  const fallbackPool = pickRandom5(NEWS_POOL);

  // ① 전체 기사 설명을 DeepL로 배치 번역
  const textsToTranslate = newsList.map(item => item.description);
  const translations = await translateWithDeepL(textsToTranslate);

  return newsList.map((item, idx) => {
    const textToSearch = item.title + " " + item.description;

    // ② 실제 기사 본문에서 vocabularyPool(165개) 단어 매칭
    let n1Words = vocabularyPool.filter(v => textToSearch.includes(v.word));

    // ③ 2개 미만이면 fallback 기사 단어로 n1Words만 보충
    if (n1Words.length < 2) {
      const fb = fallbackPool[idx % fallbackPool.length];
      n1Words = [
        ...n1Words,
        ...fb.n1Words.filter(fw => !n1Words.some(w => w.word === fw.word))
      ];
    }
    n1Words = n1Words.slice(0, 5);

    // ④ 번역: DeepL 성공 시 한국어 번역, 실패 시 원문 안내
    const koTranslation = translations[idx];
    const translation = koTranslation
      ? `📡 DeepL 실시간 번역\n\n${koTranslation}`
      : `📡 실시간 일본 뉴스 원문입니다. 위 N1 어휘를 힌트 삼아 직접 읽어보세요!\n\n[원문 지문]\n${item.description}`;

    return {
      ...item,
      translation,
      n1Words
    };
  });
}

// =========================================================================
// 🌐 DeepL 배치 번역 헬퍼
// 최대 50개 텍스트를 단 1회 API 호출로 번역 (비용·속도 최적화)
// free 플랜 키(끝이 :fx)와 pro 플랜 자동 감지
// =========================================================================
async function translateWithDeepL(texts) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.warn('[DeepL] DEEPL_API_KEY가 설정되지 않았습니다.');
    return texts.map(() => null);
  }

  // free 플랜: 키가 ':fx'로 끝남
  const baseUrl = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com'
    : 'https://api.deepl.com';

  try {
    const res = await fetch(`${baseUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texts,          // 배열로 한 번에 전송
        source_lang: 'JA',
        target_lang: 'KO'
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`DeepL HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return data.translations.map(t => t.text);

  } catch (e) {
    console.error('[DeepL] 번역 실패, 원문으로 대체:', e.message);
    return texts.map(() => null);  // null → 원문 fallback
  }
}

const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
const NEWS_POOL_SIZE = 100;
const NEWS_DISPLAY_COUNT = 10;
const NEWS_MAX_PAGES = 40;
const NEWS_PAGE_BATCH_SIZE = 5;
const NEWS_REFRESH_LEASE_MS = 10 * 60 * 1000;
const NEWS_REFRESH_STATE_ID = "japan-daily";
let cachedNewsPayload = null;
let newsCacheExpiresAt = 0;
let inFlightNewsRequest = null;

function getKoreanDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function toNewsRecord(item, batchDate) {
  if (!item?.uuid || typeof item.title !== "string" || typeof item.url !== "string") return null;

  const parsedDate = item.published_at ? new Date(item.published_at) : null;
  return {
    id: item.uuid,
    title: item.title.trim(),
    description: (item.description || item.snippet || item.title).trim(),
    link: item.url,
    imageUrl: item.image_url || null,
    pubDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
    sourceName: item.source || "일본 뉴스",
    batchDate
  };
}

async function fetchTheNewsApiPage(page, batchDate) {
  const apiToken = process.env.THE_NEWS_API_TOKEN;
  if (!apiToken) {
    throw new Error("THE_NEWS_API_TOKEN이 설정되지 않았습니다");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const params = new URLSearchParams({
      api_token: apiToken,
      locale: "jp",
      language: "ja",
      limit: "3",
      page: String(page)
    });
    const response = await fetch(`https://api.thenewsapi.com/v1/news/top?${params}`, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`The News API 응답 불량: ${response.status} ${errorBody.slice(0, 200)}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.data)
      ? payload.data.map(item => toNewsRecord(item, batchDate)).filter(Boolean)
      : [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchDailyNewsPool(batchDate) {
  const uniqueArticles = new Map();
  const seenLinks = new Set();

  for (let firstPage = 1; firstPage <= NEWS_MAX_PAGES && uniqueArticles.size < NEWS_POOL_SIZE; firstPage += NEWS_PAGE_BATCH_SIZE) {
    const pages = Array.from(
      { length: Math.min(NEWS_PAGE_BATCH_SIZE, NEWS_MAX_PAGES - firstPage + 1) },
      (_, index) => firstPage + index
    );
    const results = await Promise.allSettled(
      pages.map(page => fetchTheNewsApiPage(page, batchDate))
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.warn("[The News API] 페이지 수집 실패:", result.reason?.message || result.reason);
        continue;
      }
      for (const article of result.value) {
        if (!article.title || !article.link || uniqueArticles.has(article.id) || seenLinks.has(article.link)) continue;
        uniqueArticles.set(article.id, article);
        seenLinks.add(article.link);
      }
    }
  }

  if (uniqueArticles.size < NEWS_POOL_SIZE) {
    throw new Error(`일일 뉴스가 ${uniqueArticles.size}건만 수집되어 기존 데이터를 유지합니다`);
  }

  return [...uniqueArticles.values()]
    .sort((a, b) => (b.pubDate?.getTime() || 0) - (a.pubDate?.getTime() || 0))
    .slice(0, NEWS_POOL_SIZE);
}

async function acquireDailyRefresh(dateKey) {
  await prisma.newsRefreshState.upsert({
    where: { id: NEWS_REFRESH_STATE_ID },
    create: { id: NEWS_REFRESH_STATE_ID },
    update: {}
  });

  const staleLease = new Date(Date.now() - NEWS_REFRESH_LEASE_MS);
  const result = await prisma.newsRefreshState.updateMany({
    where: {
      id: NEWS_REFRESH_STATE_ID,
      AND: [
        {
          OR: [
            { dateKey: { not: dateKey } },
            { articleCount: { lt: NEWS_POOL_SIZE } }
          ]
        },
        {
          OR: [
            { refreshStartedAt: null },
            { refreshStartedAt: { lt: staleLease } }
          ]
        }
      ]
    },
    data: {
      refreshStartedAt: new Date(),
      lastError: null
    }
  });
  return result.count === 1;
}

async function saveDailyNewsPool(articles, dateKey) {
  const refreshedAt = new Date();
  await prisma.$transaction([
    prisma.japaneseNews.deleteMany(),
    prisma.japaneseNews.createMany({ data: articles }),
    prisma.newsRefreshState.update({
      where: { id: NEWS_REFRESH_STATE_ID },
      data: {
        dateKey,
        refreshedAt,
        refreshStartedAt: null,
        articleCount: articles.length,
        lastError: null
      }
    })
  ]);
}

async function waitForDailyNewsPool(dateKey) {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const [state, articles] = await Promise.all([
      prisma.newsRefreshState.findUnique({ where: { id: NEWS_REFRESH_STATE_ID } }),
      prisma.japaneseNews.findMany({ orderBy: { pubDate: "desc" } })
    ]);
    if (state?.dateKey === dateKey && articles.length >= NEWS_POOL_SIZE) return articles;
  }
  return [];
}

async function ensureDailyNewsPool() {
  const dateKey = getKoreanDateKey();
  const [state, storedArticles] = await Promise.all([
    prisma.newsRefreshState.findUnique({ where: { id: NEWS_REFRESH_STATE_ID } }),
    prisma.japaneseNews.findMany({ orderBy: { pubDate: "desc" } })
  ]);

  if (state?.dateKey === dateKey && storedArticles.length >= NEWS_POOL_SIZE) {
    return { articles: storedArticles, dateKey, stale: false };
  }

  const acquired = await acquireDailyRefresh(dateKey);
  if (!acquired) {
    if (storedArticles.length >= NEWS_DISPLAY_COUNT) {
      return { articles: storedArticles, dateKey: state?.dateKey || dateKey, stale: true };
    }
    const refreshedArticles = await waitForDailyNewsPool(dateKey);
    if (refreshedArticles.length >= NEWS_DISPLAY_COUNT) {
      return { articles: refreshedArticles, dateKey, stale: false };
    }
    throw new Error("다른 서버에서 일일 뉴스를 갱신 중입니다");
  }

  try {
    const freshArticles = await fetchDailyNewsPool(dateKey);
    await saveDailyNewsPool(freshArticles, dateKey);
    return { articles: freshArticles, dateKey, stale: false };
  } catch (error) {
    await prisma.newsRefreshState.update({
      where: { id: NEWS_REFRESH_STATE_ID },
      data: {
        refreshStartedAt: null,
        lastError: String(error.message || error).slice(0, 500)
      }
    }).catch(() => {});

    if (storedArticles.length >= NEWS_DISPLAY_COUNT) {
      return { articles: storedArticles, dateKey: state?.dateKey || dateKey, stale: true };
    }
    throw error;
  }
}

function normalizeStoredArticle(article) {
  return {
    dbId: article.id,
    title: article.title,
    link: article.link,
    description: article.description,
    imageUrl: article.imageUrl,
    pubDate: article.pubDate?.toISOString?.() || article.pubDate || "",
    sourceName: article.sourceName,
    translation: article.translation,
    n1Words: Array.isArray(article.n1Words) ? article.n1Words : null
  };
}

async function selectAndEnrichNews(articles) {
  const selected = pickRandom(articles, NEWS_DISPLAY_COUNT).map(normalizeStoredArticle);
  const missing = selected.filter(article => !article.translation || !article.n1Words);

  if (missing.length) {
    const enriched = await enrichNewsWithN1Learning(missing);
    const enrichedById = new Map(enriched.map(article => [article.dbId, article]));

    await Promise.allSettled(enriched.map(article => prisma.japaneseNews.update({
      where: { id: article.dbId },
      data: {
        translation: article.translation,
        n1Words: article.n1Words
      }
    })));

    for (let index = 0; index < selected.length; index++) {
      const enrichedArticle = enrichedById.get(selected[index].dbId);
      if (enrichedArticle) selected[index] = enrichedArticle;
    }
  }

  return selected.map(({ dbId, ...article }) => article);
}

async function loadNhkRssNews() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch("https://www3.nhk.or.jp/rss/news/cat0.xml", {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*"
      },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`NHK RSS 응답 불량: ${response.status}`);
    const xmlText = await response.text();
    const parsedItems = parseNhkRss(xmlText);
    if (!parsedItems) throw new Error("NHK RSS 파싱 실패");

    // RSS에서 랜덤으로 최대 10개 추출
    const shuffled = pickRandom(parsedItems, NEWS_DISPLAY_COUNT);
    return shuffled.map(item => ({ ...item, sourceName: "NHK" }));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadFreshNewsPayload() {
  try {
    const pool = await ensureDailyNewsPool();
    const enrichedNews = await selectAndEnrichNews(pool.articles);
    return {
      success: true,
      source: pool.stale ? "the-news-api-stale" : "the-news-api",
      poolDate: pool.dateKey,
      poolSize: pool.articles.length,
      news: enrichedNews
    };
  } catch (error) {
    console.warn("[The News API] 일일 뉴스 풀 로드 실패, NHK RSS로 전환:", error.message);
  }

  try {
    const news = await loadNhkRssNews();
    const enrichedNews = await enrichNewsWithN1Learning(news);
    return { success: true, source: "nhk-rss-fallback", news: enrichedNews };
  } catch (error) {
    console.warn("[일본 뉴스 API] 외부 뉴스 로드 실패, 내장 뉴스 10선 제공:", error.message);
    return { success: true, source: "premium-fallback", news: pickRandom(NEWS_POOL, NEWS_DISPLAY_COUNT) };
  }
}

export async function getNewsPayload(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedNewsPayload && now < newsCacheExpiresAt) {
    return { payload: cachedNewsPayload, cached: true };
  }

  const requestPromise = inFlightNewsRequest
    ? inFlightNewsRequest
    : loadFreshNewsPayload();

  if (!inFlightNewsRequest) {
    inFlightNewsRequest = requestPromise;
  }

  try {
    const payload = await requestPromise;
    cachedNewsPayload = payload;
    newsCacheExpiresAt = Date.now() + NEWS_CACHE_TTL_MS;
    return { payload, cached: false };
  } finally {
    if (inFlightNewsRequest === requestPromise) {
      inFlightNewsRequest = null;
    }
  }
}
