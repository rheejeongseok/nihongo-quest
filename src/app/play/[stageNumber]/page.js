'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';

export default function PlayStagePage({ params }) {
  const stageNumber = parseInt(params.stageNumber);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 다차원 쿼리 파라미터 파싱
  const jlptLevel = searchParams.get('jlptLevel') || 'N2';
  const difficulty = searchParams.get('difficulty') || 'EASY';
  const { speak } = useJapaneseSpeech();

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 게임 진행 상태
  const [selectedAns, setSelectedAns] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  
  // 워들 전용 상태
  const [wordleInput, setWordleInput] = useState([]);
  const [wordleFeedback, setWordleFeedback] = useState([]);
  const [wordleAttempts, setWordleAttempts] = useState([]);
  const [wordleMaxAttempts] = useState(5);
  const [wordleFinished, setWordleFinished] = useState(false);

  // 북마크 등록 상태
  const [bookmarking, setBookmarking] = useState(false);
  const [bookmarkedList, setBookmarkedList] = useState({});

  // 게임 완료 상태
  const [gameCompleted, setGameCompleted] = useState(false);

  // 시간 카운터
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef(null);

  // 🖌️ [구글 실시간 손글씨 해독 주관식그림판] 핵심 엔진 상태 및 Refs
  const [isDrawingOpen, setIsDrawingOpen] = useState(true);
  const [brushSize, setBrushSize] = useState(2);
  const [showOverlayGuide, setShowOverlayGuide] = useState(false);
  
  // 주관식 정답 입력 필드 상태
  const [typedAnswer, setTypedAnswer] = useState('');
  
  // 구글 획 데이터 큐 (Strokes: [[[x...], [y...], [time...]], ...])
  const [ink, setInk] = useState([]); 
  const [candidates, setCandidates] = useState([]); // 구글이 해독한 추천 단어 5개
  const [recognizing, setRecognizing] = useState(false); // 해독 통신 로딩

  // 🏆 [3.8.5 울트라 에디션] 신규 프리미엄 코어 상태
  const [comboCount, setComboCount] = useState(0);
  const [achievementToast, setAchievementToast] = useState(null); // { title, desc, icon }
  const [drawingSubmissions, setDrawingSubmissions] = useState(0); // 그림판을 통한 제출 누적 횟수
  
  const canvasRef = useRef(null);
  const confettiCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const strokeXRef = useRef([]);
  const strokeYRef = useRef([]);
  const strokeTimeRef = useRef([]);
  const startTimeRef = useRef(0);

  // 📖 일본어 상용한자 및 카나 글자별 획수 가이드 사전
  const strokeMap = {
    '言': 7, '語': 14, '本': 5, '日': 4, '勉': 10, '強': 11, '学': 8, '習': 11,
    '会': 6, '社': 7, '員': 10, '駅': 14, '乗': 9, '降': 10, '入': 2, '出': 5,
    '国': 8, '人': 2, '中': 4, '英': 8, '書': 10, '読': 14, '聞': 14, '話': 13,
    '対': 7, '策': 12, '緊': 15, '急': 9, '態': 14, '勢': 13, '険': 11, '避': 16,
    '難': 18, '救': 11, '助': 7, '護': 20, '警': 19, '備': 12, '防': 7, '犯': 5,
    '罪': 13, '捜': 10, '査': 9, '判': 7, '決': 7, '訟': 11, '訴': 12, '盟': 13,
    '約': 9, '条': 7, '協': 8, '議': 20, '政': 9, '治': 8, '府': 8, '選': 15,
    '挙': 10, '権': 15, '法': 8, '律': 9, '規': 11, '制': 8, '禁': 13, '企': 6,
    '業': 13, '資': 13, '融': 16, '投': 7, '株': 10, '式': 6, '債': 13, '務': 11,
    '財': 10, '税': 12, '率': 11, '控': 11, '除': 10, '申': 5, '告': 7, '納': 10,
    '付': 5, '徴': 14, '収': 4, '歳': 13, '補': 12, '正': 5, '予': 4, '算': 14,
    '審': 15, '可': 5, '否': 7, '能': 10, '不': 4, '限': 9, '界': 9, '超': 12,
    '過': 12, '未': 5, '満': 12, '以': 5, '上': 3, '下': 3, '範': 15, '囲': 12,
    '領': 14, '域': 11, '規': 11, '模': 14, '疇': 19, '概': 14, '念': 8, '理': 11,
    '論': 15, '説': 14, '証': 12, '明': 8, '反': 4, '駁': 14, '辯': 21, '糾': 9,
    '弾': 12, '非': 8, '責': 11, '任': 6, '義': 13, '免': 8, '特': 10, '優': 17,
    '遇': 12, '差': 10, '別': 7, '排': 11, '他': 5, '包': 5, '括': 9, '網': 14,
    '羅': 19, '要': 9, '詳': 13, '細': 11, '克': 7, '繊': 17, '粗': 11, '雑': 14,
    '繁': 16, '簡': 18, '単': 9, '容': 10, '易': 8, '関': 14, '門': 8, '障': 14,
    '壁': 16, '打': 5, '開': 12, '服': 8, '充': 6, '実': 8, '足': 7, '妥': 7,
    '譲': 20, '歩': 8, '確': 15, '執': 11, '頑': 13, '固': 8, '偏': 11, '拘': 8,
    '泥': 8, '着': 12, '愛': 13, '憎': 14, '恩': 10, '徳': 14, '操': 16, '守': 6,
    '破': 10, '棄': 13, '束': 7, '誓': 14, '履': 15, '行': 6, '遅': 12, '延': 7,
    '猶': 12, '期': 12, '終': 11, '了': 2, '完': 7, '結': 12, '途': 10, '挫': 10,
    '折': 7, '断': 11, '諦': 16, '観': 18, '妄': 6, '想': 13, '幻': 4, '影': 15,
    '像': 14, '虚': 11, '錯': 16, '覚': 12, '直': 8, '感': 13, '洞': 9, '察': 14,
    '推': 11, '測': 12, '憶': 16, '疑': 14, '惑': 12, '信': 9, '保': 9, '担': 8,
    '抵': 8, '当': 6, '弁': 5, '済': 11, '償': 17, '却': 7, '赦': 11, '刑': 6,
    '釈': 11, '放': 8, '留': 10, '監': 15, '幽': 9, '閉': 11, '拉': 8, '致': 10,
    '誘': 14, '拐': 8, '質': 15, '身': 7, '代': 5, '金': 8, '要': 9, '脅': 18,
    '迫': 8, '威': 9, '嚇': 17, '求': 7, '懇': 17, '願': 19, '哀': 9, '嘆': 15,
    '請': 15, '立': 5, '抗': 8, '異': 11, '服': 8, '起': 10, '訴': 12, '和': 8,
    '解': 13, '調': 15, '停': 11, '仲': 6, '裁': 12, '司': 5, '力': 2, '分': 4,
    '独': 9, '専': 9, '占': 5, '寡': 14, '競': 20, '争': 6, '共': 6, '存': 6,
    '栄': 9, '繁': 16, '衰': 10, '退': 9, '没': 7, '落': 12, '滅': 13, '崩': 11,
    '壊': 16, '再': 6, '建': 9, '復': 12, '興': 16, '振': 10, '隆': 11, '盛': 11,
    '微': 13, '消': 10
  };

  // 실시간 획수 합산 유틸리티
  const getJapaneseWordStrokes = (word) => {
    if (!word) return 0;
    // 태그가 붙어있는 경우 제거
    const cleanWord = word.replace(/\[N(1|2)-(EASY|MEDIUM|HARD)\]\s*/g, '');
    let total = 0;
    for (let char of cleanWord) {
      if (strokeMap[char]) {
        total += strokeMap[char];
      } else {
        const code = char.charCodeAt(0);
        // 히라가나 영역 (0x3040 ~ 0x309F)
        if (code >= 0x3040 && code <= 0x309F) {
          total += 3; // 히라가나 평균 3획
        } else if (code >= 0x30A0 && code <= 0x30FF) {
          total += 2; // 가타카나 평균 2획
        } else {
          total += 4; // 한글/기타 기본 4획
        }
      }
    }
    return total;
  };

  // 🎉 [초경량 클라이언트 Confetti 꽃가루 파티클 엔진]
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff5e7e', '#ff9f43', '#1dd1a1', '#54a0ff', '#feca57', '#9b5de5'];
    const particles = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationId;
    const startTime = Date.now();

    function drawConfetti() {
      if (Date.now() - startTime > 3000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationId);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - index / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      particles.forEach(p => {
        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }
      });

      animationId = requestAnimationFrame(drawConfetti);
    }

    drawConfetti();
  };

  // 🏆 [로컬 스토리지 보존형 업적 잠금 해제 시스템]
  const unlockAchievement = (id, title, desc, icon) => {
    try {
      const saved = localStorage.getItem('nihongo_quest_achievements');
      const achievements = saved ? JSON.parse(saved) : {};

      if (!achievements[id]) {
        achievements[id] = { id, title, desc, icon, unlockedAt: new Date().toISOString() };
        localStorage.setItem('nihongo_quest_achievements', JSON.stringify(achievements));

        // 영롱한 우주선 느낌 토스트 활성화
        setAchievementToast({ title, desc, icon });
        setTimeout(() => {
          setAchievementToast(null);
        }, 4000);
      }
    } catch (e) {
      console.error("업적 저장 실패:", e);
    }
  };

  // 1. 스테이지 퀴즈 데이터 로드 (jlptLevel과 difficulty 파라미터를 둘 다 전송)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/stages/${stageNumber}?jlptLevel=${jlptLevel}&difficulty=${difficulty}`);
        const data = await res.json();
        if (data.success) {
          setStage(data.stage);
          setQuizzes(data.quizzes);
          
          if (data.quizzes[0]?.quizType === 'WORDLE') {
            initWordleTiles(data.quizzes[0].japaneseWord.length);
          }
        } else {
          alert(data.error || '퀴즈 로드 실패');
          router.push('/');
        }
      } catch (e) {
        alert('데이터를 가져오는 중 오류가 발생했습니다.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stageNumber, jlptLevel, difficulty, router]);

  // 2. 타이머 작동
  useEffect(() => {
    if (loading || gameCompleted || submitted) return;
    
    timerRef.current = setInterval(() => {
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, gameCompleted, submitted]);

  // 워들 입력 타일 초기화
  const initWordleTiles = (length) => {
    setWordleInput(Array(length).fill(''));
    setWordleFeedback(Array(length).fill(''));
    setWordleAttempts([]);
    setWordleFinished(false);
  };

  const currentQuiz = quizzes[currentIndex];

  // 3. 🖌️ [구글 손글씨 판별기 코어 드로잉 핸들러]
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const isTouch = e.touches && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    // 캔버스 내부 픽셀 해상도와 브라우저상 물리 렌더링 크기 간의 배율 보정
    const scaleX = rect.width > 0 ? (canvas.width / rect.width) : 1;
    const scaleY = rect.height > 0 ? (canvas.height / rect.height) : 1;
    
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getMousePos(e);
    
    strokeXRef.current = [pos.x];
    strokeYRef.current = [pos.y];
    startTimeRef.current = Date.now();
    strokeTimeRef.current = [0];
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);

    // 속도 계산을 통한 실시간 먹물 압력(브러시 두께) 시뮬레이션
    const prevX = strokeXRef.current[strokeXRef.current.length - 1];
    const prevY = strokeYRef.current[strokeYRef.current.length - 1];
    const prevTime = startTimeRef.current + strokeTimeRef.current[strokeTimeRef.current.length - 1];
    
    const dx = pos.x - prevX;
    const dy = pos.y - prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const timeDiff = Math.max(1, Date.now() - prevTime);
    const speed = dist / timeDiff; // 속도 (px/ms)
    
    // 속도가 빠를 때는 가늘어지고, 느릴 때는 벼루에 먹물이 번지듯 묵직하게 두꺼워짐
    const minWidth = Math.max(1.5, brushSize - 3.5);
    const maxWidth = brushSize + 4.5;
    const targetWidth = Math.max(minWidth, maxWidth - speed * 3.5);
    
    // 부드러운 굵기 전이 (Lerp)
    ctx.lineWidth = ctx.lineWidth ? (ctx.lineWidth * 0.55 + targetWidth * 0.45) : targetWidth;
    
    ctx.strokeStyle = 'var(--text-primary)'; 
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    
    // 2차 베지에 곡선을 이용해 꺾임 부분을 부드럽게 보정
    if (strokeXRef.current.length > 1) {
      const prevPrevX = strokeXRef.current[strokeXRef.current.length - 2];
      const prevPrevY = strokeYRef.current[strokeYRef.current.length - 2];
      
      // 중간 지점을 향해 2차 베지에 제어점(prevX, prevY)을 두고 그림
      const midX = (prevX + pos.x) / 2;
      const midY = (prevY + pos.y) / 2;
      
      ctx.moveTo(prevPrevX, prevPrevY);
      ctx.quadraticCurveTo(prevX, prevY, midX, midY);
    } else {
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(pos.x, pos.y);
    }
    
    ctx.stroke();

    // 획 좌표 및 시간 누적
    strokeXRef.current.push(pos.x);
    strokeYRef.current.push(pos.y);
    strokeTimeRef.current.push(Date.now() - startTimeRef.current);
  };

  // 마우스/터치 업 시 수집된 획을 큐에 적재하고 구글에 손글씨 해독 요청 날림
  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // 1획(Stroke) 데이터 조립: [[x...], [y...], [t...]]
    const newStroke = [
      [...strokeXRef.current],
      [...strokeYRef.current],
      [...strokeTimeRef.current]
    ];

    const updatedInk = [...ink, newStroke];
    setInk(updatedInk);

    // 구글 손글씨 해독 API 트리거 호출
    recognizeHandwriting(updatedInk);
  };

  // 🧠 [구글 실시간 손글씨 해독 API 호출 함수]
  const recognizeHandwriting = async (inkData) => {
    if (inkData.length === 0) return;
    setRecognizing(true);

    try {
      // 구글의 공식 번역/IME 손글씨 해독 무료 API 엔드포인트 호출
      const response = await fetch('https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app: 'translate',
          base_url: 'https://translate.google.com',
          device: 'os_meta',
          input_type: '0',
          languages: ['ja'],
          requests: [
            {
              writing_area_width: 340,
              writing_area_height: 340,
              ink: inkData
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data && data[0] === 'SUCCESS') {
        const parsedCandidates = data[1][0][1]; // 구글이 해독에 성공한 문자 후보 배열
        setCandidates(parsedCandidates.slice(0, 5)); // 상위 5개 후보 노출
      }
    } catch (e) {
      console.error("구글 손글씨 판별 API 통신 에러:", e);
    } finally {
      setRecognizing(false);
    }
  };

  // 캔버스 지우개 & 데이터 초기화 연동
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setInk([]);
    setCandidates([]);
    setTypedAnswer(''); // 주관식 입력 문자열도 깨끗이 비워 연동
  };

  // 문제 전환 시 자동 비우기
  useEffect(() => {
    clearCanvas();
  }, [currentIndex]);

  // TTS 듣기 퀴즈 진입 시 음성 자동 재생
  useEffect(() => {
    if (!currentQuiz) return;
    if (currentQuiz.quizType === 'LISTENING') {
      const timer = setTimeout(() => {
        speak(currentQuiz.japaneseWord);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentQuiz, speak]);

  // 단어 북마크 등록
  const handleAddBookmark = async () => {
    if (!currentQuiz || bookmarking) return;
    setBookmarking(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: currentQuiz.japaneseWord,
          meaning: currentQuiz.correctAnswer,
          reading: currentQuiz.pronunciation
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookmarkedList(prev => ({ ...prev, [currentQuiz.japaneseWord]: true }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarking(false);
    }
  };

  // ✍️ [주관식/드로잉 정답 제출 및 채점 처리]
  const handleSubmission = async (finalAns) => {
    if (submitted) return;
    clearInterval(timerRef.current);

    // 공백을 다듬고 영단어/한자/일어가 완벽하게 일치하는지 비교
    const isCorrectAns = finalAns.trim() === currentQuiz.correctAnswer.trim() || 
                         finalAns.trim() === currentQuiz.japaneseWord.trim();
    setIsCorrect(isCorrectAns);
    setSelectedAns(finalAns);

    let finalPoints = 0;
    let nextCombo = comboCount;

    if (isCorrectAns) {
      nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      
      // 꽃가루 팡파르 발사!
      triggerConfetti();

      // [업적 체크] 연속 5콤보 달성 시
      if (nextCombo >= 5) {
        unlockAchievement('combo_master', '🔥 콤보의 신화', '연속 5문제 정답 콤보 달성!', '🔥');
      }

      // [업적 체크] 그림판 손글씨 주관식 제출 3회 성공 누적 시
      if (ink.length > 0) {
        const nextDrawCount = drawingSubmissions + 1;
        setDrawingSubmissions(nextDrawCount);
        if (nextDrawCount >= 3) {
          unlockAchievement('calligraphy_pro', '🖌️ 손글씨의 달인', '그림판 손글씨 주관식 답안으로 3회 제출 성공!', '🖌️');
        }
      }
    } else {
      nextCombo = 0;
      setComboCount(0);
    }

    try {
      const res = await fetch('/api/play/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: currentQuiz.id,
          isCorrect: isCorrectAns,
          timeTaken,
          selectedAnswer: finalAns
        })
      });
      const data = await res.json();
      
      if (data.success) {
        let baseEarn = data.pointsEarned;
        if (jlptLevel === 'N1') baseEarn += 10; // N1 보너스 +10pts
        
        // 콤보 포인트 배수 가중치 적용 (콤보당 +10% 보너스 포인트 지급)
        const comboBonus = isCorrectAns ? Math.round(baseEarn * (nextCombo * 0.1)) : 0;
        finalPoints = baseEarn + comboBonus;

        setPointsEarned(finalPoints);
        setTotalPointsEarned(prev => prev + finalPoints);
        if (isCorrectAns) setUserScore(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }

    // [업적 체크] 마지막 문제 제출이었을 경우 스테이지 전체 완료 업적 달성 검사
    if (currentIndex + 1 === quizzes.length) {
      // 1. 첫 클리어 업적
      unlockAchievement('first_clear', '🐣 첫걸음마', '아무 퀴즈나 1회 클리어하기', '🐣');
      
      // 2. 무결점 클리어 업적 (만점)
      const currentFinalScore = userScore + (isCorrectAns ? 1 : 0);
      if (currentFinalScore === quizzes.length) {
        unlockAchievement('perfect_clear', '💯 무결점의 신', '한 스테이지에서 5문제 모두 맞히기!', '💯');
      }

      // 3. N1 스테이지 전체 격파 업적
      if (jlptLevel === 'N1') {
        unlockAchievement('n1_slayer', '⚔️ N1 격파자', 'JLPT N1 난이도의 스테이지 완수!', '⚔️');
      }
    }

    setSubmitted(true);
  };

  // 워들 한 글자씩 입력 처리
  const handleWordleChange = (val, idx) => {
    if (wordleFinished) return;
    const newInput = [...wordleInput];
    newInput[idx] = val.trim();
    setWordleInput(newInput);

    if (val && idx < currentQuiz.japaneseWord.length - 1) {
      const nextInput = document.getElementById(`wordle-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // 워들 정답 제출
  const handleWordleSubmit = async () => {
    if (wordleFinished) return;
    
    const userGuess = wordleInput.join('');
    if (userGuess.length < currentQuiz.japaneseWord.length) {
      alert("글자 수에 맞춰 칸을 다 채워주세요!");
      return;
    }

    const targetWord = currentQuiz.japaneseWord;
    const newFeedback = Array(targetWord.length).fill('gray');

    const checkedTarget = Array(targetWord.length).fill(false);
    const checkedGuess = Array(targetWord.length).fill(false);

    for (let i = 0; i < targetWord.length; i++) {
      if (userGuess[i] === targetWord[i]) {
        newFeedback[i] = 'green';
        checkedTarget[i] = true;
        checkedGuess[i] = true;
      }
    }

    for (let i = 0; i < targetWord.length; i++) {
      if (checkedGuess[i]) continue;
      for (let j = 0; j < targetWord.length; j++) {
        if (!checkedTarget[j] && userGuess[i] === targetWord[j]) {
          newFeedback[i] = 'yellow';
          checkedTarget[j] = true;
          break;
        }
      }
    }

    const currentAttempt = { guess: userGuess, feedback: newFeedback };
    const updatedAttempts = [...wordleAttempts, currentAttempt];
    setWordleAttempts(updatedAttempts);

    const isMatch = userGuess === targetWord;

    if (isMatch || updatedAttempts.length >= wordleMaxAttempts) {
      setWordleFinished(true);
      clearInterval(timerRef.current);
      setIsCorrect(isMatch);

      let finalPoints = 0;
      let nextCombo = comboCount;

      if (isMatch) {
        nextCombo = comboCount + 1;
        setComboCount(nextCombo);
        
        // 꽃가루 팡파르 발사!
        triggerConfetti();

        // 5연속 콤보 신화 업적 체크
        if (nextCombo >= 5) {
          unlockAchievement('combo_master', '🔥 콤보의 신화', '연속 5문제 정답 콤보 달성!', '🔥');
        }
      } else {
        nextCombo = 0;
        setComboCount(0);
      }

      try {
        const res = await fetch('/api/play/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: currentQuiz.id,
            isCorrect: isMatch,
            timeTaken,
            selectedAnswer: userGuess
          })
        });
        const data = await res.json();
        if (data.success) {
          let baseEarn = data.pointsEarned;
          if (jlptLevel === 'N1') baseEarn += 10;
          
          // 콤보 포인트 배수 가중치 적용 (콤보당 +10% 보너스 포인트 지급)
          const comboBonus = isMatch ? Math.round(baseEarn * (nextCombo * 0.1)) : 0;
          finalPoints = baseEarn + comboBonus;

          setPointsEarned(finalPoints);
          setTotalPointsEarned(prev => prev + finalPoints);
          if (isMatch) setUserScore(prev => prev + 1);
        }
      } catch (e) {
        console.error(e);
      }

      // [업적 체크] 마지막 문제 제출이었을 경우 스테이지 전체 완료 업적 달성 검사
      if (currentIndex + 1 === quizzes.length) {
        // 1. 첫 클리어 업적
        unlockAchievement('first_clear', '🐣 첫걸음마', '아무 퀴즈나 1회 클리어하기', '🐣');
        
        // 2. 무결점 클리어 업적 (만점)
        const currentFinalScore = userScore + (isMatch ? 1 : 0);
        if (currentFinalScore === quizzes.length) {
          unlockAchievement('perfect_clear', '💯 무결점의 신', '한 스테이지에서 5문제 모두 맞히기!', '💯');
        }

        // 3. N1 스테이지 전체 격파 업적
        if (jlptLevel === 'N1') {
          unlockAchievement('n1_slayer', '⚔️ N1 격파자', 'JLPT N1 난이도의 스테이지 완수!', '⚔️');
        }
      }

      setSubmitted(true);
    } else {
      setWordleInput(Array(targetWord.length).fill(''));
      const firstInput = document.getElementById('wordle-0');
      if (firstInput) firstInput.focus();
    }
  };

  // 다음 문제 넘어가기
  const handleNextQuiz = () => {
    if (currentIndex + 1 < quizzes.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      
      setSelectedAns(null);
      setSubmitted(false);
      setIsCorrect(false);
      setPointsEarned(0);
      setTimeTaken(0);

      if (quizzes[nextIdx].quizType === 'WORDLE') {
        initWordleTiles(quizzes[nextIdx].japaneseWord.length);
      }
    } else {
      setGameCompleted(true);
    }
  };

  // 🔮 [3.8.8 명품 글래스모피즘] 3D 입체 틸트 & 마우스 광택 실시간 좌표 핸들러
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = x / rect.width - 0.5;
    const yc = y / rect.height - 0.5;
    
    const rotateX = yc * -6; // 플레이 몰입 방해를 막기 위해 아주 미세한 6도 틸팅
    const rotateY = xc * 6;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.006)`;
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>🌸</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>퀴즈를 아름답게 섞어오는 중...</h3>
      </div>
    );
  }

  const hasDrawingFeature = stage && stage.category !== 'VOCAB' && stage.category !== 'LISTENING';

  return (
    <div className="container" style={{ maxWidth: '1280px', padding: '40px 24px', position: 'relative' }}>
      
      {/* 🌌 뒷편에서 몽환적으로 일렁이는 오로라 백그라운드 구체 오버레이 */}
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>
      
      {/* 1. 상단 진행 상태바 */}
      {!gameCompleted && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'nowrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
              <span>STAGE {stage.stageNumber} • {stage.title}</span>
              
              {/* JLPT 급수 배지 */}
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                background: jlptLevel === 'N2' ? '#ff949422' : '#1a4d8022',
                color: jlptLevel === 'N2' ? '#ff9494' : '#1a4d80',
                padding: '4px 10px',
                borderRadius: '100px',
                border: `1.5px solid ${jlptLevel === 'N2' ? '#ff949488' : '#1a4d8088'}`,
                whiteSpace: 'nowrap'
              }}>
                급수: {jlptLevel}
              </span>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                background: difficulty === 'EASY' ? '#557c5522' : difficulty === 'MEDIUM' ? '#ff9f4322' : '#ff6b6b22',
                color: difficulty === 'EASY' ? '#557c55' : difficulty === 'MEDIUM' ? '#ff9f43' : '#ff6b6b',
                padding: '3px 8px',
                borderRadius: '100px',
                border: '1.5px solid transparent'
              }}>
                난이도: {difficulty}
              </span>
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--accent-color)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              {comboCount > 0 && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #ff9f43 0%, #ff5e7e 100%)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  boxShadow: '0 4px 12px rgba(255, 94, 126, 0.4)',
                  animation: 'pulse 1s infinite',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔥 {comboCount} COMBO!
                </span>
              )}
              <span>문제 {currentIndex + 1} / {quizzes.length}</span>
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '100px', overflow: 'hidden' }}>
            <div 
              style={{
                width: `${((currentIndex + 1) / quizzes.length) * 100}%`,
                height: '100%',
                background: 'var(--accent-color)',
                borderRadius: '100px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      )}

      {gameCompleted ? (
        /* ==================== [결과 리포트 UI] ==================== */
        <div className="glass-premium-card rainbow-border" 
          onMouseMove={handleMouseMove} 
          onMouseLeave={handleMouseLeave}
          style={{ padding: '48px 36px', textAlign: 'center', maxWidth: '650px', margin: '0 auto', background: 'rgba(255,255,255,0.04)' }}
        >
          <span style={{ fontSize: '5rem', display: 'block', marginBottom: '16px', animation: 'pulse 2.5s infinite' }}>🏆</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '8px', color: 'var(--text-primary)' }}>스테이지 완벽 격파!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600', marginBottom: '32px' }}>
            {stage.title} [{jlptLevel} • {difficulty}] 코스를 성공적으로 완수하셨습니다!
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '40px',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(8px)',
            padding: '24px',
            borderRadius: 'var(--custom-radius)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px' }}>최종 성적</span>
              <span style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--accent-color)' }}>
                {userScore} / {quizzes.length} <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>개 정답</span>
              </span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px' }}>획득한 포인트</span>
              <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ff9f43' }}>
                +{totalPointsEarned} <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>pts</span>
              </span>
            </div>
          </div>

          <Link href="/" passHref legacyBehavior>
            <a className="glass-neon-btn" style={{
              padding: '16px 40px',
              fontSize: '1.05rem',
              borderRadius: '100px',
              textDecoration: 'none',
              boxShadow: 'var(--neon-glow)'
            }}>
              🏠 로드맵 홈으로 복귀
            </a>
          </Link>
        </div>
      ) : (
        /* ==================== [3.5 캘리그래피그림판 연동 2단 레이아웃] ==================== */
        <div style={{
          display: 'grid',
          gridTemplateColumns: (isDrawingOpen && hasDrawingFeature) ? '1.2fr 1fr' : '1fr',
          gap: '30px',
          transition: 'all 0.4s ease'
        }}>
          
          {/* [좌측 판넬]: 핵심 퀴즈 및 주관식 입력/제출지 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="glass-premium-card rainbow-border" 
              onMouseMove={handleMouseMove} 
              onMouseLeave={handleMouseLeave}
              style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.04)' }}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => speak(currentQuiz.japaneseWord)}
                    className="outline-btn"
                    style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🔊 발음 듣기
                  </button>
                  {hasDrawingFeature && (
                    <button 
                      onClick={() => setIsDrawingOpen(!isDrawingOpen)}
                      className="outline-btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderColor: isDrawingOpen ? 'var(--accent-color)' : 'var(--card-border)'
                      }}
                    >
                      🖌️ 손글씨 판별 그림판 {isDrawingOpen ? '접기' : '켜기'}
                    </button>
                  )}
                </div>

                <button
                  onClick={handleAddBookmark}
                  disabled={bookmarking || bookmarkedList[currentQuiz.japaneseWord]}
                  className="outline-btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: bookmarkedList[currentQuiz.japaneseWord] ? 'var(--accent-color)' : 'var(--card-border)',
                    color: bookmarkedList[currentQuiz.japaneseWord] ? 'var(--accent-color)' : 'var(--text-secondary)'
                  }}
                >
                  ⭐ {bookmarkedList[currentQuiz.japaneseWord] ? '단어장 저장됨' : '단어장에 추가'}
                </button>
              </div>

              {/* 퀴즈 질문 */}
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
                  {currentQuiz.questionText
                    .replace(/\[N(1|2)-(EASY|MEDIUM|HARD)\]\s*/g, '')
                    .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
                    .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '')}
                </p>
                
                 {currentQuiz.quizType !== 'LISTENING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    
                    {/* 붓글씨 기능이 활성화된 스테이지에서만 획수 가이드 배지 노출 */}
                    {hasDrawingFeature && (
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '850',
                        background: 'rgba(84, 160, 255, 0.12)',
                        color: '#54a0ff',
                        padding: '4px 12px',
                        borderRadius: '100px',
                        border: '1.5px solid rgba(84, 160, 255, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        userSelect: 'none'
                      }}>
                        📖 한자 획수 가이드: <strong>{getJapaneseWordStrokes(currentQuiz.japaneseWord)}획</strong>
                      </span>
                    )}

                    {/* 정답 단어(japaneseWord) 스포일러 격리 차단 로직 */}
                    {submitted ? (
                      // 1) 제출이 끝났을 경우: 해설 검토를 위해 한자 단어 공개
                      <h3 style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px', marginTop: '6px' }}>
                        {currentQuiz.japaneseWord}
                      </h3>
                    ) : (
                      // 2) 플레이 중인 경우: 카테고리별 철저 분기
                      stage.category === 'WORDLE' ? (
                        <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px', marginTop: '12px' }}>
                          🧩 숨겨진 {currentQuiz.japaneseWord.length}글자 단어 맞추기
                        </h3>
                      ) : stage.category === 'GRAMMAR' ? (
                        // 문법 조사는 문장만 보고 사지선다를 풀어야 하므로 단어 노출 금지
                        null
                      ) : (
                        // 문자 정복 등은 한자를 보고 풀어야 하므로 기존 한자 노출
                        <h3 style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px', marginTop: '6px' }}>
                          {currentQuiz.japaneseWord}
                        </h3>
                      )
                    )}

                  </div>
                )}

                {/* 청해 파동 아레나 */}
                {currentQuiz.quizType === 'LISTENING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                    <button 
                      onClick={() => speak(currentQuiz.japaneseWord)}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        border: '3px solid var(--accent-color)',
                        background: 'var(--bg-secondary)',
                        fontSize: '2.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--neon-glow)',
                      }}
                      className="pulse-ani"
                    >
                      🎧
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                      스피커를 눌러 원어민 일본어 발음을 청취하세요.
                    </span>
                  </div>
                )}
              </div>

              {/* ==================== [3.5 붓글씨 그림판 기반 주관식 제출 통합지] ==================== */}
              <div style={{
                marginTop: '10px',
                background: 'var(--bg-secondary)',
                padding: '24px',
                borderRadius: 'var(--custom-radius)',
                border: '1.5px dashed var(--card-border)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                  ✍️ 손글씨 주관식 정답 입력
                </span>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder={hasDrawingFeature ? "오른쪽 그림판에 글씨를 쓰거나 직접 입력하세요." : "정답을 직접 키보드로 입력하세요."}
                    disabled={submitted}
                    style={{
                      flexGrow: 1,
                      padding: '14px 20px',
                      fontSize: '1rem',
                      fontWeight: '800',
                      borderRadius: 'var(--custom-radius)',
                      border: '2px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  
                  <button
                    onClick={() => handleSubmission(typedAnswer)}
                    disabled={submitted || !typedAnswer}
                    className="glow-btn"
                    style={{
                      padding: '14px 28px',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    주관식 제출 ➔
                  </button>
                </div>
              </div>

              {/* [기존 사지선다 보기도 하단 보조 힌트로 유지] */}
              {(currentQuiz.options && currentQuiz.options.length > 0) && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    💡 참고용 객관식 사지선다형 보기 (객관식으로 즉시 맞추기 가능)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {currentQuiz.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTypedAnswer(option);
                          handleSubmission(option);
                        }}
                        disabled={submitted}
                        className="outline-btn"
                        style={{
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {idx + 1}. {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 워들 퀴즈 입력란 */}
              {currentQuiz.quizType === 'WORDLE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block' }}>
                    🧩 워들 퀴즈 전용 입력판 (칸별 글자 힌트 대입)
                  </span>
                  
                  {wordleAttempts.map((attempt, attemptIdx) => (
                    <div key={attemptIdx} style={{ display: 'flex', gap: '6px' }}>
                      {attempt.guess.split('').map((char, charIdx) => {
                        const colorMap = { green: 'var(--accent-color)', yellow: '#ffb37e', gray: '#8b92b6' };
                        return (
                          <div
                            key={charIdx}
                            style={{
                              width: '42px',
                              height: '42px',
                              background: colorMap[attempt.feedback[charIdx]],
                              color: '#ffffff',
                              fontWeight: '800',
                              fontSize: '1.1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '8px'
                            }}
                          >
                            {char}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {!wordleFinished && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {wordleInput.map((char, idx) => (
                        <input
                          key={idx}
                          id={`wordle-${idx}`}
                          type="text"
                          maxLength={1}
                          value={char}
                          onChange={(e) => handleWordleChange(e.target.value, idx)}
                          style={{
                            width: '42px',
                            height: '42px',
                            background: 'var(--bg-secondary)',
                            border: '2.5px solid var(--card-border)',
                            color: 'var(--text-primary)',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            textAlign: 'center',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {!submitted && (
                    <button 
                      onClick={handleWordleSubmit}
                      className="glow-btn"
                      style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                    >
                      정답 검증 (제출)
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* 정오답 피드백 */}
            {submitted && (
              <div 
                className="premium-card" 
                style={{
                  padding: '20px 28px',
                  background: isCorrect ? 'rgba(85, 124, 85, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                  borderColor: isCorrect ? 'var(--accent-color)' : '#ff6b6b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    color: isCorrect ? 'var(--accent-color)' : '#ff6b6b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {isCorrect ? '🎉 정답입니다!' : '😢 아쉬운 오답입니다...'}
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '100px' }}>
                      {isCorrect ? `+${pointsEarned} pts 획득` : '오답노트에 자동 적재'}
                    </span>
                  </span>
                  <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    요미가나(발음): <strong style={{ color: 'var(--text-primary)' }}>{currentQuiz.pronunciation}</strong>
                  </p>
                  <p style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700' }}>
                    정답: <strong style={{ textDecoration: 'underline' }}>{currentQuiz.correctAnswer}</strong> (요미가나) 또는 <strong style={{ textDecoration: 'underline' }}>{currentQuiz.japaneseWord}</strong> (한자/원어)
                  </p>
                  {currentQuiz.hint && (
                    <p style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      💡 설명: {currentQuiz.hint}
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleNextQuiz}
                  className="glow-btn"
                  style={{ padding: '12px 24px' }}
                >
                  {currentIndex + 1 === quizzes.length ? '결과 확인 ➔' : '다음 문제 ➔'}
                </button>
              </div>
            )}

          </div>

          {/* [우측 판넬]: 🖌️ 캘리그래피 손글씨 판독 그림판 */}
          {isDrawingOpen && hasDrawingFeature && (
            <div className="premium-card" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: 'fit-content',
              borderColor: 'var(--accent-color)',
              boxShadow: 'var(--neon-glow)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🖌️ 손글씨 판독기 (Drawing OCR)
                </h4>
                <button
                  onClick={() => setShowOverlayGuide(!showOverlayGuide)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    border: '1px solid var(--card-border)',
                    background: showOverlayGuide ? 'var(--accent-color)' : 'transparent',
                    color: showOverlayGuide ? '#ffffff' : 'var(--text-secondary)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {showOverlayGuide ? '가이드 숨기기' : '정답 겹쳐보기 👁️'}
                </button>
              </div>

              {/* 그림판 캔버스 영역 */}
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '2px solid var(--card-border)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                
                {/* 정답 반투명 가이드라인 워터마크 */}
                {showOverlayGuide && currentQuiz.quizType !== 'LISTENING' && (
                  <div style={{
                    position: 'absolute',
                    fontSize: '6.5rem',
                    fontWeight: '900',
                    fontFamily: '"Noto Sans JP", sans-serif',
                    color: 'var(--text-primary)',
                    opacity: 0.13, 
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textAlign: 'center',
                    zIndex: 0,
                    wordBreak: 'break-all',
                    maxWidth: '90%'
                  }}>
                    {currentQuiz.japaneseWord}
                  </div>
                )}

                {/* 실제 그림을 그리는 HTML5 Canvas */}
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={340}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'crosshair',
                    zIndex: 1
                  }}
                />
              </div>

              {/* 캔버스 조작 컨트롤러 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1, marginRight: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>두께</span>
                  <input 
                    type="range" 
                    min={2} max={16} 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>{brushSize}px</span>
                </div>

                <button 
                  onClick={clearCanvas}
                  className="outline-btn"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  🧹 그림판 지우기
                </button>
              </div>

              {/* ==================== [구글 실시간 문자 해독 결과 팝업 보드] ==================== */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--card-border)',
                marginTop: '6px'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  {recognizing ? '⏳ 인공지능이 손글씨 해독 중...' : '🧠 구글 실시간 해독 추천 (클릭 시 입력칸에 조립):'}
                </span>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '34px', alignItems: 'center' }}>
                  {candidates.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '4px' }}>
                      왼쪽 그림판에 마우스/터치 펜으로 일본어를 그려주세요.
                    </span>
                  ) : (
                    candidates.map((char, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setTypedAnswer(prev => prev + char);
                          speak(char); // 입력 시 신나게 소리 발음
                        }}
                        disabled={submitted}
                        style={{
                          background: 'var(--card-bg)',
                          border: '1.5px solid var(--card-border)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          fontWeight: '900',
                          padding: '6px 14px',
                          borderRadius: '100px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                        onMouseLeave={(e) => e.target.style.borderColor = 'var(--card-border)'}
                      >
                        {char}
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 🎉 [3.8.5 프리미엄 꽃가루 confetti 캔버스] */}
      <canvas 
        ref={confettiCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 99999
        }}
      />

      {/* 🏆 [3.8.5 프리미엄 우주선 슬라이딩 업적 잠금 해제 알림 토스트] */}
      {achievementToast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%)',
          color: '#ffffff',
          padding: '16px 28px',
          borderRadius: '16px',
          border: '2px solid #ff9f43',
          boxShadow: '0 12px 40px rgba(255, 159, 67, 0.4), var(--neon-glow)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 100000,
          animation: 'slideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          maxWidth: '380px'
        }}>
          <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}>{achievementToast.icon}</span>
          <div>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '900',
              color: '#ff9f43',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '2px'
            }}>
              🏆 ACHIEVEMENT UNLOCKED!
            </span>
            <strong style={{ display: 'block', fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>
              {achievementToast.title}
            </strong>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#b5c0d9', fontWeight: '600', marginTop: '2px' }}>
              {achievementToast.desc}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
