'use client';

import { use, useState, useEffect, useRef } from 'react';
import SentenceAssembly from '@/app/components/SentenceAssembly';
import QuestionOptions from '@/app/components/QuestionOptions';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { showToast } from '@/lib/toast';
import ReadableText from '@/app/ReadableText';
import { evaluateQuizAnswer } from '@/lib/quizScoring.mjs';
import { beginnerCourseForRoute } from '@/data/beginnerCourses.mjs';

export default function PlayStagePage({ params }) {
  const { stageNumber: stageNumberParam } = use(params);
  const stageNumber = parseInt(stageNumberParam, 10);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 지원 트랙과 아레나 카테고리 파싱
  const jlptLevel = searchParams.get('jlptLevel') === 'BEGINNER' ? 'BEGINNER' : 'N1';
  const difficulty = searchParams.get('difficulty') || 'EASY';
  const category = searchParams.get('category') || '';
  const isBeginner = jlptLevel === 'BEGINNER';
  const beginnerLevelLabel = category === 'KANA' ? '문자 입문' : ({ EASY: '기초', MEDIUM: '기본 응용', HARD: '중급 입문' }[difficulty] || '기초');
  const difficultyLabel = { EASY: '쉬움', MEDIUM: '보통', HARD: '어려움' }[difficulty] || difficulty;
  const trackLabel = isBeginner ? `초보 ${beginnerLevelLabel}` : 'N1';
  const { speak } = useJapaneseSpeech();

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 게임 진행 상태

  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);

  // 워들 전용 상태
  const [wordleInput, setWordleInput] = useState([]);

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
  const handleSubmissionRef = useRef(null);

  // ⏱️ 타임어택 서바이벌 모드 상태
  const [isTimeAttack, setIsTimeAttack] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [speedBonusEarned, setSpeedBonusEarned] = useState(0);

  // ⚔️ 문장 조립판 상태
  const [assemblyPads, setAssemblyPads] = useState([]);


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

  const isDrawingRef = useRef(false);
  const strokeXRef = useRef([]);
  const strokeYRef = useRef([]);
  const strokeTimeRef = useRef([]);
  const startTimeRef = useRef(0);

  // 📱 모바일 그림판 터치 스크롤 방지: passive: false로 DOM 이벤트 직접 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventScroll = (e) => {
      if (isDrawingRef.current) {
        e.preventDefault(); // passive: false 이벤트만 여기서 preventDefault 가능
      }
    };

    // React onTouchMove는 passive:true로 등록되어 preventDefault가 동작하지 않음
    // 직접 DOM에 passive:false로 등록해야 추적 중 스크롤이 차단됨
    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    canvas.addEventListener('touchstart', preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchmove', preventScroll);
      canvas.removeEventListener('touchstart', preventScroll);
    };
  }, []);

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

  // 1. 선택한 트랙·난이도·아레나의 퀴즈 데이터 로드
  useEffect(() => {
    if (!isBeginner && stageNumber === 6) {
      router.replace('/mock-exam');
      return;
    }
    if (isBeginner) {
      const course = beginnerCourseForRoute(stageNumber, category);
      if (course && course.stageNumber !== stageNumber) {
        router.replace(`/play/${course.stageNumber}?jlptLevel=BEGINNER&category=${course.category}&difficulty=${difficulty}`);
        return;
      }
    }
    async function loadData() {
      setLoading(true);
      try {
        const query = new URLSearchParams({ jlptLevel });
        if (isBeginner) query.set('difficulty', difficulty);
        if (category) query.set('category', category);
        const res = await fetch(`/api/stages/${stageNumber}?${query.toString()}`);
        const data = await res.json();
        if (data.success) {
          setStage(data.stage);
          setQuizzes(data.quizzes);

          if (data.quizzes[0]?.quizType === 'WORDLE') {
            initWordleTiles(data.quizzes[0].japaneseWord.length);
          }
        } else {
          showToast(data.error || '퀴즈 로드 실패', 'error');
          router.push('/');
        }
      } catch (e) {
        showToast('데이터를 가져오는 중 오류가 발생했습니다.', 'error');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stageNumber, jlptLevel, difficulty, category, router, isBeginner]);

  // 2. 타이머 작동
  useEffect(() => {
    if (loading || gameCompleted || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeTaken(prev => prev + 1);

      if (isTimeAttack) {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // 0초가 되면 타임오버 강제 오답 제출
            handleSubmissionRef.current?.("");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, gameCompleted, submitted, isTimeAttack, stageNumber]);

  // 워들 입력 타일 초기화
  const initWordleTiles = (length) => {
    setWordleInput(Array(length).fill(''));

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
    // preventDefault는 passive:false DOM 리스너에서만 호출 - React 합성이벤트(passive)에서는 경고 발생
    isDrawingRef.current = true;
    const pos = getMousePos(e);

    strokeXRef.current = [pos.x];
    strokeYRef.current = [pos.y];
    startTimeRef.current = Date.now();
    strokeTimeRef.current = [0];
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    // preventDefault는 passive:false DOM 리스너에서만 호출 (touch-action:none + DOM 리스너가 스크롤 차단)
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

  // 캔버스 지우개 & 데이터 초기화 연동 (clearInput이 true일 때만 입력칸을 비움)
  const clearCanvas = (clearInput = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setInk([]);
    setCandidates([]);
    if (clearInput) {
      setTypedAnswer(''); // 명시적으로 비우라고 했을 때만 주관식 입력 문자열 비우기
    }
  };

  // 문제 전환 시 자동 비우기 및 타임어택/조립판 리셋
  useEffect(() => {
    clearCanvas(true);
    if (isTimeAttack) {
      setTimeRemaining(20);
    }
    setSpeedBonusEarned(0);
    setAssemblyPads([]);
  }, [currentIndex, isTimeAttack]);

  // TTS 듣기 퀴즈 진입 시 음성 자동 재생
  useEffect(() => {
    if (!currentQuiz) return;
    if (currentQuiz.quizType === 'LISTENING') {
      const timer = setTimeout(() => {
        speak(currentQuiz.japaneseWord, isBeginner ? 0.85 : 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentQuiz, speak, isBeginner]);

  // 단어 북마크 등록
  const handleAddBookmark = async () => {
    if (!currentQuiz || bookmarking) return;
    setBookmarking(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          word: currentQuiz.japaneseWord,
          meaning: currentQuiz.hint || currentQuiz.correctAnswer, // hint(진짜 한글 뜻)를 우선 저장!
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
    const isCorrectAns = evaluateQuizAnswer(finalAns, currentQuiz);
    setIsCorrect(isCorrectAns);


    let finalPoints = 0;
    let nextCombo = comboCount;

    if (isCorrectAns) {
      nextCombo = comboCount + 1;
      setComboCount(nextCombo);

      // 꽃가루 팡파르 발사!
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
        headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          quizId: currentQuiz.id,
          timeTaken,
          selectedAnswer: finalAns
        })
      });
      const data = await res.json();

      if (data.success) {
        const verifiedCorrect = data.isCorrect;
        setIsCorrect(verifiedCorrect);
        let baseEarn = data.pointsEarned;
        if (jlptLevel === 'N1') baseEarn += 10; // N1 보너스 +10pts

        // 콤보 포인트 배수 가중치 적용 (콤보당 +10% 보너스 포인트 지급)
        const comboBonus = verifiedCorrect ? Math.round(baseEarn * (nextCombo * 0.1)) : 0;

        // ⏱️ 타임어택 속도 보너스 포인트 계산 (남은시간 * 1.5배, 정답일 때만 적용)
        const speedBonus = (isTimeAttack && verifiedCorrect) ? Math.round(timeRemaining * 1.5) : 0;
        setSpeedBonusEarned(speedBonus);

        finalPoints = baseEarn + comboBonus + speedBonus;

        setPointsEarned(finalPoints);
        setTotalPointsEarned(prev => prev + finalPoints);
        if (verifiedCorrect) setUserScore(prev => prev + 1);

        // 스피드 보너스 획득 시 번개 토스트 파이어!
        if (speedBonus > 0) {
          unlockAchievement('speed_runner', '⚡ 번개 속도의 질주', `제한시간 내 정답 제출! 속도 보너스 +${speedBonus}pts 획득!`, '⚡');
        }
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
        unlockAchievement('perfect_clear', '💯 무결점의 신', '한 스테이지에서 모든 문제 모두 맞히기!', '💯');
      }

      // 3. N1 스테이지 전체 격파 업적
      if (jlptLevel === 'N1') {
        unlockAchievement('n1_slayer', '⚔️ N1 격파자', 'JLPT N1 난이도의 스테이지 완수!', '⚔️');
      }
    }

    setSubmitted(true);
  };

  handleSubmissionRef.current = handleSubmission;

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
      showToast("글자 수에 맞춰 칸을 다 채워주세요!", 'error');
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
          headers: getSyncHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            quizId: currentQuiz.id,
            timeTaken,
            selectedAnswer: userGuess
          })
        });
        const data = await res.json();
        if (data.success) {
          const verifiedCorrect = data.isCorrect;
          setIsCorrect(verifiedCorrect);
          let baseEarn = data.pointsEarned;
          if (jlptLevel === 'N1') baseEarn += 10;

          // 콤보 포인트 배수 가중치 적용 (콤보당 +10% 보너스 포인트 지급)
          const comboBonus = verifiedCorrect ? Math.round(baseEarn * (nextCombo * 0.1)) : 0;
          finalPoints = baseEarn + comboBonus;

          setPointsEarned(finalPoints);
          setTotalPointsEarned(prev => prev + finalPoints);
          if (verifiedCorrect) setUserScore(prev => prev + 1);
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

    const rotateX = yc * -1; // 플레이 몰입 방해를 막기 위해 아주 미세한 6도 틸팅
    const rotateY = xc * 1;

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

  const hasDrawingFeature = stage && stage.category === 'CHARACTERS';

  return (
    <div className="container practice-page" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', position: 'relative' }}>
{/* 1. 상단 진행 상태바 */}
      {!gameCompleted && (
        <div style={{ marginBottom: '32px' }}>
          <div className="stage-info-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="white-space-normal" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <span>{stage.title}</span>

              {/* JLPT 급수 배지 */}
              <span className="practice-level-badge" style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                background: isBeginner ? '#2ecc7122' : '#1a4d8022',
                color: isBeginner ? '#218c5a' : '#1a4d80',
                padding: '4px 10px',
                borderRadius: '100px',
                border: `1.5px solid ${isBeginner ? '#2ecc7188' : '#1a4d8088'}`,
                whiteSpace: 'nowrap'
              }}>
                급수: {trackLabel}
              </span>

              {isBeginner && <span style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                background: difficulty === 'EASY' ? '#557c5522' : difficulty === 'MEDIUM' ? '#ff9f4322' : '#ff6b6b22',
                color: difficulty === 'EASY' ? '#557c55' : difficulty === 'MEDIUM' ? '#ff9f43' : '#ff6b6b',
                padding: '3px 8px',
                borderRadius: '100px',
                border: '1.5px solid transparent'
              }}>
                난이도: {difficultyLabel}
              </span>}
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

          {/* ⏱️ 타임어택 서바이벌 토글 스위치 (6코스 모의고사일 때는 감춤) */}
          {stageNumber !== 6 && (
            <div className="time-attack-control-card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              padding: '12px 18px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--card-border)',
              transition: 'all 0.3s'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⏱️ 타임어택 서바이벌 모드 (제한시간 20초)
              </span>
              <label className="switch-custom" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={isTimeAttack}
                  onChange={(e) => setIsTimeAttack(e.target.checked)}
                  disabled={submitted}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider-custom" style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isTimeAttack ? 'var(--accent-color)' : 'rgba(139, 146, 182, 0.3)',
                  borderRadius: '34px', transition: '.4s',
                  boxShadow: isTimeAttack ? '0 0 10px var(--accent-color)' : 'none'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                    backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                    transform: isTimeAttack ? 'translateX(22px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
            </div>
          )}

          {/* ⏱️ 타임어택 프로그레스 바 */}
          {isTimeAttack && !submitted && (
            <div style={{ marginTop: '14px', animation: 'fadeIn 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '800', marginBottom: '6px', color: timeRemaining <= 5 ? '#ff6b6b' : 'var(--text-secondary)' }}>
                <span>⏰ 남은 시간: {timeRemaining}초</span>
                {timeRemaining <= 5 && <span style={{ animation: 'pulse 0.5s infinite', color: '#ff6b6b' }}>🚨 마감 임박! 서두르세요!</span>}
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(timeRemaining / 20) * 100}%`,
                  height: '100%',
                  background: timeRemaining <= 5 ? 'linear-gradient(90deg, #ff6b6b, #ff5e7e)' : 'linear-gradient(90deg, var(--accent-color), #00d2d3)',
                  borderRadius: '100px',
                  transition: 'width 1s linear',
                  boxShadow: timeRemaining <= 5 ? '0 0 8px #ff6b6b' : '0 0 8px var(--accent-color)'
                }} />
              </div>
            </div>
          )}

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
            {stage.title} [{trackLabel}{isBeginner ? ` • ${difficultyLabel}` : ''}] 코스를 성공적으로 완수하셨습니다!
          </p>

          <div className="report-summary-grid" style={{
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

          <Link href="/" className="glass-neon-btn" style={{
            padding: '16px 40px',
            fontSize: '1.05rem',
            borderRadius: '100px',
            textDecoration: 'none',
            boxShadow: 'var(--neon-glow)'
          }}>
            🏠 로드맵 홈으로 복귀
          </Link>
        </div>
      ) : (
        /* ==================== [3.5 캘리그래피그림판 연동 2단 레이아웃] ==================== */
        <div className={`play-arena-grid ${isDrawingOpen && hasDrawingFeature ? 'drawing-active' : ''}`} style={{
          transition: 'all 0.4s ease'
        }}>

          {/* [좌측 판넬]: 핵심 퀴즈 및 주관식 입력/제출지 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="glass-premium-card rainbow-border"
              // onMouseMove={handleMouseMove}
              // onMouseLeave={handleMouseLeave}
              style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.04)' }}
            >

              <div className="play-action-bar-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div className="play-btn-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => speak(currentQuiz.japaneseWord, isBeginner ? 0.85 : 1)}
                    disabled={!submitted && currentQuiz.quizType !== 'LISTENING'}
                    className="outline-btn"
                    style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🔊<span className="pc-only">발음 듣기</span><span className="mobile-only">듣기</span>
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
											<span className="pc-only">
                      🖌️ 손글씨 판별 그림판 {isDrawingOpen ? '접기' : '켜기'}
											</span>
											<span className="mobile-only">
                      🖌️ 쓰기
											</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleAddBookmark}
                  disabled={bookmarking || bookmarkedList[currentQuiz.japaneseWord]}
                  className={`outline-btn ${bookmarkedList[currentQuiz.japaneseWord] ? 'bookmarked' : ''}`}
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
                  ⭐ <span className="pc-only">{bookmarkedList[currentQuiz.japaneseWord] ? '단어장 저장됨' : '단어장에 추가'}</span><span className="mobile-only">단어장 저장</span>
                </button>
              </div>

              {/* 퀴즈 질문 */}
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', whiteSpace: 'pre-line' }}>
                  <ReadableText text={currentQuiz.questionText
                    .replace(/\[(?:N[12](?:-(?:EASY|MEDIUM|HARD|ASSEMBLY))?|BEGINNER-(?:EASY|MEDIUM|HARD))\]\s*/g, '')
                    .replace(/\s*\((정답|정답은|정답인)?\s*:\s*[^)]+\)/g, '')
                    .replace(/\s*\[(정답|정답은|정답인)?\s*:\s*[^\]]+\]/g, '')} />
                </p>

                {currentQuiz.quizType === 'READING' && (
                  <section className="reading-passage" aria-label="독해 지문" lang="ja">
                    <ReadableText text={currentQuiz.japaneseWord} />
                  </section>
                )}
                 {!['LISTENING', 'READING'].includes(currentQuiz.quizType) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>

                    {/* 붓글씨 기능이 활성화된 스테이지에서만 획수 가이드 배지 노출 */}


                    {/* 정답 단어(japaneseWord) 스포일러 격리 차단 로직 */}
                    {submitted ? (
                      // 1) 제출이 끝났을 경우: 해설 검토를 위해 한자 단어 공개
                      <h3 style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px', marginTop: '6px' }}>
                        <ReadableText text={currentQuiz.japaneseWord} />
                      </h3>
                    ) : (
                      // 2) 플레이 중인 경우: 카테고리별 철저 분기
                      currentQuiz.quizType === 'WORDLE' ? (
                        <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px', marginTop: '12px' }}>
                          🧩 숨겨진 {currentQuiz.japaneseWord.length}글자 단어 맞추기
                        </h3>
                      ) : currentQuiz.quizType === 'ASSEMBLY' || !currentQuiz.japaneseWord || stage.category === 'GRAMMAR' || currentQuiz.questionText.includes('【文法形式】') || currentQuiz.questionText.includes('【文章の文法】') ? (
                        // 문법 조사는 문장만 보고 사지선다를 풀어야 하므로 단어 노출 금지
                        null
                      ) : (
                        // 문자 정복 등은 한자를 보고 풀어야 하므로 기존 한자 노출
                        <h3 style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--accent-color)', letterSpacing: '1px', marginTop: '6px' }}>
                          <ReadableText text={currentQuiz.japaneseWord} />
                        </h3>
                      )
                    )}

                  </div>
                )}

                {/* 청해 파동 아레나 */}
                {currentQuiz.quizType === 'LISTENING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                    <button
                      onClick={() => speak(currentQuiz.japaneseWord, isBeginner ? 0.85 : 1)}
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

              {/* ==================== [⚔️ 문장 조립 퀴즈 전용 드래그앤드롭 슬롯] ==================== */}
              {currentQuiz.quizType === 'ASSEMBLY' ? (
                <SentenceAssembly currentQuiz={currentQuiz} isBeginner={isBeginner} assemblyPads={assemblyPads} setAssemblyPads={setAssemblyPads} submitted={submitted} handleSubmission={handleSubmission} />
              ) : (
                /* ==================== [기존 붓글씨 그림판 기반 주관식 제출 통합지] ==================== */
                <>
                  {(isBeginner || !currentQuiz.options?.length) && <div style={{
                    marginTop: '10px',
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: 'var(--custom-radius)',
                    border: '1.5px dashed var(--card-border)'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>
                      ✍️ 손글씨 주관식 정답 입력
                    </span>

                    <div className="input-submit-group" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder={hasDrawingFeature ? "그림판에 쓰거나 직접 입력" : "정답 입력"}
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
												<span className="pc-only">주관식 제출 ➔</span>
												<span className="mobile-only">➔</span>
                      </button>
                    </div>
                  </div>

                  }
                  {/* [기존 사지선다 보기도 하단 보조 힌트로 유지] */}
                  {(currentQuiz.options && currentQuiz.options.length > 0) && (
                    <div style={{ marginTop: '16px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                        {isBeginner ? '💡 참고용 객관식 보기' : '답안 선택'}
                      </span>
                      <QuestionOptions currentQuiz={currentQuiz} submitted={submitted} setTypedAnswer={setTypedAnswer} handleSubmission={handleSubmission} />
                    </div>
                  )}
                </>
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
                className="premium-card question-feedback"
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
                      {isCorrect && speedBonusEarned > 0 && ` (⚡ 속도 보너스 +${speedBonusEarned} pts 포함!)`}
                    </span>
                  </span>
                  {currentQuiz.pronunciation && <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    요미가나(발음): <strong style={{ color: 'var(--text-primary)' }}>{currentQuiz.pronunciation}</strong>
                  </p>}
                  <p style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700' }}>
                    정답: <strong style={{ textDecoration: 'underline' }}><ReadableText text={currentQuiz.correctAnswer} /></strong>
                    {isBeginner && <> 또는 <strong><ReadableText text={currentQuiz.japaneseWord} /></strong></>}
                  </p>
                  {currentQuiz.hint && (
                    <p style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      💡 설명: <ReadableText text={currentQuiz.hint} />
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
                    wordBreak: 'keep-all',
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
                    zIndex: 1,
                    /* 터치 스크롤 완전 차단 - 그림 그리는 동안 페이지가 움직이지 않도록 */
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    userSelect: 'none',
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

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {candidates.length > 0 && (
                    <button
                      onClick={() => {
                        const firstChar = candidates[0];
                        setTypedAnswer(prev => prev + firstChar);
                        speak(firstChar);
                        clearCanvas(false);
                      }}
                      disabled={submitted}
                      className="glow-btn"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        background: 'linear-gradient(135deg, var(--accent-color) 0%, #a29bfe 100%)',
                        boxShadow: '0 0 10px rgba(84, 160, 255, 0.4)',
                        border: 'none',
                        borderRadius: '100px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontWeight: '800',
                        transition: 'all 0.2s'
                      }}
                    >
                      ✨ 즉시 입력 (1순위)
                    </button>
                  )}

                  <button
                    onClick={() => clearCanvas(false)}
                    className="outline-btn"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    🧹 그림판 지우기
                  </button>
                </div>
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
                  {recognizing ? '⏳ 인공지능이 손글씨 해독 중...' : '🧠 구글 실시간 해독 추천 (클릭 시 입력 및 자동 지우기):'}
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
                          clearCanvas(false); // 추천 단어 선택 시 자동으로 캔버스 초기화
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
