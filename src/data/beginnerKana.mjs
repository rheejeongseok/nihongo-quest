// Romaji is a pronunciation aid; playback supplies the Japanese sound after answering.
const kana = [
  ['あいうえお','アイウエオ',['a','i','u','e','o']],
  ['かきくけこ','カキクケコ',['ka','ki','ku','ke','ko']],
  ['さしすせそ','サシスセソ',['sa','shi','su','se','so']],
  ['たちつてと','タチツテト',['ta','chi','tsu','te','to']],
  ['なにぬねの','ナニヌネノ',['na','ni','nu','ne','no']],
  ['はひふへほ','ハヒフヘホ',['ha','hi','fu','he','ho']],
  ['まみむめも','マミムメモ',['ma','mi','mu','me','mo']],
  ['やゆよ','ヤユヨ',['ya','yu','yo']],
  ['らりるれろ','ラリルレロ',['ra','ri','ru','re','ro']],
  ['わをん','ワヲン',['wa','wo','n']]
].flatMap(([h,k,sounds])=>[...h].map((hiragana,i)=>({hiragana,katakana:[...k][i],sound:sounds[i]})));
export const KANA_CHART = kana;
export function addBeginnerKana(add) {
  for (const script of ['hiragana','katakana']) kana.forEach((entry,index)=>{
    const glyph=entry[script];
    const wrong=[1,2,3].map(offset=>kana[(index+offset)%kana.length].sound);
    const name=script==='hiragana'?'히라가나':'가타카나';
    add('KANA',`${script}-${index+1}`,'EASY','sound','MULTIPLE_CHOICE',
      `${name} 「${glyph}」의 소리를 고르세요. (로마자 표기)`,glyph,glyph,entry.sound,wrong,
      `${glyph} = ${entry.sound}. 히라가나 ${entry.hiragana}와 가타카나 ${entry.katakana}는 대응하는 글자입니다.${entry.sound==='wo'?' を・ヲ는 보통 조사에서 o로 발음합니다.':''}${entry.sound==='n'?' ん・ン는 단독 모음이 없는 코소리입니다.':''}`);
  });
}
