import { KANA_CHART } from './beginnerKana.mjs';

// The practice grid and quiz bank use the same canonical 46 character pairs.
const byHiragana = new Map(KANA_CHART.map(k => [k.hiragana, { h: k.hiragana, k: k.katakana, r: k.sound }]));
export const HIRAGANA_GRID = [
  'あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの',
  'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わ   を', 'ん    '
].map(row => [...row].map(char => byHiragana.get(char) || null));
