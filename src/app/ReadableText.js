import { Fragment } from 'react';

const japaneseWords = new Intl.Segmenter('ja', { granularity: 'word' });
const closingPunctuation = /^[、。，．？！!?：:；;）)」』】》〉]/;

// Keep Korean words intact; give Japanese text explicit word boundaries without
// inserting visible spaces or changing the text copied by the learner.
export default function ReadableText({ text }) {
  const value = String(text ?? '');
  if (!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(value)) return value;
  const words = Array.from(japaneseWords.segment(value), part => part.segment);
  return <span className="readable-text">{words.map((word, index) => (
    <Fragment key={index}>
      {word}
      {index < words.length - 1 && word.trim() && !closingPunctuation.test(words[index + 1]) && <wbr />}
    </Fragment>
  ))}</span>;
}
