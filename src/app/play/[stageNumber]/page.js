'use client';

import { use, useState, useEffect, useRef } from 'react';
import SentenceAssembly from '@/app/components/SentenceAssembly';
import N1SentenceAssembly from '@/app/components/N1SentenceAssembly';
import { getSyncHeaders } from '@/lib/clientProfile.mjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';
import { showToast } from '@/lib/toast';
import PlayProgress from '@/app/components/play/PlayProgress';
import PlayResult from '@/app/components/play/PlayResult';
import QuestionPrompt from '@/app/components/play/QuestionPrompt';
import AnswerInput from '@/app/components/play/AnswerInput';
import WordleBoard from '@/app/components/play/WordleBoard';
import AnswerFeedback from '@/app/components/play/AnswerFeedback';
import DrawingPanel from '@/app/components/play/DrawingPanel';
import AchievementToast from '@/app/components/play/AchievementToast';
import { ASSEMBLY_STAR_MODE, evaluateQuizAnswer } from '@/lib/quizScoring.mjs';
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
  const assemblyBoard = currentQuiz?.assemblyBoard;

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
          selectedAnswer: finalAns,
          answerMode: assemblyBoard ? ASSEMBLY_STAR_MODE : undefined
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
      <div className="container page-loading">
        <span className="page-loading-icon">🌸</span>
        <h3>퀴즈를 아름답게 섞어오는 중...</h3>
      </div>
    );
  }

  const hasDrawingFeature = stage && stage.category === 'CHARACTERS';
  const listen = () => speak(currentQuiz.japaneseWord, isBeginner ? 0.85 : 1);
  const isBookmarked = !!bookmarkedList[currentQuiz?.japaneseWord];
  // 손글씨 추천 글자를 고르면 입력칸에 붙이고, 읽어 주고, 그림판을 비웁니다.
  const pickCandidate = char => {
    setTypedAnswer(prev => prev + char);
    speak(char);
    clearCanvas(false);
  };

  return (
    <div className="container practice-page">
      {!gameCompleted && (
        <PlayProgress
          stageTitle={stage.title}
          isBeginner={isBeginner}
          trackLabel={trackLabel}
          difficulty={difficulty}
          difficultyLabel={difficultyLabel}
          comboCount={comboCount}
          currentIndex={currentIndex}
          total={quizzes.length}
          showTimeAttack={stageNumber !== 6}
          isTimeAttack={isTimeAttack}
          setIsTimeAttack={setIsTimeAttack}
          submitted={submitted}
          timeRemaining={timeRemaining}
        />
      )}

      {gameCompleted ? (
        <PlayResult
          stageTitle={stage.title}
          trackLabel={trackLabel}
          isBeginner={isBeginner}
          difficultyLabel={difficultyLabel}
          userScore={userScore}
          total={quizzes.length}
          totalPointsEarned={totalPointsEarned}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      ) : (
        <div className={`play-arena-grid ${isDrawingOpen && hasDrawingFeature ? 'drawing-active' : ''}`}>
          {/* 왼쪽: 문제와 답 입력 */}
          <div className="play-main">
            <div className="glass-premium-card rainbow-border play-card">
              <div className="play-action-bar-top">
                <div className="play-btn-group">
                  <button onClick={listen} disabled={!submitted && currentQuiz.quizType !== 'LISTENING'} className="outline-btn play-tool-btn">
                    🔊<span className="pc-only">발음 듣기</span><span className="mobile-only">듣기</span>
                  </button>
                  {hasDrawingFeature && (
                    <button onClick={() => setIsDrawingOpen(!isDrawingOpen)} className={`outline-btn play-tool-btn${isDrawingOpen ? ' active' : ''}`}>
                      <span className="pc-only">🖌️ 손글씨 판별 그림판 {isDrawingOpen ? '접기' : '켜기'}</span>
                      <span className="mobile-only">🖌️ 쓰기</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleAddBookmark}
                  disabled={bookmarking || isBookmarked}
                  className={`outline-btn play-tool-btn bookmark-btn${isBookmarked ? ' bookmarked' : ''}`}
                >
                  ⭐ <span className="pc-only">{isBookmarked ? '단어장 저장됨' : '단어장에 추가'}</span><span className="mobile-only">단어장 저장</span>
                </button>
              </div>

              {!assemblyBoard && <QuestionPrompt quiz={currentQuiz} stage={stage} submitted={submitted} onListen={listen} />}

              {assemblyBoard ? (
                <N1SentenceAssembly key={currentQuiz.id} board={assemblyBoard} submitted={submitted} onSubmit={handleSubmission} />
              ) : currentQuiz.quizType === 'ASSEMBLY' ? (
                <SentenceAssembly currentQuiz={currentQuiz} isBeginner={isBeginner} assemblyPads={assemblyPads} setAssemblyPads={setAssemblyPads} submitted={submitted} handleSubmission={handleSubmission} />
              ) : (
                <AnswerInput
                  quiz={currentQuiz}
                  isBeginner={isBeginner}
                  hasDrawingFeature={hasDrawingFeature}
                  typedAnswer={typedAnswer}
                  setTypedAnswer={setTypedAnswer}
                  submitted={submitted}
                  handleSubmission={handleSubmission}
                />
              )}

              {currentQuiz.quizType === 'WORDLE' && (
                <WordleBoard attempts={wordleAttempts} input={wordleInput} finished={wordleFinished} submitted={submitted} onChange={handleWordleChange} onSubmit={handleWordleSubmit} />
              )}
            </div>

            {submitted && (
              <AnswerFeedback
                quiz={currentQuiz}
                isCorrect={isCorrect}
                isBeginner={isBeginner}
                assemblyBoard={assemblyBoard}
                pointsEarned={pointsEarned}
                speedBonusEarned={speedBonusEarned}
                isLast={currentIndex + 1 === quizzes.length}
                onNext={handleNextQuiz}
              />
            )}
          </div>

          {/* 오른쪽: 손글씨 판독 그림판 */}
          {isDrawingOpen && hasDrawingFeature && (
            <DrawingPanel
              quiz={currentQuiz}
              canvasRef={canvasRef}
              drawHandlers={{ onMouseDown: startDrawing, onMouseMove: draw, onMouseUp: stopDrawing, onMouseLeave: stopDrawing, onTouchStart: startDrawing, onTouchMove: draw, onTouchEnd: stopDrawing }}
              showOverlayGuide={showOverlayGuide}
              setShowOverlayGuide={setShowOverlayGuide}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              candidates={candidates}
              recognizing={recognizing}
              submitted={submitted}
              onPick={pickCandidate}
              onClear={() => clearCanvas(false)}
            />
          )}
        </div>
      )}

      <AchievementToast toast={achievementToast} />
    </div>
  );
}
