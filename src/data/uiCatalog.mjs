import { N1_COURSES, N1_EXAM } from './n1Courses.mjs';
import { BEGINNER_COURSES } from './beginnerCourses.mjs';

export const JLPT_REGISTRATION_LINKS = [
  { label: 'JLPT 시험 접수 · 서울·제주권', href: 'https://www.jlpt.or.kr/html/' },
  { label: 'JLPT 시험 접수 · 부산권', href: 'https://www.bsjlpt.or.kr/' }
];

export const THEMES = [
  { id: 'zen', name: '젠 (Zen)', emoji: '🌸', color: '#557c55' },
  { id: 'cyber', name: '사이버 (Cyber)', emoji: '⚡', color: '#00f0ff' },
  { id: 'kawaii', name: '파스텔 (Kawaii)', emoji: '🍑', color: '#ff9494' },
  { id: 'academic', name: '클래식 (Classic)', emoji: '📜', color: '#1a4d80' },
  { id: 'neon-dream', name: '네온드림 (Neon)', emoji: '🛸', color: '#00ffb9' },
  { id: 'nordic-frost', name: '오로라 (Frost)', emoji: '❄️', color: '#00f2fe' },
  { id: 'velvet-rose', name: '벨벳로즈 (Rose)', emoji: '🌹', color: '#ff6b8b' },
  { id: 'golden-sand', name: '샤인사하라 (Gold)', emoji: '🌟', color: '#d4af37' }
];

export const CONCEPTS = [
  { id: 'glass', name: '오로라 판타지', emoji: '🌌' },
  { id: 'retro', name: '레트로 도트', emoji: '👾' },
  { id: 'heritage', name: '교토 헤리티지', emoji: '🏮' },
  { id: 'chalkboard', name: '추억의 칠판', emoji: '🏫' },
  { id: 'eco', name: '오가닉 미니멀', emoji: '🍃' }
];

export const CATEGORY_META = {
  CALLIGRAPHY: { emoji: '🌱', color: '#486b48', label: '손글씨 연습', mobileTitle: '글자쓰기' },
  CHARACTERS: { emoji: '🌸', color: '#ff9494', label: '문자 정복', mobileTitle: '문자어휘' },
  VOCAB: { emoji: '🍱', color: '#ffb37e', label: '어휘 마스터', mobileTitle: '어휘마스터' },
  GRAMMAR: { emoji: '⚙️', color: '#a6cf98', label: '문법 조사', mobileTitle: '문법조사' },
  LISTENING: { emoji: '🎧', color: '#90b4fc', label: '청해 배틀', mobileTitle: '청해배틀' },
  READING: { emoji: '📖', color: '#b19ffb', label: '독해', mobileTitle: '독해' },
  WORDLE: { emoji: '🧩', color: '#b19ffb', label: '단어 워들', mobileTitle: '단어워들' },
  ASSEMBLY: { emoji: '⚔️', color: '#ffd32a', label: '문장 조립', mobileTitle: '문장조립' },
  MOCK_EXAM: { emoji: '📝', color: '#ff5e7e', label: '모의고사', mobileTitle: '모의고사' }
};

export const getStagesList = level => level === 'BEGINNER' ? BEGINNER_COURSES : [...N1_COURSES, N1_EXAM];

