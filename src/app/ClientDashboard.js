'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';

const BEGINNER_CONVERSATIONS = [
  {
    title: "🍜 라멘 가게에서 '차슈 추가' 주문하기",
    description: "すみません、豚骨ラーメンにチャーシューをトッピングしてください。あと、生ビールも一杯お願いします！",
    translation: "실례합니다, 돈코츠 라멘에 차슈를 토핑해 주세요. 그리고 생맥주도 한 잔 부탁드립니다!",
    pubDate: new Date().toISOString(),
    n1Words: [
      { word: "豚骨", reading: "とんこつ", meaning: "돈코츠 (돼지뼈)" },
      { word: "トッピング", reading: "とっぴんぐ", meaning: "토핑" },
      { word: "生ビール", reading: "なまびーる", meaning: "생맥주" },
      { word: "一杯", reading: "いっぱい", meaning: "한 잔" },
      { word: "お願い", reading: "おねがい", meaning: "부탁" }
    ],
    link: "https://ja.dict.naver.com"
  },
  {
    title: "🏪 편의점에서 봉투 필요 여부 대화",
    description: "袋は要りますか？ いいえ、結構です。このままで大丈夫です。支払いはカードでお願いします。",
    translation: "봉투는 필요하신가요? 아니요, 괜찮습니다. 이대로도 괜찮습니다. 결제는 카드로 부탁드립니다.",
    pubDate: new Date().toISOString(),
    n1Words: [
      { word: "袋", reading: "ふくろ", meaning: "봉투" },
      { word: "要る", reading: "いる", meaning: "필요하다" },
      { word: "結構", reading: "けっこう", meaning: "괜찮음" },
      { word: "大丈夫", reading: "だいじょうぶ", meaning: "괜찮음" },
      { word: "支払い", reading: "し하らい", meaning: "결제/지불" }
    ],
    link: "https://ja.dict.naver.com"
  },
  {
    title: "🦊 인기 애니메이션의 주인공 용기 독백",
    description: "諦めたらそこで試合終了だよ。最後まで希望を捨てちゃいけない。絶対に勝てるから！",
    translation: "포기하면 거기서 시합 종료야. 마지막까지 희망을 버려서는 안 돼. 절대 이길 수 있으니까!",
    pubDate: new Date().toISOString(),
    n1Words: [
      { word: "諦める", reading: "あきらめる", meaning: "포기하다" },
      { word: "試合", reading: "しあい", meaning: "시합" },
      { word: "終了", reading: "しゅうりょう", meaning: "종료" },
      { word: "希望", reading: "きぼう", meaning: "희망" },
      { word: "絶対", reading: "ぜったい", meaning: "절대" }
    ],
    link: "https://ja.dict.naver.com"
  },
  {
    title: "💼 새로운 편의점 아르바이트 첫 출근 인사",
    description: "今日から新しく入ったキムと申します。初めてで慣れない部分もありますが、一生懸命頑張ります！",
    translation: "오늘부터 새로 들어온 김이라고 합니다. 처음이라 서툰 부분도 있겠지만, 열심히 노력하겠습니다!",
    pubDate: new Date().toISOString(),
    n1Words: [
      { word: "新しく", reading: "あたらしく", meaning: "새롭게" },
      { word: "申す", reading: "もうす", meaning: "~라고 아뢰다/말하다" },
      { word: "初めて", reading: "はじめて", meaning: "처음" },
      { word: "一生懸命", reading: "いっしょうけんめい", meaning: "열심히" },
      { word: "頑張る", reading: "がんばる", meaning: "노력하다/힘내다" }
    ],
    link: "https://ja.dict.naver.com"
  },
  {
    title: "🌸 봄바람 살랑이는 벚꽃 축제 데이트 약속",
    description: "今週末の桜祭り、一緒に行きませんか？ 満開でとても綺麗らしいですよ。駅で待ち合わせましょう。",
    translation: "이번 주말 벚꽃 축제, 같이 가지 않을래요? 만개해서 아주 예쁘다고 해요. 역에서 만나요.",
    pubDate: new Date().toISOString(),
    n1Words: [
      { word: "週末", reading: "しゅうまつ", meaning: "주말" },
      { word: "一緒", reading: "いっしょ", meaning: "함께" },
      { word: "満開", reading: "まんかい", meaning: "만개" },
      { word: "綺麗", reading: "きれい", meaning: "예쁨/깨끗함" },
      { word: "待ち合わせる", reading: "まちあわせる", meaning: "만나기로 약속하다" }
    ],
    link: "https://ja.dict.naver.com"
  }
];

const HIRAGANA_GRID = [
  [ { h: 'あ', k: 'ア', r: 'a' }, { h: 'い', k: 'イ', r: 'i' }, { h: 'う', k: 'ウ', r: 'u' }, { h: 'え', k: 'エ', r: 'e' }, { h: 'お', k: 'オ', r: 'o' } ],
  [ { h: 'か', k: 'カ', r: 'ka' }, { h: 'き', k: 'キ', r: 'ki' }, { h: 'く', k: 'ク', r: 'ku' }, { h: 'け', k: 'ケ', r: 'ke' }, { h: 'こ', k: 'コ', r: 'ko' } ],
  [ { h: 'さ', k: 'サ', r: 'sa' }, { h: 'し', k: 'シ', r: 'shi' }, { h: 'す', k: 'ス', r: 'su' }, { h: 'せ', k: 'セ', r: 'se' }, { h: 'そ', k: 'ソ', r: 'so' } ],
  [ { h: 'た', k: 'タ', r: 'ta' }, { h: 'ち', k: 'チ', r: 'chi' }, { h: 'つ', k: 'ツ', r: 'tsu' }, { h: 'て', k: 'テ', r: 'te' }, { h: 'と', k: 'ト', r: 'to' } ],
  [ { h: 'な', k: 'ナ', r: 'na' }, { h: 'に', k: 'ニ', r: 'ni' }, { h: 'ぬ', k: 'ヌ', r: 'nu' }, { h: 'ね', k: 'ネ', r: 'ne' }, { h: 'の', k: 'ノ', r: 'no' } ],
  [ { h: 'は', k: 'ハ', r: 'ha' }, { h: 'ひ', k: 'ヒ', r: 'hi' }, { h: 'ふ', k: 'フ', r: 'fu' }, { h: 'へ', k: 'ヘ', r: 'he' }, { h: 'ほ', k: 'ホ', r: 'ho' } ],
  [ { h: 'ま', k: 'マ', r: 'ma' }, { h: 'み', k: 'ミ', r: 'mi' }, { h: 'む', k: 'ム', r: 'mu' }, { h: 'め', k: 'メ', r: 'me' }, { h: 'も', k: 'モ', r: 'mo' } ],
  [ { h: 'や', k: 'ヤ', r: 'ya' }, null, { h: 'ゆ', k: 'ユ', r: 'yu' }, null, { h: 'よ', k: 'ヨ', r: 'yo' } ],
  [ { h: 'ら', k: 'ラ', r: 'ra' }, { h: 'り', k: 'リ', r: 'ri' }, { h: 'る', k: 'ル', r: 'ru' }, { h: 'れ', k: 'レ', r: 're' }, { h: 'ろ', k: 'ロ', r: 'ro' } ],
  [ { h: 'わ', k: 'ワ', r: 'wa' }, null, null, null, { h: 'を', k: 'ヲ', r: 'wo' } ],
  [ { h: 'ん', k: 'ン', r: 'n' }, null, null, null, null ]
];

export default function ClientDashboard({ initialStages, initialUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [targetLevel, setTargetLevel] = useState('N1');
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);

  // --- 🌱 왕초보 손글씨 캔버스 전용 상태 및 Refs ---
  const [selectedChar, setSelectedChar] = useState({ h: 'あ', k: 'ア', r: 'a' });
  const [isHiraganaTab, setIsHiraganaTab] = useState(true);
  const [brushColor, setBrushColor] = useState('#486b48'); 
  const [brushWidth, setBrushWidth] = useState(6);
  const [showStamp, setShowStamp] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);
  const [isCalligraphyModalOpen, setIsCalligraphyModalOpen] = useState(false);
  
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
    if (!mounted || targetLevel !== 'BEGINNER' || !isCalligraphyModalOpen) return;
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
  }, [selectedChar, isHiraganaTab, targetLevel, mounted, isCalligraphyModalOpen]);

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
        body: JSON.stringify({ pointsToAdd: 10 })
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

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('nihongo_quest_target_level') || 'N1';
      setTargetLevel(savedLevel);
    }

    const handleModalState = (e) => {
      setIsArenaModalOpen(e.detail?.open ?? false);
    };
    window.addEventListener('arena-modal-state', handleModalState);

    const handleOpenCalligraphy = () => {
      setIsCalligraphyModalOpen(true);
    };
    window.addEventListener('open-calligraphy-modal', handleOpenCalligraphy);

    return () => {
      window.removeEventListener('arena-modal-state', handleModalState);
      window.removeEventListener('open-calligraphy-modal', handleOpenCalligraphy);
    };
  }, []);

  const getSyncHeaders = (extra = {}) => {
    const username = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터';
    const targetLevel = typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_target_level') || 'N1') : 'N1';
    return {
      'x-nihongo-username': encodeURIComponent(username),
      'x-nihongo-target-level': targetLevel,
      ...extra
    };
  };

  const getDynamicStages = () => {
    if (targetLevel === 'BEGINNER') {
      return [
        {
          id: "stage-calligraphy-uuid",
          stageNumber: 0,
          title: "🌱 왕초보 문자 비법서 & 손글씨 연습장",
          category: "CALLIGRAPHY",
          difficulty: "EASY",
          desc: "히라가나와 가타카나 50음도 표를 보며 오디오 발음을 청취하고, 직접 화면에 한 획 한 획 손글씨를 따라 그리는 전용 훈련 연습장입니다."
        },
        {
          id: "stage-1-uuid",
          stageNumber: 1,
          title: "기초 문자 정복 아레나",
          category: "CHARACTERS",
          difficulty: "EASY",
          desc: "히라가나와 가타카나의 음가 및 기초적인 일상 문자 쓰기 훈련을 시작합니다."
        },
        {
          id: "stage-2-uuid",
          stageNumber: 2,
          title: "기초 필수 어휘 아레나",
          category: "VOCAB",
          difficulty: "EASY",
          desc: "N5~N4 수준의 실생활/가정/학교 등 필수 생활 어휘 1,000개를 마스터합니다."
        },
        {
          id: "stage-3-uuid",
          stageNumber: 3,
          title: "기초 조사 & 연결 어미 아레나",
          category: "GRAMMAR",
          difficulty: "EASY",
          desc: "N3 수준의 중요 기초 조사와 동사/형용사의 일상 연결 접속 표현을 정밀 훈련합니다."
        },
        {
          id: "stage-4-uuid",
          stageNumber: 4,
          title: "일상 회화 청해 아레나",
          category: "LISTENING",
          difficulty: "EASY",
          desc: "쉬운 애니메이션, 드라마 일상 회화 목소리를 청취하고 문맥을 파악해 답을 골라냅니다."
        },
        {
          id: "stage-5-uuid",
          stageNumber: 5,
          title: "초보용 기초 단어 워들 아레나",
          category: "WORDLE",
          difficulty: "EASY",
          desc: "초보자를 위한 귀여운 3~5글자의 기본 단어 퍼즐을 맞추는 워들 게임입니다."
        },
        {
          id: "virtual-stage-5-uuid",
          stageNumber: 5,
          title: "기초 일상문장 조립 아레나",
          category: "ASSEMBLY",
          difficulty: "EASY",
          desc: "N5~N3 여행, 인사, 자기소개 수준의 귀엽고 생생한 기본 문장 카드를 결합해 조립합니다."
        },
        {
          id: "virtual-stage-6-uuid",
          stageNumber: 6,
          title: "초보 실력 진단 모의고사 아레나",
          category: "MOCK_EXAM",
          difficulty: "EASY",
          desc: "N5~N3 기초 문자/어휘/문법 등 총 10문항으로 구성된 10분 초보 전용 스피드 모의고사입니다."
        }
      ];
    }
    
    // N1 마스터 코스 목록
    return [
      {
        id: "stage-1-uuid",
        stageNumber: 1,
        title: "시사 한자 & 문자 정복 아레나",
        category: "CHARACTERS",
        difficulty: "HARD",
        desc: "최고난도 기출 한자 쓰기 및 음독/훈독 판독 훈련을 수행합니다."
      },
      {
        id: "stage-2-uuid",
        stageNumber: 2,
        title: "최우선순위 1000+ 고급 어휘 아레나",
        category: "VOCAB",
        difficulty: "HARD",
        desc: "문서 해독 및 뉴스 청해에 즉시 쓰이는 고급 비즈니스 필수 어휘를 정복합니다."
      },
      {
        id: "stage-3-uuid",
        stageNumber: 3,
        title: "킬러 문법 & 고난도 조사 아레나",
        category: "GRAMMAR",
        difficulty: "HARD",
        desc: "N1 합격을 좌우하는 난해한 기능어 및 접속 규칙 문법을 철저하게 정복합니다."
      },
      {
        id: "stage-4-uuid",
        stageNumber: 4,
        title: "NHK 시사 뉴스 청해 배틀 아레나",
        category: "LISTENING",
        difficulty: "HARD",
        desc: "원어민 아나운서의 시사 원문 음성을 듣고 빈칸을 완성하는 딕테이션 훈련입니다."
      },
      {
        id: "stage-5-uuid",
        stageNumber: 5,
        title: "고난도 단어 워들 아레나",
        category: "WORDLE",
        difficulty: "HARD",
        desc: "5글자의 복잡한 고난도 명품 한자 단어를 유추해 맞추는 초성 두뇌 워들 게임입니다."
      },
      {
        id: "virtual-stage-5-uuid",
        stageNumber: 5,
        title: "최고급 경어 & 문장 조립 아레나",
        category: "ASSEMBLY",
        difficulty: "HARD",
        desc: "N1 킬러 경어와 격식 표현 단어 카드를 결합하여 유려한 격식 비즈니스 문장을 직조합니다."
      },
      {
        id: "virtual-stage-6-uuid",
        stageNumber: 6,
        title: "실전 15분 하프 모의고사 아레나",
        category: "MOCK_EXAM",
        difficulty: "HARD",
        desc: "문자·어휘·문법 총 15문항을 N1 황금비율로 무작위 셔플 추출하여 15분 실전 모의고사를 극복합니다."
      }
    ];
  };

  // 실시간 유저 정보 로드
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user', {
          headers: getSyncHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser({
            username: typeof window !== 'undefined' ? (localStorage.getItem('nihongo_quest_username') || '니혼고마스터') : '니혼고마스터',
            points: 0,
            currentStreak: 0,
            maxStreak: 0,
            badges: '["초보자"]'
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setUserLoading(false);
      }
    }
    loadUser();
  }, []);

  const parsedBadges = user && user.badges ? JSON.parse(user.badges) : ["초보자"];

  // 상시 동기화 로딩 상태
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // 🏆 [3.8.5 프리미엄 업적 콜렉션 상태]
  const [unlockedAchievements, setUnlockedAchievements] = useState({});

  // 🎯 스마트 복습 & 단어 카운트 실시간 상태
  const [wrongCount, setWrongCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const r1 = await fetch('/api/wrong-notes', {
          headers: getSyncHeaders()
        });
        const d1 = await r1.json();
        if (d1.success) setWrongCount(d1.wrongAnswers.length);
        
        const r2 = await fetch('/api/bookmarks', {
          headers: getSyncHeaders()
        });
        const d2 = await r2.json();
        if (d2.success) setBookmarkCount(d2.bookmarks.length);
      } catch (e) {
        console.error("복습 데이터 집계 에러:", e);
      }
    }
    fetchCounts();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nihongo_quest_achievements');
      if (saved) {
        setUnlockedAchievements(JSON.parse(saved));
      }
    } catch (e) {
      console.error("업적 로딩 에러:", e);
    }
  }, []);

  // 🌸 NHK 실시간 뉴스 브리핑 상태
  const [nhkNews, setNhkNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [expandedNews, setExpandedNews] = useState(null);

  // NHK 딕테이션 및 즉시 수확 전용 상태들
  const { speak } = useJapaneseSpeech();
  const [dictatingNews, setDictatingNews] = useState(null);
  const [dictationInputs, setDictationInputs] = useState({});
  const [dictationChecked, setDictationChecked] = useState(false);
  const [dictationCorrects, setDictationCorrects] = useState({});
  const [harvestedWords, setHarvestedWords] = useState({});
  const [harvestingWord, setHarvestingWord] = useState('');

  // 📅 JLPT D-Day 연산 전용 상태 및 유틸
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [examInfo, setExamInfo] = useState({ type: '', dateStr: '' });
  const [isRegistrationPeriod, setIsRegistrationPeriod] = useState(false);

  useEffect(() => {
    // 특정 연도의 특정 월 첫째 주 일요일 반환 유틸
    const getFirstSundayOfMonth = (year, monthIndex) => {
      const date = new Date(year, monthIndex, 1);
      while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
      }
      return date;
    };

    // 다음 시험일 계산
    const getNextJlptExamDate = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const julyExam = getFirstSundayOfMonth(currentYear, 6); // 7월
      julyExam.setHours(13, 10, 0, 0);
      
      const decExam = getFirstSundayOfMonth(currentYear, 11); // 12월
      decExam.setHours(13, 10, 0, 0);
      
      if (now < julyExam) {
        return { date: julyExam, type: '7월 시험' };
      }
      if (now < decExam) {
        return { date: decExam, type: '12월 시험' };
      }
      const nextJulyExam = getFirstSundayOfMonth(currentYear + 1, 6);
      nextJulyExam.setHours(13, 10, 0, 0);
      return { date: nextJulyExam, type: '내년 7월 시험' };
    };

    const exam = getNextJlptExamDate();
    setExamInfo({
      type: exam.type,
      dateStr: exam.date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    });

    // 원서 접수 달 감지 (7월 시험: 4월 접수, 12월 시험: 9월 접수)
    const month = new Date().getMonth() + 1;
    if ((exam.type === '7월 시험' && month === 4) || (exam.type === '12월 시험' && month === 9)) {
      setIsRegistrationPeriod(true);
    }

    // 1초 주기의 카운트다운 타이머 기동
    const timer = setInterval(() => {
      const difference = exam.date.getTime() - Date.now();
      
      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 실시간 뉴스 로드 함수 (최초 로드 + 새로고침 버튼 공용)
  const fetchNhkNews = async (isRefresh = false) => {
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('nihongo_quest_target_level') || 'N1';
      if (savedLevel === 'BEGINNER') {
        setNhkNews(BEGINNER_CONVERSATIONS);
        setNewsLoading(false);
        return;
      }
    }
    try {
      if (isRefresh) setNewsRefreshing(true);
      else setNewsLoading(true);
      const res = await fetch('/api/nhk-news');
      const data = await res.json();
      if (data.success) {
        setNhkNews(data.news);
        setExpandedNews(null); // 새로고침 시 열린 아코디언 닫기
        setDictatingNews(null);
      }
    } catch (e) {
      console.error("NHK 뉴스 로드 에러:", e);
    } finally {
      setNewsLoading(false);
      setNewsRefreshing(false);
    }
  };

  // 실시간 뉴스 로드 (API에서 이미 랜덤 5개 반환)
  useEffect(() => {
    fetchNhkNews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLevel]);

  // 🌾 단어 즉시 수확기 처리
  const handleHarvestWord = async (wordObj) => {
    if (harvestingWord || harvestedWords[wordObj.word]) return;
    setHarvestingWord(wordObj.word);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          word: wordObj.word,
          meaning: wordObj.meaning,
          reading: wordObj.reading
        })
      });
      const data = await res.json();
      if (data.success) {
        setHarvestedWords(prev => ({ ...prev, [wordObj.word]: true }));
        setBookmarkCount(prev => prev + 1);
        alert(`🌾 N1 단어 즉시 수확 성공!\n[${wordObj.word}] 단어가 나의 단어장에 완벽히 수집되었습니다!`);
      } else {
        alert("수확 실패: " + data.error);
      }
    } catch (e) {
      alert("수확 실패 네트워크 에러: " + e.message);
    } finally {
      setHarvestingWord('');
    }
  };

  // 🎧 딕테이션 제출 채점 처리
  const handleDictationSubmit = (newsItem) => {
    const corrects = {};
    let allCorrect = true;
    
    newsItem.n1Words.forEach((wordObj, idx) => {
      const val = (dictationInputs[idx] || '').trim();
      const isCorrect = val === wordObj.word || val === wordObj.reading;
      corrects[idx] = isCorrect;
      if (!isCorrect) allCorrect = false;
    });

    setDictationCorrects(corrects);
    setDictationChecked(true);

    if (allCorrect) {
      alert("🎉 퍼펙트! 모든 N1 시사 빈칸을 정확하게 받아적으셨습니다! (+50pts 보너스)");
      if (user) {
        setUser(prev => prev ? { ...prev, points: prev.points + 50 } : null);
      }
    } else {
      alert("✍️ 채점 완료! 일부 빈칸을 확인해보세요. 오답 단어는 즉시 수확하여 공부할 수 있습니다!");
    }
  };

  // 모달 팝업 상태 관리
  const [selectedStage, setSelectedStage] = useState(null);
  const [chosenJlpt, setChosenJlpt] = useState('N1'); // 대분류 기본값: N1
  const [chosenDifficulty, setChosenDifficulty] = useState('EASY'); // 소분류 기본값: EASY

  // 스테이지별 이모지 및 색상 매핑
  const categoryMeta = {
    CALLIGRAPHY: { emoji: '🌱', color: '#486b48', label: '손글씨 연습', mobileTitle: '글자쓰기' },
    CHARACTERS: { emoji: '🌸', color: '#ff9494', label: '문자 정복', mobileTitle: '문자어휘' },
    VOCAB: { emoji: '🍱', color: '#ffb37e', label: '어휘 마스터', mobileTitle: '어휘마스터' },
    GRAMMAR: { emoji: '⚙️', color: '#a6cf98', label: '문법 조사', mobileTitle: '문법조사' },
    LISTENING: { emoji: '🎧', color: '#90b4fc', label: '청해 배틀', mobileTitle: '청해배틀' },
    WORDLE: { emoji: '🧩', color: '#b19ffb', label: '단어 워들', mobileTitle: '단어워들' },
    ASSEMBLY: { emoji: '⚔️', color: '#ffd32a', label: '문장 조립', mobileTitle: '문장조립' },
    MOCK_EXAM: { emoji: '📝', color: '#ff5e7e', label: '모의고사', mobileTitle: '모의고사' }
  };

  // 상시 동기화 실행
  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncDone(true);
        setTimeout(() => {
          setSyncDone(false);
          window.location.reload();
        }, 1200);
      } else {
        alert("동기화 실패: " + data.error);
      }
    } catch (e) {
      alert("네트워크 에러: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const openDifficultyModal = (stage) => {
    if (stage.category === 'CALLIGRAPHY') {
      setIsCalligraphyModalOpen(true);
      return;
    }
    const allStagesList = getDynamicStages();
    const idx = allStagesList.findIndex(s => s.stageNumber === stage.stageNumber && s.category === stage.category);
    window.dispatchEvent(new CustomEvent('open-arena-modal', { detail: { stageIndex: idx !== -1 ? idx : 0 } }));
  };

  // 🏟️ 다른 페이지에서 드로워 메뉴 클릭 후 넘어온 경우 파라미터 감지
  useEffect(() => {
    const allStagesList = getDynamicStages();
    const openArenaParam = searchParams.get('openArena');
    if (openArenaParam !== null) {
      const stageIndex = parseInt(openArenaParam, 10);
      const stage = allStagesList[stageIndex];
      if (stage) {
        openDifficultyModal(stage);
        // 모달을 띄웠으니 주소창의 쿼리 파라미터를 깔끔하게 초기화하여 메인 URL로 복원
        router.replace('/');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, targetLevel]);

  const handleStartPlay = () => {
    if (!selectedStage) return;
    // 선택한 급수(N2/N1)와 세부 난이도(EASY/MEDIUM/HARD)를 동시에 쿼리 파라미터로 실어 라우팅 실행
    router.push(`/play/${selectedStage.stageNumber}?jlptLevel=${chosenJlpt}&difficulty=${chosenDifficulty}`);
    setSelectedStage(null); // 모달 닫기
  };

  // 🔮 [3.8.8 명품 글래스모피즘] 3D 입체 틸트 & 마우스 광택 실시간 좌표 핸들러
  const handleMouseMove = (e) => {
    // 모바일(768px 이하) 혹은 터치 기기에서는 스크롤 및 레이아웃을 위해 틸트 작동을 완전히 배제
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return;
    }

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = x / rect.width - 0.5;
    const yc = y / rect.height - 0.5;
    
    // 큰 카드 영역에서도 심한 요동 없이 우아하고 기품 있게 3도로 정밀 완화
    const rotateX = yc * -3; 
    const rotateY = xc * 3;
    
    card.style.transform = `perspective(62.5rem) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.008)`;
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return;
    }
    const card = e.currentTarget;
    card.style.transform = `perspective(62.5rem) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div>      {/* 0. 상시 데이터 동기화 패널 (최상단 노출) */}
      <div className="glass-premium-card rainbow-border sync-panel-premium" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
      >
        <div className="sync-panel-content">
          <span className="sync-panel-title">
            {targetLevel === 'BEGINNER' ? '🌱 최신 왕초보 문항 데이터 동기화' : '🌱 최신 자격증 문항 데이터 동기화'}
          </span>
          <span className="sync-panel-desc">
            {targetLevel === 'BEGINNER' 
              ? '기초 문자/어휘/문법 마스터를 위한 2000+개 초보 퀴즈 풀로 초기화 및 갱신합니다.' 
              : '실전 최고난도 JLPT N1 완벽 대비용 초대형 5000+개 퀴즈 풀로 초기화 및 갱신합니다.'}
          </span>
        </div>
        
        <button
          onClick={handleSyncData}
          disabled={syncing || syncDone}
          className="glass-neon-btn sync-panel-btn"
        >
          {syncing ? (
            <>⏳ 주입 중...</>
          ) : syncDone ? (
            <>🎉 성공! 새로고침 중...</>
          ) : (
            <>{targetLevel === 'BEGINNER' ? '🌱 2000+ 문항 강제 동기화' : '🌱 5000+ 문항 강제 동기화'}</>
          )}
        </button>
      </div>

      {/* 📅 실시간 JLPT D-Day 카운트다운 & 접수 안내 보드 */}
      <div className="glass-premium-card rainbow-border dday-countdown-card" 
        onMouseMove={handleMouseMove} 
        onMouseLeave={handleMouseLeave}
        style={{
          marginBottom: '32px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))', animation: 'float 3s infinite' }}>📅</span>
          <div>
            <h4 className='count-title' style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {targetLevel === 'BEGINNER' ? 'JLPT N5~N3 왕초보 D-Day 카운트다운' : 'JLPT N1 합격 D-Day 카운트다운'}
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(84, 160, 255, 0.1)',
                color: '#54a0ff',
                padding: '2px 8px',
                borderRadius: '100px',
                border: '1px solid rgba(84, 160, 255, 0.2)',
                fontWeight: '800'
              }}>
                {examInfo.type}
              </span>
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
              목표 시험 일시: <strong style={{ color: 'var(--accent-color)' }}>{examInfo.dateStr} 13:10</strong>
            </p>
          </div>
        </div>

        {/* 째깍째깍 초시계 수치 */}
        <div className='count-timer' style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[
            { label: '일', val: timeLeft.days, color: 'var(--accent-color)' },
            { label: '시', val: timeLeft.hours, color: '#ff9f43' },
            { label: '분', val: timeLeft.minutes, color: '#1dd1a1' },
            { label: '초', val: timeLeft.seconds, color: '#ff5e7e' }
          ].map((t, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                minWidth: '54px',
                height: '54px',
                background: 'var(--bg-secondary)',
                border: `2px solid ${t.color}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: '950',
                color: t.color,
                boxShadow: `0 0 10px ${t.color}22`
              }}>
                {String(t.val).padStart(2, '0')}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', marginTop: '4px' }}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* 원서 접수 기간 연동 배너 */}
        {isRegistrationPeriod && (
          <div className="fade-in" style={{
            width: '100%',
            background: 'linear-gradient(95deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 94, 126, 0.15) 100%)',
            border: '1.5px solid #ff6b6b',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)',
            animation: 'pulse 1.5s infinite'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚨 긴급 알림: 현재 JLPT 공식 원서 접수 기간입니다!
            </span>
            <a 
              href="https://www.jlpt.or.kr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="glow-btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                background: '#ff6b6b',
                boxShadow: 'none',
                cursor: 'pointer'
              }}
            >
              공식 접수처 바로가기 🔗
            </a>
          </div>
        )}
      </div>

      {/* 1. 상단 정보 대시보드 카드 그리드 */}
      <div className="dashboard-info-grid">
        
        {/* 프로필 및 포인트 카드 */}
        <div className="glass-premium-card rainbow-border info-card-wrapper" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-header-group">
            <h3 className="card-title">
              {userLoading ? (
                <span className="card-skeleton-pulse">사용자 로드 중...</span>
              ) : (
                `👋 어서오세요, ${user?.username || '학습자'}님!`
              )}
            </h3>
            <p className="card-desc">
              {userLoading ? "실시간 클라우드 프로필을 동기화하고 있습니다..." : "오늘도 즐거운 일본어 모험이 당신을 기다립니다."}
            </p>
          </div>
          <div className="card-footer-group">
            <div>
              <span className="card-stat-label">누적 포인트</span>
              <span className="card-stat-value">
                {userLoading ? "..." : user?.points} <span className="card-stat-unit">pts</span>
              </span>
            </div>
            <span className="card-large-emoji">🏆</span>
          </div>
        </div>

        {/* 일일 학습 스트릭 카드 */}
        <div className="glass-premium-card rainbow-border info-card-wrapper" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-header-group">
            <h3 className="card-title">
              🔥 일일 학습 스트릭
            </h3>
            <p className="card-desc">
              매일 연속으로 학습을 이어가고 스트릭 불꽃을 꺼뜨리지 마세요!
            </p>
          </div>
          <div className="card-footer-group">
            <div>
              <span className="card-stat-value streak-color">
                {userLoading ? "..." : user?.currentStreak} <span className="card-stat-unit-text">일째 연속</span>
              </span>
              <span className="card-stat-label-small">
                최대 기록: {userLoading ? "..." : user?.maxStreak}일 연속 학습
              </span>
            </div>
            {/* 스트릭 잔디 심기 미니 연출 */}
            <div className="streak-grass-container">
              {[1, 2, 3, 4, 5].map((day) => (
                <div 
                  key={day}
                  className={`streak-grass-node ${(!userLoading && day <= (user?.currentStreak || 0)) ? 'active' : 'inactive'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 스마트 복습 & 단어 센터 (비로그인 환경 최적화 퀵 패스) */}
        <div className="glass-premium-card rainbow-border info-card-wrapper large-card" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-header-group">
            <h3 className="card-title">
              🎯 스마트 복습 & 단어 센터
            </h3>
            <p className="card-desc">
              틀린 오답을 복습하고, 퀴즈 도중 수집한 나만의 단어장을 한눈에 관리하세요.
            </p>
          </div>

          <div className="study-hub-box">
            <a href="/wrong-notes" className="study-hub-item wrong-hub">
              <span>📓 스마트 오답노트 복습</span>
              <span className="pulse-ani study-hub-badge wrong-badge">
                {wrongCount}개 대기
              </span>
            </a>

            <a href="/bookmarks" className="study-hub-item bookmark-hub">
              <span>⭐ 나의 일본어 단어장</span>
              <span className="study-hub-badge bookmark-badge">
                {bookmarkCount}개 단어
              </span>
            </a>
          </div>
        </div>

      </div>

      {/* 1.5. [N1 PREMIUM / BEGINNER DAILY] 랜덤 뉴스 및 회화 브리핑 */}
      <div className="glass-premium-card rainbow-border nhk-news-briefing-card">
        <div className="nhk-news-header">
          <div className="nhk-news-header-title-box">
            <h2 className="nhk-news-header-title">
              {targetLevel === 'BEGINNER' ? '🌸 왕초보 일상 회화 & 애니 딕테이션 브리핑' : '📰 NHK 실시간 시사 & 사회 뉴스 브리핑'}
            </h2>
            <p className="nhk-news-header-desc">
              {targetLevel === 'BEGINNER' 
                ? '친근한 애니메이션 명대사와 실생활 상황극 대화로 기초 표현 및 청해력을 기르세요' 
                : '매번 랜덤으로 선별된 5개 뉴스로 N1 기출 한자 및 핵심 사회 어휘를 학습하세요'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`nhk-status-badge ${targetLevel === 'BEGINNER' ? 'realtime' : (!newsLoading && nhkNews.length > 0 ? 'realtime' : 'fallback')}`}>
              {newsLoading ? '⏳ 로딩 중' : (targetLevel === 'BEGINNER' ? '🌱 왕초보 5선' : `🎲 랜덤 ${nhkNews.length}선`)}
            </span>
            {/* 🔄 새로고침 버튼 (N1 모드 전용) */}
            {targetLevel !== 'BEGINNER' && (
              <button
                onClick={() => fetchNhkNews(true)}
                disabled={newsLoading || newsRefreshing}
                title="뉴스 다시 불러오기"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  border: '1.5px solid var(--card-border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  cursor: (newsLoading || newsRefreshing) ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  animation: newsRefreshing ? 'spin 0.8s linear infinite' : 'none',
                  opacity: (newsLoading || newsRefreshing) ? 0.5 : 1
                }}
              >
                🔄
              </button>
            )}
          </div>
        </div>

        {newsLoading ? (
          /* 스켈레톤 로더 */
          <div className="nhk-skeleton-container">
            {[1, 2, 3].map((n) => (
              <div key={n} className="nhk-skeleton-item">
                <div className="nhk-skeleton-line title" />
                <div className="nhk-skeleton-line desc" />
              </div>
            ))}
          </div>
        ) : (
          <div className="nhk-news-list">
            {nhkNews.map((item, idx) => {
              const isExpanded = expandedNews === idx;
              return (
                <div 
                  key={idx} 
                  className={`nhk-news-item ${isExpanded ? 'active' : ''}`}
                >
                  {/* 뉴스 제목 및 간략 보기 영역 */}
                  <div 
                     className="nhk-news-item-trigger"
                     onClick={() => setExpandedNews(isExpanded ? null : idx)}
                  >
                    <div className="nhk-news-item-title-row">
                      <span className="nhk-news-emoji">{targetLevel === 'BEGINNER' ? '🌸' : '📰'}</span>
                      <h4 className="nhk-news-item-title">{item.title}</h4>
                      
                      <span className="nhk-toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    <div className="nhk-news-meta-row">
                      <span className="nhk-meta-date">
                        {item.pubDate ? new Date(item.pubDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '최신 시사'}
                      </span>
                      <span className="nhk-meta-category">{targetLevel === 'BEGINNER' ? '초보 일상회화' : 'N1 사회시사'}</span>
                    </div>
                  </div>

                  {/* 아코디언 콘텐츠 영역 (단어 정리 및 번역 제공) */}
                  {isExpanded && (
                    <div className="nhk-accordion-content fade-in">
                      <p className="nhk-news-raw-desc">
                        <strong>{targetLevel === 'BEGINNER' ? '[회화 지문]' : '[일본어 원문]'}</strong><br />
                        {item.description}
                      </p>

                      {/* 딕테이션 버튼 그룹 */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => speak(item.description)}
                          className="outline-btn"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          🔊 전체 지문 발음 청취 (TTS)
                        </button>
                        
                        <button
                          onClick={() => {
                            if (dictatingNews === idx) {
                              setDictatingNews(null);
                            } else {
                              setDictatingNews(idx);
                              setDictationInputs({});
                              setDictationChecked(false);
                              setDictationCorrects({});
                            }
                          }}
                          className="outline-btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: dictatingNews === idx ? 'var(--accent-color)' : 'var(--card-border)',
                            color: dictatingNews === idx ? 'var(--accent-color)' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          🎧 {targetLevel === 'BEGINNER' ? '기초 회화' : 'N1 뉴스'} 딕테이션 {dictatingNews === idx ? '종료' : '훈련 시작'}
                        </button>
                      </div>

                      {/* 딕테이션 훈련 슬롯 활성화 */}
                      {dictatingNews === idx && (
                        <div className="fade-in" style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1.5px dashed var(--card-border)',
                          padding: '20px',
                          borderRadius: '12px',
                          marginBottom: '18px'
                        }}>
                          <h5 style={{ fontWeight: '900', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--accent-color)' }}>
                            ✍️ {targetLevel === 'BEGINNER' ? '왕초보 일상 회화' : 'N1 실시간 뉴스'} 받아쓰기
                          </h5>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.6' }}>
                            아래 지문을 귀로 잘 청취하고, 빈칸에 들어갈 기초 단어를 맞춰 적어 보세요!
                          </p>

                          {/* 빈칸 변환 원문 렌더링 */}
                          <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '14px 18px',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            color: 'var(--text-primary)',
                            lineHeight: '1.8',
                            marginBottom: '16px',
                            borderLeft: '4px solid var(--accent-color)'
                          }}>
                            {(() => {
                              let text = item.description;
                              item.n1Words.forEach((wordObj, wIdx) => {
                                text = text.replaceAll(wordObj.word, `[ 빈칸 ${wIdx + 1} ]`);
                              });
                              return text;
                            })()}
                          </div>

                          {/* 주관식 빈칸 기입 란 */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {item.n1Words.map((wordObj, wIdx) => {
                              const isInputCorrect = dictationCorrects[wIdx];
                              return (
                                <div key={wIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                    [빈칸 {wIdx + 1}] 힌트: {wordObj.meaning} [{wordObj.reading}]
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="한자 또는 히라가나..."
                                    disabled={dictationChecked}
                                    value={dictationInputs[wIdx] || ''}
                                    onChange={(e) => setDictationInputs(prev => ({ ...prev, [wIdx]: e.target.value }))}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '0.85rem',
                                      border: `2px solid ${dictationChecked ? (isInputCorrect ? 'var(--accent-color)' : '#ff6b6b') : 'var(--card-border)'}`,
                                      borderRadius: '6px',
                                      background: 'var(--card-bg)',
                                      color: 'var(--text-primary)',
                                      outline: 'none',
                                      flexGrow: 1,
                                      maxWidth: '220px'
                                    }}
                                  />
                                  {dictationChecked && (
                                    <span style={{
                                      fontSize: '0.8rem',
                                      fontWeight: '800',
                                      color: isInputCorrect ? 'var(--accent-color)' : '#ff6b6b'
                                    }}>
                                      {isInputCorrect ? '✓ 정답!' : `✗ 오답 (정답: ${wordObj.word})`}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* 채점 및 제출 단추 */}
                          {!dictationChecked ? (
                            <button
                              onClick={() => handleDictationSubmit(item)}
                              className="glow-btn"
                              style={{ marginTop: '16px', padding: '8px 20px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              🔍 딕테이션 채점 및 제출
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setDictationChecked(false);
                                setDictationInputs({});
                                setDictationCorrects({});
                              }}
                              className="outline-btn"
                              style={{ marginTop: '16px', padding: '8px 20px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              🔄 다시 훈련하기
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="nhk-news-analysis-box">
                        {/* 1. 핵심 어휘집 */}
                        <div className="nhk-analysis-subsect">
                          <h5 className="nhk-subsect-title">🌸 {targetLevel === 'BEGINNER' ? '왕초보 필수 어휘' : 'N1 필수 시사 어휘'}</h5>
                          <div className="nhk-words-grid">
                            {item.n1Words && item.n1Words.length > 0 ? (
                              item.n1Words.map((wordObj, wIdx) => (
                                <div key={wIdx} className="nhk-word-chip-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="nhk-word-badge">{wordObj.word}</span>
                                    <div className="nhk-word-details">
                                      <span className="nhk-word-reading">[{wordObj.reading}]</span>
                                      <span className="nhk-word-meaning">{wordObj.meaning}</span>
                                    </div>
                                  </div>
                                  
                                  {/* 🌾 단어 즉시 수확 뱃지 */}
                                  <button
                                    onClick={() => handleHarvestWord(wordObj)}
                                    disabled={harvestedWords[wordObj.word] || harvestingWord === wordObj.word}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '0.75rem',
                                      borderRadius: '100px',
                                      border: '1.5px solid var(--card-border)',
                                      cursor: 'pointer',
                                      background: harvestedWords[wordObj.word] ? 'rgba(29, 209, 161, 0.1)' : 'rgba(84, 160, 255, 0.05)',
                                      color: harvestedWords[wordObj.word] ? '#1dd1a1' : 'var(--text-secondary)',
                                      borderColor: harvestedWords[wordObj.word] ? '#1dd1a1' : 'var(--card-border)',
                                      fontWeight: '800',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {harvestedWords[wordObj.word] ? '수확 완료! ✅' : harvestingWord === wordObj.word ? '🌾...' : '🌾 수확'}
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="nhk-no-words">기출 어휘 분석 중...</p>
                            )}
                          </div>
                        </div>

                        {/* 2. 번역 가이드 */}
                        <div className="nhk-analysis-subsect translation-subsect">
                          <h5 className="nhk-subsect-title">📓 한국어 번역 가이드</h5>
                          <p className="nhk-translation-text">{item.translation}</p>
                        </div>
                      </div>

                      {/* 하단 단독 원문 앵커 링크 */}
                      <div className="nhk-item-footer">
                        <a 
                          href={targetLevel === 'BEGINNER' ? 'https://ja.dict.naver.com/#/main' : item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="nhk-raw-link-btn"
                        >
                          {targetLevel === 'BEGINNER' ? '네이버 일본어 사전 바로가기 🔗' : 'NHK 공식 기사 원문 보기 🔗'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🚀 모바일 전용 아레나 팝업 트리거 단축 버튼 (하단 플로팅 고정 고도화 - React Portal로 스태킹 컨텍스트 완벽 이탈) */}
      {mounted && !isArenaModalOpen && createPortal(
        <div className="mobile-only animate-scale mo-arena-btn" style={{ 
          position: 'fixed', 
          bottom: '1.25rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '90%', 
          maxWidth: '26.25rem', 
          zIndex: 999999 
        }}>
          <button
            onClick={() => {
              const startStage = targetLevel === 'BEGINNER' 
                ? getDynamicStages().find(s => s.category === 'CHARACTERS') 
                : getDynamicStages()[0];
              openDifficultyModal(startStage);
            }}
            className="glass-neon-btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.9375rem 1.25rem',
              fontSize: '0.92rem',
              borderRadius: '100px',
              boxShadow: 'var(--neon-glow)',
              backdropFilter: 'blur(0.75rem)',
              WebkitBackdropFilter: 'blur(0.75rem)',
              background: 'var(--card-bg)',
              border: '1.5px solid var(--accent-color)'
            }}
          >
            🏟️ {targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나' : 'N1 실전 아레나'} 챌린지 시작하기 ➔
          </button>
        </div>,
        document.body
      )}

      {/* 2. 대망 of 5대 카테고리 독립형 실전 아레나 (PC 전용으로 모바일 은폐) */}
      <div className="arena-section-container pc-only">
        <h2 className="arena-section-title">
          🏟️ {targetLevel === 'BEGINNER' ? '왕초보 스타터 아레나 (Beginner Quest)' : 'N1 실전 아레나 (N1 Extreme Masters)'}
        </h2>
        
        <div className="arena-cards-grid">
          {getDynamicStages().map((stage) => {
            const meta = categoryMeta[stage.category] || { emoji: '❓', color: 'gray', label: '학습' };
            const dynamicLabel = targetLevel === 'BEGINNER' ? {
              CALLIGRAPHY: "글자 쓰기",
              CHARACTERS: "기초 문자",
              VOCAB: "기초 어휘",
              GRAMMAR: "기초 조사",
              LISTENING: "일상 청해",
              WORDLE: "기초 워들",
              ASSEMBLY: "기초 조립",
              MOCK_EXAM: "실력 진단"
            }[stage.category] || meta.label : meta.label;
            
            return (
              <div 
                key={stage.id}
                className="glass-premium-card rainbow-border interactive-arena arena-card-wrapper"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  boxShadow: `0 8px 30px rgba(0, 0, 0, 0.02), 0 0 20px ${meta.color}0a`
                }}
              >
                {/* 상단: 카테고리 정보 및 아이콘 */}
                <div className="arena-card-body-wrapper">
                  <div className="arena-card-top">
                    <span className="arena-card-emoji">{meta.emoji}</span>
                    <span 
                      className="arena-card-badge"
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}66`
                      }}
                    >
                      {dynamicLabel}
                    </span>
                  </div>

                  <h4 className="arena-card-title">
                    {stage.title}
                  </h4>
                  
                  <p className="arena-card-desc">
                    {stage.desc || "5,000+개 N1 최고난도 기출 풀에서 무작위 라이브 추출"}
                  </p>
                </div>

                {/* 하단: 입장 버튼 및 매칭 명세 */}
                <div className="arena-card-footer">
                  <span className="arena-card-footer-label">
                    독자 아레나 코스
                  </span>
                  <button 
                    onClick={() => openDifficultyModal(stage)}
                    className="glass-neon-btn arena-card-btn" 
                  >
                    아레나 입장 ➔
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================== [3.0 JLPT 5대 아레나 실시간 통합 변경 + 상중하 난이도 조절 우아한 모달 팝업] ==================== */}
      {/* 공통 Header.js 에서 관리하는 글로벌 아레나 모달이 렌더링되므로, 이 파일 내 중복 팝업은 완전 제거합니다. */}

      {/* 🎉 50음도 그리기 성공 축하 Confetti 포탈 렌더링 */}
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

      {/* 🌱 [왕초보 문자 비법서 & 손글씨 연습장] 코스 전용 라지 모달 팝업 */}
      {mounted && isCalligraphyModalOpen && createPortal(
        <div className="calligraphy-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setIsCalligraphyModalOpen(false);
        }}>
          <div className="calligraphy-modal-window">
            
            {/* 모달 헤더 */}
            <div className="calligraphy-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🌱</span>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--text-primary)' }}>왕초보 문자 비법서 & 손글씨 연습장</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>히라가나/가타카나 표준 50음도 정복 코스</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCalligraphyModalOpen(false)}
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

    </div>
  );
}
