import { buildN1Quizzes } from './n1QualityQuizzes.mjs';

export { EXAM_PARTS, examQuestionForClient, gradeN1Exam } from '../lib/examFormat.mjs';
export function buildN1Exam(ids) {
  const bank = buildN1Quizzes(ids);
  const pick = (id, domain) => {
    const quiz = bank.find(item => item.id === `n1-q3-${id}`);
    if (!quiz) throw new Error(`Missing exam item: ${id}`);
    return { ...quiz, id: `n1-exam-v1-${id}`, domain };
  };
  const items = [
    pick('lex0-reading', '언어지식'), pick('lex10-reading', '언어지식'),
    pick('lex5-context', '언어지식'), pick('lex52-paraphrase', '언어지식'), pick('lex63-usage', '언어지식'),
    pick('gramresponsibility-choice', '언어지식'), pick('gramconcession-choice', '언어지식')
  ];
  const extra = (key, type, question, text, answer, wrong, hint) => ({
    id: `n1-exam-v1-${key}`, stageId: ids[3], quizType: type, domain: '언어지식',
    questionText: question, japaneseWord: text, pronunciation: '', correctAnswer: answer,
    wrongAnswers: JSON.stringify(wrong), hint
  });
  items.push(extra('star', 'MULTIPLE_CHOICE', '【文の組み立て】★に入る語句を選びなさい。\n現場の事情を＿＿ ＿＿ ★ ＿＿混乱を招きかねない。', '', '進めれば',
    ['把握せずに', '改革を', 'かえって'], '순서는 「把握せずに／改革を／進めれば／かえって」. 세 번째 빈칸 ★은 「進めれば」. 현장을 이해하지 못한 개혁이 역효과를 낸다는 조건과 결과다.'));
  items.push(extra('textgrammar', 'READING', '【文章の文法】（　）に入る接続表現を選びなさい。',
    '研究資料の公開は検証の機会を広げる。ただし、処理の経緯が説明されていなければ、資料を入手できても検証には使えない。（　）、公開の成否をファイルの数だけで測るべきではない。利用者が内容を理解するための説明も、公開の一部なのである。',
    'したがって', ['それにもかかわらず', 'ところが', 'それはさておき'], '앞 문장의 ‘입수할 수 있어도 검증에 쓸 수 없다’를 이유로 공개 평가 방법에 대한 결론을 이끌어 내므로 「したがって」. 대립이나 화제 전환이 아니다.'));
  items.push(pick('readlearning-q0', '독해'), pick('readpreservation-q1', '독해'), pick('readuncertainty-q0', '독해'),
    pick('readaccess-q0', '독해'), pick('readgrantinfo-q0', '독해'), pick('readtrial-q0', '독해'));
  const longReading = extra('longreading', 'READING', '【長文・主張理解】筆者が、地域交通の評価について最も伝えたいことは何ですか。',
    'ある町で、利用者の少ないバス路線を見直すことになった。一便当たりの人数を調べると、朝の便は混雑し、昼の便には空席が目立った。そこで昼の便を減らし、その費用を朝に回す案が出された。数字だけを見れば合理的に思える。ところが、住民への聞き取りから、朝の便で病院へ行った人が、昼の便で帰っていることが分かった。帰りの便がなくなれば、行きの便も利用できない人がいる。一便ずつ切り離した評価では、往復の関係が見えなかったのである。\n\nこの話は、数字を使って判断することが誤りだと示すものではない。聞き取りだけでは利用の全体像は捉えにくく、数値の記録がなければ、どの時間帯を詳しく調べるべきかも分からなかっただろう。問題は、何を一つの単位として数え、その単位の外にどんな関係を置き去りにしたかにある。評価の単位は、対象そのものが初めから持つ性質ではなく、目的に応じて選び取られるものなのだ。\n\nもっとも、全ての関係を把握し終えるまで決定を待つことはできない。調べる範囲を広げれば費用も時間もかかり、調査そのもののために運行の予算が失われる可能性さえある。だから必要なのは、完全な情報が得られるまで動かないことではなく、どの関係を見れば判断が変わり得るかを考えて調査することである。バスの例なら、便ごとの人数に加え、乗り換えや往復の組み合わせを確かめることが、その一歩となる。\n\n試行の方法も重要だ。昼の便を一度に廃止するのではなく、受診の終わる時間帯に合わせて時刻を変え、朝の利用も含めた変化を追う。人数が減れば単に需要がなかったと結論づけるのではなく、時刻変更によって利用できなくなった人がいないかを尋ねる。施策が測定の対象そのものを変える以上、実施後の数字も、そのまま元の需要を表すとは限らない。\n\n効率という言葉は、同じ費用でより多くの便を動かすことにも、限られた便で住民の必要な移動を支えることにも使われる。この二つは重なる部分があるが、同じではない。評価の目的を後者に置くなら、便の数や乗客の延べ人数だけでなく、必要な場所へ行き、戻ってこられる機会を見なければならない。指標を捨てるのでも、指標に判断を委ねるのでもなく、指標が目的に合っているかを問い直す。その作業を、決定の前にも後にも続けるべきなのだ。',
    '目的に照らして評価の単位や指標を選び、施策の前後で見直し続けるべきだ。',
    ['便ごとの人数より住民の聞き取りを優先し、数値による評価を控えるべきだ。', '往復の関係を把握できれば、実施後の変化を追加調査する必要はない。', '利用者の関係を全て調査し終えるまでは運行の見直しを行うべきでない。'],
    '왕복이라는 단위의 문제에서 지표 선택과 지속적인 재검토로 논의를 넓히고 있다. 청취 조사로 전면 대체, 모든 정보를 기다림, 실시 후 조사 불필요는 모두 본문이 물리친 것이다.');
  longReading.domain = '독해';
  items[14] = longReading;
  items.push(pick('listenreport-q0', '청해'), pick('listenbudget-q1', '청해'), pick('listentraining-q1', '청해'),
    pick('responsequalified-reply', '청해'), pick('listenconference-q1', '청해'));
  return items;
}

