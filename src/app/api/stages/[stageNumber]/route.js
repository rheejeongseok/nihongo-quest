import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Fisher-Yates 셔플 알고리즘
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request, { params }) {
  try {
    const stageNumber = parseInt(params.stageNumber);
    
    // ⚔️ 5코스 N1 경어/조사 문장 조립 아레나 가상 라우팅 (100문항 대규모 확장 & 10문항 무작위 셔플 추출)
    if (stageNumber === 5) {
      const virtualStage = {
        id: "virtual-stage-5-uuid",
        stageNumber: 5,
        title: "⚔️ 경어랑 조사 문장 조립",
        category: "ASSEMBLY",
        jlptLevel: "N1",
        difficulty: "HARD"
      };

      const assemblyQuizzes = [
        {
          id: "v-quiz-1",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 비즈니스 경어 문장을 만드세요. (상황: 바쁜 상사에게 서류 결재를 부탁할 때)",
          japaneseWord: "お忙しいところ恐縮ですが、ご査収いただけますでしょうか。",
          pronunciation: "おいそがしいところきょうしゅくですが、ごさしゅういただけますでしょうか。",
          correctAnswer: "お忙しいところ 恐縮ですが、 ご査収 いただけます でしょうか。",
          hint: "바쁘신 와중에 죄송합니다만, 검토해 주시겠습니까? (査収: 서류 등을 잘 살피고 거두어 줌)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-2",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 경어 문장을 만드세요. (상황: 은사의 새로 출판된 책에 대해 감사와 존경을 표할 때)",
          japaneseWord: "先生、新しく出版された著書を拝読いたしました。",
          pronunciation: "せんせい、あたらしいしゅっぱんされたちょしょをはいどくいたしました。",
          correctAnswer: "先生、 新しく  出版された 著書을 拝読いたしました。",
          hint: "선생님, 새로 출판된 저서를 읽었습니다. (拝読: '읽다'의 겸양어)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-3",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 경어 표현을 만드세요. (상황: 전화를 건 바이어에게 부장 다나카의 상태를 설명할 때)",
          japaneseWord: "田中様は、ただいま席を外していらっしゃいます。",
          pronunciation: "たなかさまは、ただいませき을はずしていらっしゃいます。",
          correctAnswer: "田中様は、  席を 外して いらっしゃいます。",
          hint: "다나카 님은 지금 자리를 비우고 계십니다. (いらっしゃる: '있다'의 존경어)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-4",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 부드러운 완곡 경어 표현을 만드세요. (상황: 거래처 연락 담당자에게 메시지 전달을 요청할 때)",
          japaneseWord: "ご担当者様にお伝えいただけますと幸いです。",
          pronunciation: "ごたんとうしゃさまにおつたえいただけますとさいわいです。",
          correctAnswer: "ご担当者様に お伝え いただけますと 幸いです。",
          hint: "담당자분께 전해 주시면 감사하겠습니다. (〜と幸いです: ~하면 감사하겠습니다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-5",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 고난도 격식 표현을 완성하세요. (상황: 중요한 대외 프로젝트 중책에 임명되어 소감을 말할 때)",
          japaneseWord: "このような大役を仰せつかり、身に余る光栄に存じます。",
          pronunciation: "このようなたいやくをおおせつかり、みにあまるこうえいにぞんじます。",
          correctAnswer: "このような大役を 仰せつかり、 身に余る 光栄に 存じます。",
          hint: "이러한 중책을 맡게 되어, 과분한 영광으로 생각합니다. (仰せつかる: 명령/직책을 부여받다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-6",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 겸양 표현을 만드세요. (상황: 면담 중 상사가 이전에 해 준 조언에 깊은 인상을 표할 때)",
          japaneseWord: "先ほど伺ったお話は、大変興味深いものでした。",
          pronunciation: "さきほどうかがったおはなしは、たいへんきょうみぶかいものでした。",
          correctAnswer: "先ほど 伺った お話は、 大変 興味深いものでした。",
          hint: "아까 들었던 이야기는 매우 흥미로운 것이었습니다. (伺う: '듣다'의 겸양어)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-7",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비즈니스 정중 체를 완성하세요. (상황: 회의에서 상대방에게 내용을 한번 더 설명해달라고 할 때)",
          japaneseWord: "誠に恐れ入りますが、もう一度ご説明願えますか。",
          pronunciation: "まことにおそれいりますが、もういちすごせつめいねがえますか。",
          correctAnswer: "誠に 恐れ入りますが、 もう一度 ご説明 願えますか。",
          hint: "정말로 죄송합니다만, 한 번 더 설명해 주시겠습니까? (願う: 요청하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-8",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 경어와 조사 관계를 배치하세요. (상황: 과장님의 지시대로 업무 준비를 원활히 처리하고 있음을 말할 때)",
          japaneseWord: "課長がおっしゃった通り、準備を進めております。",
          pronunciation: "かちょうがおっしゃったとおり、じゅんびをすすめております。",
          correctAnswer: "課長が おっしゃった通り、 準備を 進めて おります。",
          hint: "과장님이 말씀하신 대로, 준비를 진행하고 있습니다. (おっしゃる: 존경어, おる: 겸양어)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-9",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 완곡한 정중 경어를 만드세요. (상황: 회의 진행 전, 사전에 자사 기획서를 읽어달라고 정중히 당부할 때)",
          japaneseWord: "弊社の資料を、あらかじめご一読いただけますと助かります。",
          pronunciation: "へいしゃのしりょうを、あらかじめごいちどくいただけますとたすかります。",
          correctAnswer: "弊社の資料を、 あらかじめ ご一読 いただけますと 助かります。",
          hint: "저희 회사의 자료를 미리 한 번 읽어봐 주시면 감사하겠습니다. (ご一読: 한 번 읽어봄)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-10",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 문장 조사를 결합하세요. (상황: 중요한 내부 결산 세미나 일정을 동료에게 공식 브리핑할 때)",
          japaneseWord: "本日の会議は、午後三時から執り行われる予定です。",
          pronunciation: "ほんじつのかいぎは、ごごさんじからとりおこなわれるよていです。",
          correctAnswer: "本日の会議は、 午後三時から 執り行われる 予定です。",
          hint: "오늘의 회의는 오후 세 시부터 행해질 예정입니다. (執り行う: 의식/행사 등을 거행하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-11",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 겸양/사과 문장을 완성하세요. (상황: 기대해 주신 거래처의 희망 조건에 부응하지 못해 사죄할 때)",
          japaneseWord: "ご期待に沿えず、誠に申し訳ございません。",
          pronunciation: "ごきたいにそえず、まことにもうしわけございません。",
          correctAnswer: "ご期待に 沿えず、 誠に 申し訳ございません。",
          hint: "기대에 부응하지 못해 대단히 죄송합니다. (〜に沿う: ~에 부응하다/따르다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-12",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비즈니스 약속 문장을 완성하세요. (상황: 세부안이 확정되는 대로 바이어에게 즉시 연락해 주겠다고 약속할 때)",
          japaneseWord: "詳細が決まり次第、改めてご連絡差し上げます。",
          pronunciation: "しょうさいがきまりしだい、あらためてごれんらくさしあげます。",
          correctAnswer: "詳細が 決まり次第、 改めて ご連絡 差し上げます。",
          hint: "상세 사항이 결정되는 대로 다시 연락해 드리겠습니다. (〜次第: ~하는 대로, ご〜差し上げる: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-13",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 최고 등급 겸양 청원 문장을 만드세요. (상황: 기획상의 갑작스러운 누락에 대해 이해를 구할 때)",
          japaneseWord: "何卒ご容赦くださいますようお願い申し上げます。",
          pronunciation: "なにとぞごようしゃくださいますようおねがい申し上げます。",
          correctAnswer: "何卒 ご容赦 くださいますよう お願い申し上げます。",
          hint: "부디 너그러이 양해해 주시기를 간곡히 부탁드립니다. (何卒: 부디/아무쪼록, ご容赦: 용서/양해)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-14",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 비즈니스 공지 표현을 완성하세요. (상황: 점포 사정으로 내일 휴무함을 알릴 때)",
          japaneseWord: "勝手ながら、明日は終日休業とさせていただきます。",
          pronunciation: "かってながら、あしたはしゅうじつきゅうぎょうとさせていただきます。",
          correctAnswer: "勝手ながら、 明日は 終日休業と させていただきます。",
          hint: "죄송하오나 내일은 하루 종일 휴업하겠습니다. (勝手ながら: 편의상 죄송하지만, 〜させていただく: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-15",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 회신 요청 문장을 조립하세요. (상황: 보낸 서류를 확인하고 다시 전화 달라고 정중히 부탁할 때)",
          japaneseWord: "ご確認の上、折り返しご連絡いただけますと幸いです。",
          pronunciation: "ごかくにんのうえ、おりかえすごれんらくいただけますとさいわいです。",
          correctAnswer: "ご確認の上、 折り返し ご連絡 いただけますと 幸いです。",
          hint: "확인하신 후 회신 전화를 주시면 감사하겠습니다. (ご確認の上: 확인하신 후, 折り返し: 이어서/회신전화)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-16",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 공식 감사 서한 문장을 완성하세요. (상황: 연말을 맞아 평소 거래처의 애호에 큰 감사를 보낼 때)",
          japaneseWord: "日頃より格別のご愛顧を賜り、厚く御礼申し上げます。",
          pronunciation: "ひごろよりかくべつのごあいこをたまわり、あつくおんれいもうしあげます。",
          correctAnswer: "日頃より 格別の ご愛顧を 賜り、 厚く御礼申し上げます。",
          hint: "평소 베풀어 주신 특별한 애호에 깊이 감사드립니다. (賜る: 주시다의 겸양/존경, 厚く御礼: 깊이 감사)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-17",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 진솔한 신임 소감 표현을 완성하세요. (상황: 팀장 직책을 임명받고 부족하지만 최선을 다하겠다고 결의할 때)",
          japaneseWord: "微力ながら、精一杯努めさせていただきます。",
          pronunciation: "びりょくながら、せいいっぱいつとめさせていただきます。",
          correctAnswer: "微力ながら、 精一杯 努めさせていただきます。",
          hint: "힘은 미약하지만 온 힘을 다해 일하겠습니다. (微力ながら: 힘은 부족하지만, 努める: 힘쓰다/일하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-18",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 고객 안내 양식을 조립하세요. (상황: 사용법에 대해 궁금한 점이 있으면 언제든 묻도록 안내할 때)",
          japaneseWord: "ご不明な点がございましたら、お気軽にお問い合わせください。",
          pronunciation: "ごふめいなてんがございましたら、おきがるにおといあわせください。",
          correctAnswer: "ご不明な点が ございましたら、 お気軽に お問い合わせください。",
          hint: "의문나는 점이 있으시면 편하게 문의해 주십시오. (ご不明な点: 분명치 않은 점, お気軽に: 부담없이)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-19",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 완곡한 거절 경어를 조립하세요. (상황: 갑작스러운 티타임 요청에 선약이 있어서 거절할 때)",
          japaneseWord: "あいにくですが、その日は先約が入っております。",
          pronunciation: "あいにくですが、そのひはせんやくがはいっております。",
          correctAnswer: "あいにくですが、 その日は 先約が 入っております。",
          hint: "유감스럽게도 그날은 선약이 잡혀 있습니다. (あいにく: 마침 나쁘게도/유감스럽게도, おる: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-20",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 감사 인사 표현을 만드세요. (상황: 궂은 날씨에 당사 세미나실까지 직접 찾아와 준 교수님께 감사할 때)",
          japaneseWord: "本日はお忙しい中、足をお運びいただき感謝いたします。",
          pronunciation: "ほんじつはおいそがしいなか、あしをおはこびいただきかんしゃいたします。",
          correctAnswer: "本日は お忙しい中、 足を お運びいただき 感謝いたします。",
          hint: "오늘 바쁘신 와중에 발걸음해 주셔서 진심으로 감사드립니다. (足を運ぶ: 찾아오다/발걸음하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-21",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 부드러운 상사 존경어 의문을 완성하세요. (상황: 사장님이 회의 문서를 보셨는지 정중하게 여쭤볼 때)",
          japaneseWord: "社長、本日の会議の資料はご覧になりましたか。",
          pronunciation: "しゃちょう、ほんじつのかいぎのしりょうはごらんになりましたか。",
          correctAnswer: "社長、 本日の 会議의 자료는 ご覧になりましたか。",
          hint: "사장님, 오늘 회의 자료는 읽어 보셨습니까? (ご覧になる: '보다'의 존경어)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-22",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 비즈니스 고마움을 나타내세요. (상황: 거래처가 제품 결함을 너무 빠르게 대처해 줘서 고마울 때)",
          japaneseWord: "迅速なご対応をいただき、心より感謝申し上げます。",
          pronunciation: "じんそくなごたいおうをいただき、こころよりかんしゃもうしあげます。",
          correctAnswer: "迅速な ご対応を いただき、 心より 感謝申し上げます。",
          hint: "신속하게 대응해 주셔서 마음 깊이 감사드립니다. (迅速な: 신속한, 心より: 마음속 깊이)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-23",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 고난도 N1 접속 조건 문장을 조립하세요. (상황: 향후 원자재 값 폭등 상황에 대응할 수밖에 없음을 공식 천명할 때)",
          japaneseWord: "今後の状況次第では、計画を見直さざるを得ません。",
          pronunciation: "こんごのじょうきょうしだいでは、けいかくをみなおさざるをえません。",
          correctAnswer: "今後の 状況次第では、 計画を 見直さざるを得ません。",
          hint: "향후 상황에 따라서 계획을 재검토할 수밖에 없습니다. (〜次第で: ~에 따라서, 〜ざるを得ない: ~하지 않을 수 없다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-24",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 상사 제안 요청 정중 체를 완성하세요. (상황: 다소 억지스러울 수 있는 자사 기획을 한번 검토해 주길 간곡히 바랄 때)",
          japaneseWord: "勝手なお願いで大変恐縮ですが、ご一考いただければと存じます。",
          pronunciation: "かってなおねがいでたいへんきょうしゅくですが、ごいっこういただければとぞんじます。",
          correctAnswer: "勝手な お願いで 大変恐縮ですが、 ご一考 いただければと 存じます。",
          hint: "제멋대로인 부탁이라 송구합니다만 재고해주시면 감사하겠습니다. (ご一考: 재고/다시 생각해 봄, 〜と存ずる: ~라고 생각하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-25",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비즈니스 당사 책임 겸양 표현을 조립하세요. (상황: 이번 대형 홍보 클레임 건은 우리 마케팅팀에서 일괄 도맡겠다고 선언할 때)",
          japaneseWord: "本件につきましては、私どもで引き受けさせていただきます。",
          pronunciation: "ほんけんにつきましては、わたしどもでひきうけさせていただきます。",
          correctAnswer: "本件に つきましては、 私どもで 引き受け させていただきます。",
          hint: "본 건에 관련해서는 저희가 맡도록 하겠습니다. (〜につき: ~에 대하여, 私ども: 저희/우리들)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-26",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 N1 핵심 기간 표현 문장을 만드세요. (상황: 수년에 걸친 프로젝트가 결실을 보았음을 대내적으로 성과 공유할 때)",
          japaneseWord: "長年にわたる努力の実を結び、ついに契約が成立した。",
          pronunciation: "ながねんにわたるどりょくのみをむすび、ついにけいやくがせいりつした。",
          correctAnswer: "長年に わたる 努力の 실을을결실로 맺어, ついに 契約が 成立した。",
          hint: "수년간에 걸친 노력의 결실을 맺어 드디어 계약이 체결되었다. (〜にわたる: ~에 걸친, 실을을결실로 맺다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-27",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 공식 축사/기원 문장을 조립하세요. (상황: 은퇴하시는 고문님의 앞날에 건강과 다복을 빌 때)",
          japaneseWord: "皆様のご健勝とご多幸を心よりお祈り申し上げます。",
          pronunciation: "みなさまのごけんしょうとごたこうをこころよりおいのりもうしあげます。",
          correctAnswer: "皆様の ご健勝と ご多幸を 心より お祈り申し上げます。",
          hint: "여러분들의 건강과 큰 행복을 마음 깊이 기원드립니다. (ご健勝: 건강함, ご多幸: 매우 행복함, お祈り申し上げる: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-28",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 격식 있는 인사 및 당부 문장을 조립하세요. (상황: 신임 파트너사에 겸손히 다가가며 지도 편달을 정중하게 호소할 때)",
          japaneseWord: "至らない点も多々あるかと存じますが、ご指導のほどよろしくお願いいたします。",
          pronunciation: "いたらないてんもたたあるかとぞんじますが、ごしどうのほどよろしくおねがいいたします。",
          correctAnswer: "至らない点も 多々あるかと 存じますが、 ご指導のほど よろしくお願いいたします。",
          hint: "미흡한 점도 많으리라 사료되오나 부디 지도를 잘 부탁드립니다. (至らない: 미흡한/모자란, 〜のほど: ~하는 정도/~해주실 것을)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-29",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 이메일 업무 발송 문장을 완성하세요. (상황: 과장님 지시를 받아 바이어에게 원본 우편 서류를 보냈음을 고할 때)",
          japaneseWord: "ご指示いただいた通りに、先方に書類を郵送いたしました。",
          pronunciation: "ごしじいただいたとおりに、せんぽうにしょるいをゆうそういたしました。",
          correctAnswer: "ご指示 いただいた 통리에、 先方に 書類を 郵送いたしました。",
          hint: "지시해주신 대로 상대편(거래처)에 서류를 무사 우편 발송했습니다. (先方: 상대방/상대처, 郵送: 우편 발송)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-30",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비즈니스 약속 경어를 만드세요. (상황: 신임 프로젝트의 각 세부 단계를 주기적으로 상세히 보고하겠다고 서약할 때)",
          japaneseWord: "今後の進捗状況について、随時ご報告申し上げます。",
          pronunciation: "こんごのしんちょくじょうきょうについて、ずいじごほうこくもうしあげます。",
          correctAnswer: "今後の 進捗状況について、 随時 ご報告 申し上げます。",
          hint: "앞으로의 진척 상황에 관련해서 수시로 보고드리겠습니다. (進捗: 진척, 随時: 수시로, ご〜申し上げる: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-31",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 상사 존경어 의문문을 조립하세요. (상황: 외근 나가신 팀장님이 사무실에 오시는 시간을 정중히 캐물을 때)",
          japaneseWord: "先生、明日オフィスにお戻りになられる時間はいつ頃でしょうか。",
          pronunciation: "せんせい、あしたオフィスにおもどりになられるじかんはいつごろでしょうか。",
          correctAnswer: "先生、 明日 オフィスに お戻りになられる  시간은 いつ頃でしょうか。",
          hint: "선생님, 내일 사무실로 복귀하시는 시간은 대략 언제쯤인가요? (お戻りになる: 돌아오시다의 이중존경 겸 친근체)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-32",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 격식 있는 주의사항 문장을 조립하세요. (상황: 신임 가입자에게 대형 보험 계약 서명 시 위험 조항을 알려줄 때)",
          japaneseWord: "この契約書にサインするにあたって、注意すべき点は何ですか。",
          pronunciation: "このけいやくしょにサインするにあたって、ちゅういすべきてんはなんですか。",
          correctAnswer: "この 契約書に 사인스루니 あたって、 注意すべき点は 何ですか。",
          hint: "이 계약서에 서명함에 있어서 특별히 주의해야 할 점은 무엇입니까? (〜にあたって: ~할 때/~함에 있어서)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-33",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 각오 겸양 표현을 완성하세요. (상황: 바이어의 여러 어려운 요구조건에 최선을 다해 부응하겠다고 답할 때)",
          japaneseWord: "ご要望にお応えできるよう、全力を尽くす所存でございます。",
          pronunciation: "ごようぼうにおこたえできるよう、ぜんりょくをつくすしょぞんでございます。",
          correctAnswer: "ご要望に お応え できるよう、 全力を 尽くす 所存でございます。",
          hint: "요청 사안에 부응할 수 있도록 온 힘을 다할 생각입니다. (〜に応える: ~에 부응하다, 〜所存でございます: ~할 생각/마음가짐입니다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-34",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 공식 수락 겸양 문장을 조립하세요. (상황: 저명한 학술회 초청을 흔쾌히 수락하고 참석하겠다고 회신할 때)",
          japaneseWord: "先日ご案内いただいたセミナーに、喜んで参加させていただきます。",
          pronunciation: "せんじつごあんないいただいたセミナーに、よろこんでさんかさせていただきます。",
          correctAnswer: "先日 ご案内 いただいた 세미나니、 喜んで 参加させていただきます。",
          hint: "요전에 초청해주신 세미나 자리에 기꺼이 기쁜 마음으로 참석하겠습니다. (喜んで: 기꺼이)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-35",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 N1 고난도 부정적 예측 문장을 조립하세요. (상황: 연구원의 데이터 임의 수정 행위가 기업 도덕에 큰 타격이 될 것임을 주장할 때)",
          japaneseWord: "今回の不祥事は、会社の信頼を揺るがしかねない重大な問題だ。",
          pronunciation: "こんかいのふしょうじは、かいしゃのしんらいをゆるがしかねないじゅうだいなもんだいだ。",
          correctAnswer: "今回の 不祥事は、 会社の 信頼を 揺る가しかねない 重大な 問題だ。",
          hint: "이번 비리 스캔들은 회사의 두터운 신뢰를 송두리째 뒤흔들 위험이 있는 큰 문제입니다. (揺るがす: 흔들다, 〜かねない: ~할 위험이 있다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-36",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 깔끔한 결재 요청 문장을 조립하세요. (상황: 신임 주간 마케팅 제안서 작성을 마치고 부장님 결재를 바랄 때)",
          japaneseWord: "部長、新しい企画案を作成しましたので、ご査収のほどよろしくお願いいたします。",
          pronunciation: "ぶちょう、あたらしいきかくあんをさくせいしましたので、ごさしゅうのほどよろしくおねがいいたします。",
          correctAnswer: "部長、 新しい 企画案を 作成しましたので、 ご査収のほど よろしくお願いいたします。",
          hint: "부장님, 신규 기획서를 짜 올렸으니 잘 살펴 받아 주시기를 당부드립니다. (ご査収のほど: 서류 등을 잘 확인하시어 받아주시길)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-37",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 회사 차원의 대외 최고 사과 문장을 조립하세요. (상황: 자사 서버 임시 마비로 고객의 큰 결제 장애가 난 것을 정중히 사죄할 때)",
          japaneseWord: "弊社の落ち度により多大なご迷惑をおかけし、深くお詫び申し上げます。",
          pronunciation: "へいしゃのおち도によりただいなごめいわくをおかけし、ふかくおわびもうしあげます。",
          correctAnswer: "弊社の 落ち度に より 多大な ご迷惑을 おかけし、 深く お詫び申し上げます。",
          hint: "저희 측의 미숙한 불찰로 지대한 폐를 끼쳐 드려 마음 속 깊이 정중히 사과드립니다. (落ち度: 과실/잘못, お詫び申し上げる: 사죄하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-38",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 핵심 N1 기능어 인과 문장을 만드세요. (상황: 외주 협력사 변경이 사장 최종 재가 결과에 전적으로 달렸음을 공유할 때)",
          japaneseWord: "社長の決断いかんによっては、プロジェクトが中止になる可能性もある。",
          pronunciation: "しゃちょうのけつだんいかんによっては、プロジェクトがちゅうしになるかのうせいもある。",
          correctAnswer: "社長の 決断 이칸니욧테와、 프로젝트가 中止になる 可能性もある。",
          hint: "사장님의 결정 처분 여하에 따라는 본 프로젝트가 멈출 우려도 다분합니다. (〜いかんによって: ~에 따라서/~여하에 의해)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-39",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 극진한 외빈 환영 존경 문장을 만드세요. (상황: 멀리 타국에서 자사 창립식 참가를 위해 와 준 VIP에 정중히 감사할 때)",
          japaneseWord: "本日は遠方からわざわざお越しいただき、誠にありがとうございます。",
          pronunciation: "ほんじつはおんぽうからわざわざおこしいただき、まことにありがとうございます。",
          correctAnswer: "本日は 遠方から わざわざ お越しいただき、 誠に ありがとうございます。",
          hint: "오늘 먼 타지에서 귀한 걸음 직접 왕림해 주셔서 깊이 감사 말씀 드립니다. (お越しいただく: 와 주시다의 극존칭)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-40",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 깔끔한 결언 정중 문장을 조립하세요. (상황: 출장 다녀오자마자 우선 이메일로 첫 약식 감사보고를 올릴 때)",
          japaneseWord: "取り急ぎ、メールにて御礼とご報告まで申し上げます。",
          pronunciation: "とりいそぎ、メールにておんれいとごほうこくまでもうしあげます。",
          correctAnswer: "取り急ぎ、 メールにて 御礼と ご報告まで 申し上げます。",
          hint: "우선 급한 대로 메일이나마 조속히 감사의 말씀과 약식 보고를 먼저 전해 드립니다. (取り急ぎ: 급한 대로 우선)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-41",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비례 변화 N1 문법 문장을 조립하세요. (상황: 국가 고시 시험이 하루하루 코앞에 닥쳐와 초조해질 때)",
          japaneseWord: "試験が近づくにつれて、焦る気持ちが募る一方だ。",
          pronunciation: "しけんがちかづくにつれて、あせるきもちがつのるいっぽうだ。",
          correctAnswer: "試験が 近づくに つれて、 焦る気持ちが 募る一方だ。",
          hint: "시험 일정이 임박해 옴에 따라 타들어가는 초조한 마음만 점차 가중될 뿐이다. (〜につれて: ~함에 따라, 〜一方だ: ~하기만 하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-42",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 고객 서식 작성 의문을 완성하세요. (상황: 구청 창구에서 민원 신청서를 기재해 달라고 당부할 때)",
          japaneseWord: "お客様、こちらにお名前とご連絡先をご記入いただけますでしょうか。",
          pronunciation: "おきゃくさま、こちらにおなまえとごれんらくさきをごきにゅういただけますでしょうか。",
          correctAnswer: "お客様、 こちらに お名前と ご連絡先を ご記入 いただけますでしょうか。",
          hint: "고객님, 실례지만 이곳에 존함과 비상 연락망 기재를 한번 부탁드려도 괜찮을까요? (ご記入: 작성/기입)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-43",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 공식 제의 청원 정중 문장을 조립하세요. (상황: 자사 대형 신기술 제휴 계약 건을 긍정적으로 판단해 달라고 재차 사정할 때)",
          japaneseWord: "前向きにご検討くださいますよう、重ねてお願い申し上げます。",
          pronunciation: "まえむきにごけんとうくださいますよう、かさねておねがいもうしあげます。",
          correctAnswer: "前向きに ご検討 くださいますよう、 重ねて お願い申し上げます。",
          hint: "부디 전향적으로 넓게 고려해 주실 것을 거래처에 거듭 간곡히 머리 숙여 부탁드립니다. (前向きに: 전향적으로/긍정적으로, 重ねて: 거듭)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-44",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 격식 있는 감정 서술 문장을 만드세요. (상황: 평생 꿈꾸던 도쿄 대학교 박사 국비 유학 길이 열려 벅찰 때)",
          japaneseWord: "長年の夢であった留学が実現するとなって、胸が高鳴っている。",
          pronunciation: "ながねんのゆめであったりゅうがくがじつげんするとなって、むねがたかなっている。",
          correctAnswer: "長年の 夢であった 留学が  실현된다고 하니, 胸が 高鳴っている。",
          hint: "오랜 염원이자 꿈이었던 해외 유학이 기어이 현실로 성사되자 가슴이 설레어 요동친다. (〜となる: ~로 되다, 胸が高鳴る: 가슴이 설레어 두근대다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-45",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 외근 예정 전달 문장을 조립하세요. (상황: 약속한 내일 일정에 맞춰 상대 회사 빌딩에 방문하겠다고 확답을 보낼 때)",
          japaneseWord: "それでは、明日の午後二時に貴社へお伺いいたします。",
          pronunciation: "それでは、あしたのごごにじにきしゃへおうかがいいたします。",
          correctAnswer: "それでは、 明日の 午後二時に 貴社へ お伺いいたします。",
          hint: "알겠습니다. 그러면 예정된 내일 오후 2시에 귀사 건물에 직접 찾아뵙겠습니다. (貴社: 귀사, お伺いする: 방문하다의 겸양어)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-46",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중하고도 황송한 비즈니스 감사를 표현하세요. (상황: 명절에 거래처가 자사 직원 전체에 과일 세트를 보내줘 감사할 때)",
          japaneseWord: "ご丁寧なメールをいただき、大変痛み入ります。",
          pronunciation: "ごていねいなメールをいただき、たいへんいたみいります。",
          correctAnswer: "ご丁寧な メールを いただき、 大変 痛み入ります。",
          hint: "정성 어린 연락을 먼저 하사받아 너무나 감사하고 한편으로 송구스러울 따름입니다. (ご丁寧な: 정중한, 痛み入る: 감사하여 송구해 죽을 지경이다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-47",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 철저한 각오 표명 서술을 조립하세요. (상황: 어떠한 난관이 찾아오더라도 끝끝내 완벽 통과하겠다고 굳게 약속할 때)",
          japaneseWord: "いかなる困難があろうとも、最後までやり遂げる覚悟です。",
          pronunciation: "いかなるこんなんがあろうとも、さいごまでやりとげるかくごです。",
          correctAnswer: "いかなる 困難が あろうとも、 最後まで  완수할 覚悟です。",
          hint: "설령 그 어떤 막심한 역경 and 고통이 도사릴지라도, 최후까지 이룩해 낼 비장한 각오입니다. (いかなる: 어떠한, 〜とも: ~할지라도, やり遂げる: 완수하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-48",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 상사 존경 진행 표현을 조립하세요. (상황: 탕비실에 있는 과장님께 다가가, 방금 회의실에서 사장님이 과장님을 찾으셨다고 알릴 때)",
          japaneseWord: "課長、先ほど社長がお呼びになっていました。",
          pronunciation: "かちょう、さきほどしゃちょうがおよびになっていました。",
          correctAnswer: "課長、 先ほど 社長が お呼びに なっていました。",
          hint: "과장님, 방금 전 집무실에서 사장님께서 다급히 부르고 계셨습니다. (お呼びになる: 부르시다의 존경형)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-49",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 완곡 결언 겸양 체를 조립하세요. (상황: 외근 출발 직전이라, 오늘의 메시지 소통은 이만 마무리하겠다고 정중히 끝낼 때)",
          japaneseWord: "勝手ながら、本日の返信はこれにて失礼させていただきます。",
          pronunciation: "かってながら、ほんじつのへんしんはこれにてしつれいさせていただきます。",
          correctAnswer: "勝手ながら、 本日の 返信は これにて 失礼させていただきます。",
          hint: "대단히 죄ソン하오나, 금일 전달 메일 업무는 이것으로 이만 실례하여 가름하겠습니다. (これにて: 이것으로, 〜させていただく: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-50",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 N1 단골 환경 인과 표현을 완성하세요. (상황: 화석 연료 다소비로 인한 남극 대기 파멸 현상을 과학적으로 설명할 때)",
          japaneseWord: "地球温暖化が進むにつれて、世界各地で異常気象が多発している。",
          pronunciation: "ちきゅうおんだんかがすすむにつれて、せかいかくちでいじょうきしょうがたはつしている。",
          correctAnswer: "地球温暖化が 進むに つれて、 世界各地で 異常気象が 多発している。",
          hint: "지구 온난화가 급격히 가속화됨에 따라 온 세계 강산에 극심한 이상 기후 현상이 대량 다발하고 있다. (異常気象: 이상 기상, 多発: 다발함)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-51",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 비즈니스 전화 응대 표현을 조립하세요. (상황: 바이어 전화를 접수하고 잠시 대기를 부탁할 때)",
          japaneseWord: "恐れ入ります가、少々お待ちいただけますでしょうか。",
          pronunciation: "おそれいりますが、しょうしょうおまちいただけますでしょうか。",
          correctAnswer: "恐れ入りますが、 少々 お待ちいただけますでしょうか。",
          hint: "죄송합니다만, 잠시만 기다려 주시겠습니까? (恐れ入る: 죄송해하다/황송해하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-52",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 올바른 보관 책임 경어를 만드세요. (상황: 호텔 프론트에서 고객의 대형 캐리어를 안전하게 맡을 때)",
          japaneseWord: "お預かりいたしましたお荷物は、大切に保管いたします。",
          pronunciation: "おあずかりいたしましたおにもつは、たいせつにほかんいたします。",
          correctAnswer: "お預かりいたしました お荷物は、 大切に 保管いたします。",
          hint: "보관을 맡겨 주신 귀중한 짐은 소중하게 관리 보관하겠습니다. (お預かりする: 맡아 보관하다의 겸양형)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-53",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 전향적 검토 선언 경어를 조립하세요. (상황: 새로운 단가 인하안에 대해 긍정적인 평가 계획을 전할 때)",
          japaneseWord: "今後の取引条件について、前向きに検討させていただきます。",
          pronunciation: "こんごのとりひきじょうけんについて、まえむきにけんとうさせていただきます。",
          correctAnswer: "今後の 取引条件について、 前向きに 検討させていただきます。",
          hint: "향후 제시해 주신 거래 조건에 대해서 긍정적으로 기꺼이 검토해 보겠습니다. (前向きに: 긍정적으로/전향적으로)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-54",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 강력한 양자택일 N1 접속 문법을 완성하세요. (상황: 폭풍우와 상관없이 당사 주최 체육대회는 무조건 거행함을 선언할 때)",
          japaneseWord: "雨が降ろうが降るまいが、明日の遠足は決행します。",
          japaneseWord: "雨が降ろうが降るまいが、明日の遠足は決行します。",
          pronunciation: "あめがふろうがふるまいが、あしたのえんそくはけっこうします。",
          correctAnswer: "雨が 降ろうが 降るまいが、 明日の 遠足は 決行します。",
          hint: "내일 하늘에서 큰 비가 내리든 말든, 예정된 야외 소풍은 단호히 결행합니다. (〜う가〜まいが: ~하든 안 하든 간에)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-55",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 격조 높은 안부 서두 문장을 완성하세요. (상황: 10년 만에 고등학교 동창회 단체 메일을 보낼 때)",
          japaneseWord: "ご無沙汰しておりますが、皆様お変わりございませんか。",
          pronunciation: "ごぶさたしておりますが、みなさまおかわりございませんか。",
          correctAnswer: "ご無沙汰しておりますが、 皆様 お変わりございませんか。",
          hint: "그간 오랫동안 연락을 소홀히 올렸사오나, 여러분 모두 건강히 잘 계셨습니까? (ご無沙汰する: 격조하다/연락 못 드리다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-56",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 간략하고 깔끔한 제품 소개 경어를 조립하세요. (상황: 투자회사의 바이어 앞에서 프레젠테이션 핵심을 간략히 설명할 때)",
          japaneseWord: "弊社の新製品について、簡単にご説明申し上げます。",
          pronunciation: "へいしゃのしんせいひんについて、かんたんにごせつめいもうしあげます。",
          correctAnswer: "弊社の 新製品について、 簡単に ご説明 申し上げます。",
          hint: "저희가 이번에 출시한 새 라인업 제품군에 대해 간략히 안내 보고 말씀드리겠습니다. (ご〜申し上げる: 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-57",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 품격 있는 회신 유도 청탁 조립을 완성하세요. (상황: 다소 작성하기 번거로운 세무 신조서를 파트너사에게 부탁하며 기다릴 때)",
          japaneseWord: "お手数をおかけいたしますが、ご返信をお待ちしております。",
          pronunciation: "おてすうをおかけいたします가、ごへんしんをおまちしております。",
          correctAnswer: "お手수를 おかけいたしますが、 ご返信を お待ちしております。",
          hint: "손이 많이 가고 성가신 폐를 끼쳐 죄송하오나 부디 메일 회신을 애타게 기다리겠습니다. (お手数をおかけする: 성가시게 해 드리다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-58",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 고난도 N1 결정 인과 기능어를 조립하세요. (상황: 주총 결과에 따라 회사 미래의 행방이 완전히 엇갈림을 이사회 보고할 때)",
          japaneseWord: "社長の意向如何によっては、会社の再編もあり得る。",
          pronunciation: "しゃちょうのいこういかんによっては、かいしゃのさいへんもありうる。",
          correctAnswer: "社長の 意向 如何によっては、 会社の 再編も あり得る。",
          hint: "오직 사장님의 내면적 생각이나 방침 여하에 따라는 우리 조직의 개편도 충분히 실현 가능합니다. (〜如何によって: ~여하에 따라서, あり得る: 있을 수 있다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-59",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 완벽한 비즈니스 자리 부재 대응을 조립하세요. (상황: 전화가 온 파트너사 담당자에게 전화를 대신 받아 회신을 약속할 때)",
          japaneseWord: "ただいま席を外しておりますので、折り返しお電話いたします。",
          pronunciation: "ただいまぜきをはずしておりますので、おりかえしおでんわいたします。",
          correctAnswer: "ただいま 席を 外しておりますので、 折り返し お電話いたします。",
          hint: "지목하신 사원은 지금 잠깐 자리를 떠나 계신 상황이므로 곧장 즉시 회신 전화를 올리겠습니다. (席を外す: 자리를 비우다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-60",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 긴급 상황 안도 감사를 표시하세요. (상황: 시스템 다운 도중에 엔지니어가 번개같이 조력 전화를 줘 고마울 때)",
          japaneseWord: "至急のご連絡をいただき、誠に助かりました。",
          pronunciation: "しきゅうのごれんらくをいただき、まことにたすかりました。",
          correctAnswer: "至急の ご連絡を いただき、 誠に 助かりました。",
          hint: "위급한 시각에 매우 신속히 대처 전화를 주셔서 정말 천만다행으로 살았습니다. (至急: 긴급/매우 급함, 助かる: 도움을 얻다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-61",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 식음료 존경어 최상급 질문을 조립하세요. (상황: 비즈니스 디너 코스 중 VIP 고객이 어떤 메인을 드실지 물을 때)",
          japaneseWord: "お客様、何をお召し上がりになられますか。",
          pronunciation: "おきゃくさま、なにをおめしあがりになられますか。",
          correctAnswer: "お客様、 何を お召し上がりになられますか。",
          hint: "고객님, 실례지만 오늘 메인 요리는 과연 무엇으로 식사하시겠습니까? (お召し上がりになる: '드시옵시다'의 극존경)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-62",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 최고 권위 감사 겸양을 조립하세요. (상황: 회장의 단독 30분 티타임 면담을 기꺼이 마치고 감사할 때)",
          japaneseWord: "この度は、貴重なお時間をいただき誠に光栄に存じます。",
          pronunciation: "このたびは、きちょうなおじかんをいただきまことにこうえいにぞんじます。",
          correctAnswer: "この度は、 貴重な お時間をいただき 誠に 光栄に 存じます。",
          hint: "이번 기회에 저 같은 인재에게 황송하고도 비싼 면담 시간을 할애해주셔서 더없이 큰 영광입니다. (貴重な: 귀중한, 光栄に存ずる: 영광으로 사료되옵니다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-63",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비장하고 엄격한 N1 문장을 만드세요. (상황: 공장 노동 안전 규칙 위반 시 무관용 원칙으로 기소하겠다고 통보할 때)",
          japaneseWord: "この件に関しては、一切の妥協を排して臨む覚悟だ。",
          pronunciation: "このけんにかんしては、いっさいのだきょうをはいしてのぞむかくごだ。",
          correctAnswer: "この件に 関しては、 一切の 妥協を 排して 臨む覚悟だ。",
          hint: "이 사안에 관련해서 만큼은 그 어떠한 사소한 타협도 전부 철폐하고 강경히 임할 비장한 각오입니다. (排する: 물리치다/제거하다, 臨む: 직면하다/임하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-64",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 순서 약속 비즈니스 겸양 표현을 조립하세요. (상황: 상대 바이어와의 전체 화상 회의 일정이 나오는 대로 곧장 메일 보내줄 때)",
          japaneseWord: "先方との打ち合わせ日程が確定次第、お知らせいたします。",
          pronunciation: "せんぽうとのうちあわせにっていがかくていしだい、おしらせいたします。",
          correctAnswer: "先方との 打ち合わせ日程が 確定次第、 お知らせいたします。",
          hint: "거래 회사 측과의 상세 조율 회의 날짜가 결정되는 즉시 연락 고지해 드리겠습니다. (確定次第: 확정되는 즉시, お知らせする: 고지하다의 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-65",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 공식 연회 수혜 감사를 나타내세요. (상황: 귀빈들이 가득한 신사 준공 감사 잔치에 참가해 소감을 표할 때)",
          japaneseWord: "本日はご招待にあずかり、誠にありがとうございます。",
          pronunciation: "ほんじつはごしょうたいにあずかり、まことにありがとうございます。",
          correctAnswer: "本日は ご招待に あずかり、 誠に ありがとうございます。",
          hint: "귀한 영광이 넘치는 오늘 저녁 큰 연회에 정식으로 절 초대해 주셔서 대단히 감사합니다. (あずかる: 받다/하사입다의 정중형)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-66",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중하고 신속한 샘플 발송 문장을 완성하세요. (상황: 고객이 홈페이지로 청구한 유료 원두 테스팅 백을 당일 곧바로 발송했음을 통보할 때)",
          japaneseWord: "ご要望の製品サンプルを本日、発送いたしました。",
          pronunciation: "ごようぼうのせいひんサンプルをほんじつ、はっそういたしました。",
          correctAnswer: "ご要望の 製品サンプルを 本日、 発送いたしました。",
          hint: "주문 요청해 주신 당사 고기능성 샘플 팩 제품군을 오늘 차질 없이 우편 송부 완료했습니다. (ご要望: 원하는 바/요청)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-67",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 강인한 신념 표출 N1 문법 문장을 조립하세요. (상황: 모든 가족들이 격렬히 말릴지라도 단독 세계일주 탐험을 가겠다고 결의할 때)",
          japaneseWord: "どれほど反対されようとも、私は自分の夢をあきらめない。",
          pronunciation: "どれほどはんたいされようとも、わたしはじぶんのゆめをあきらめない。",
          correctAnswer: "どれほど 反対されようとも、 私は 自分の 夢を あきらめない。",
          hint: "세상 그 누가 저를 맹렬히 방해하고 반대를 쏟아부을지라도 전 제 일평생 소원을 결코 버리지 않습니다. (〜うとも: ~할지라도/~하더라도)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-68",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 은사 칭송 존경 표현을 조립하세요. (상황: 저명한 교수님이 강력 권장해 주신 동경대 고전 명작을 읽고 소감을 고할 때)",
          japaneseWord: "先生がご紹介くださった本は、とても興味深かったです。",
          pronunciation: "せんせいがごしょうかいくださったほんは、てともきょうみぶかかったです。",
          correctAnswer: "先生が ご紹介 くださった本は、 とても 興味深かったです。",
          hint: "선생님께서 친히 귀중하게 책을 추천해 주신 덕에 아주 심오하고 큰 영감을 받아 흥미로웠습니다. (ご紹介くださる: 소개하여 주시다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-69",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 당일 휴일 임시 공지 경어를 만드세요. (상황: 법정 공휴일에 들어온 급작스러운 메일 문의에 정중히 익일 응대를 보장할 때)",
          japaneseWord: "本日休業のため、明朝一番に対応させていただきます。",
          pronunciation: "ほんじつきゅうぎょうのため、みょうちょういちばんにたいおうさせていただきます。",
          correctAnswer: "本日休業のため、 明朝一番に 対応させていただきます。",
          hint: "유감스럽게도 오늘은 정기 휴일이오니, 돌아오는 내일 아침 이른 시각에 조속히 전담 응대해 올리겠습니다. (明朝: 내일 아침, 一番に: 맨 첫 번째로)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-70",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 대외 협력 정중 겸양 표현을 조립하세요. (상황: 소규모 하청 파트너십 계약을 체결하며 귀사에 이바지하겠다고 머리 숙일 때)",
          japaneseWord: "微力ながら、御社の発展に尽くしたいと存じます。",
          pronunciation: "びりょくながら、おんしゃのはってんにつくしたいとぞんじます。",
          correctAnswer: "微力ながら、 御社の  発展に 尽くしたいと 存じます。",
          hint: "가진 재능과 능력은 비록 보잘것없으나 귀사의 무궁한 영광과 발전을 위해 뼈를 묻어 충성하겠습니다. (尽くす: 다하다/이바지하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-71",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 부드러운 고객 존경 의무 지칭 표현을 조립하세요. (상황: 라운지 소파에 안내하며 커피 브루잉 완료 시까지 기다리게 할 때)",
          japaneseWord: "お客様、こちらで少々お待ちいただくことになります。",
          pronunciation: "おきゃくさま、こちらでしょうしょうおまちいただくことになります。",
          correctAnswer: "お客様、 こちらで 少々 お待ちいただくことに なります。",
          hint: "고객님, 대단히 죄송하오나 이 대기 공간에서 아주 잠깐 대기를 좀 해주셔야 하는 양해를 구합니다. (〜ことになります: ~하게 됩니다/~하는 규칙입니다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-72",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 상사 명령 수행 겸양을 조립하세요. (상황: 부장님이 지시하신 서버 보안 패치 프로세스 적용을 완수했음을 보고할 때)",
          japaneseWord: "ご指示いただいた手順に沿って、作業を完了させました。",
          pronunciation: "ごしじいただいたてじゅんにそって、さぎょうをかんりょうさせました。",
          correctAnswer: "ご指示 いただいた 手順に沿って、 作業を  완료시켰습니다.",
          hint: "팀장님이 몸소 가르쳐 주신 복잡한 매뉴얼 순서에 성실히 응하여 해당 수리 프로세스를 잘 끝마쳤습니다. (手順: 순서/절차, 沿う: 따르다/응하다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-73",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 결과 초월 N1 문법을 조립하세요. (상황: 등락 여부와 무관하게 청년들의 피나는 사법고시 분투를 극진히 격려할 때)",
          japaneseWord: "試験の結果いかんに関わらず、努力したことに価値がある。",
          pronunciation: "しけんのけっかいかんんにかわらず、どりょくしたことにかちがある。",
          correctAnswer: "試験の 結果いかんに 関わらず、 努力したことに 価値がある。",
          hint: "시험 합격/불합격의 처참한 성적 결과 여부와 상관없이 뜨겁게 쏟아부은 청춘의 피땀에 진짜 의미가 있습니다. (〜いかんに関わらず: ~여하에 상관없이)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-74",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 최상급 고객 서비스 안내 조립을 완성하세요. (상황: 백화점 귀빈 안내소에서 무엇이든 사소한 필요사항이라도 말해 달라고 할 때)",
          japaneseWord: "何かご不明な点がありましたら、お気軽にお申し付けください。",
          pronunciation: "なにかごふめいなてんがありましたら、おきがるにおもうしつけください。",
          correctAnswer: "何か  ご不明な点が ありましたら、 お気軽に お申し付けください。",
          hint: "사용 중 혹은 쇼핑 중 미심쩍거나 조금이라도 막히는 사항이 있으시다면 전혀 눈치 보지 마시고 지시해 주세요. (お申し付けください: 말씀해 주십시오/명령해 주십시오)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-75",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 완벽한 약속 지각 겸양/사죄 문장을 조립하세요. (상황: 갑작스러운 수도 도쿄 전철 연착으로 파트너 미팅에 10분 지각해 사과할 때)",
          japaneseWord: "お約束の時間に少し遅れてしまい、誠に申し訳ございません。",
          pronunciation: "おやくそくのじかんにすこしおくれてしまい、まことにおもうしわけございません。",
          correctAnswer: "お約束の 時間に 少し 遅れてしまい、 誠に 申し訳ございません。",
          hint: "미리 정해둔 약속 시각보다 아주 소량 늦어 버리는 불찰을 지어 대단히 사죄의 말씀 올립니다. (〜てしまう: ~해 버리다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-76",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 격식 있는 손님 영접 존경을 나타내세요. (상황: 머나먼 홋카이도 외딴 시골에서 본사 창립 세미나 참가를 위해 온 교수님께 감사할 때)",
          japaneseWord: "本日はわざわざ遠くからお越しくださり、感謝いたします。",
          pronunciation: "ほんじつはわざわざとおくからおこしくださり、かんしゃいたします。",
          correctAnswer: "本日は わざわざ 遠くから お越しくださり、 感謝いたします。",
          hint: "오늘 같이 궂은 날씨에 먼 거리에서부터 특별히 행차해 주신 은혜에 진심으로 깊이 감사드립니다. (お越しくださる: 와 주시다의 높은 존경)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-77",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 성공적 비즈니스 마무리 공지 문장을 조립하세요. (상황: 10년간의 국가 우주 탐사 프로젝트가 큰 흠집 없이 대성황리에 종료되었음을 알릴 때)",
          japaneseWord: "この度のプロジェクトは、大成功のうちに終了いたしました。",
          pronunciation: "thisたびのぷろじぇくとは、だいせいこうのうちにしゅうりょういたしました。",
          correctAnswer: "この度の プロジェクトは、 大成功の うちに 終了いたしました。",
          hint: "금번 진행된 막중한 국가 우주 항공 개발 프로젝트는 역대급 성공 속에 영광스럽게 퇴장 마쳤습니다. (〜のうちに: ~의 가운데에/~하는 동안에)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-78",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 시세 비례 N1 기능 조건 조사를 완성하세요. (상황: 국제 유가와 금리가 요동치며 서민들의 소비 심리도 같이 격변함을 학술 강연할 때)",
          japaneseWord: "経済状況が変化するにつれて、市場のニーズも多様化している。",
          pronunciation: "けいざいじょうきょうがへんかするにつれて、しじょうのにーずもたようかしている。",
          correctAnswer: "経済状況が 変化するに つれて、 市場の ニーズも  多様化している。",
          hint: "세계 금융 환경이 시시각각 대량 변천함에 발맞추어, 실질 소비 패턴 시장 니즈도 함께 파편화 다양화되고 있습니다. (〜につれて: ~함에 따라)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-79",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 물건 인수 후 정밀 검증 약속 경어를 조립하세요. (상황: 테스트용 가죽 가공 기계를 납품받고 한 달간 정교하게 시동해 보겠다고 다짐할 때)",
          japaneseWord: "お預かりしたサンプルを、社内にて十分に検証いたします。",
          pronunciation: "おあずかりしたさんぷるを、しゃないにてじゅうぶんにけんしょういたします。",
          correctAnswer: "お預かりした  サンプルを、 社내にて 十分に 検証いたします。",
          hint: "방금 넘겨받은 신제품 원재료 샘플 꾸러미를 당사 품질분석 연구실에서 충분히 면밀 조사해 올리겠습니다. (十分に: 충분히)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-80",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비즈니스 감사/보고 격식 종결구를 만드세요. (상황: 해외 출장 무사 귀국 후 협업 사원들에게 재빠른 약식 이메일 서한을 마칠 때)",
          japaneseWord: "取り急ぎ、メールにて御礼とご報告まで申し上げます。",
          pronunciation: "とりいそぎ、めーるにておんれいとごほうこくまでもうしあげます。",
          correctAnswer: "取り急ぎ、 メールにて 御礼と ご報告まで 申し上げます。",
          hint: "우선 바쁜 사정으로 급한 대로 간결히 이메일 서면으로 감사의 뜻과 상세 출장 복귀 보고를 대략 올립니다. (取り急ぎ: 급히/우선 약식으로)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-81",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 깔끔한 외부 귀빈 방문 존경 보고를 조립하세요. (상황: 접견실 소파에 외빈 사절단이 방금 도착했음을 사내 인터폰으로 팀장께 보고할 때)",
          japaneseWord: "部장、本日予定されていたお客様が到着されました。",
          japaneseWord: "部長、本日予定されていたお客様が到着されました。",
          pronunciation: "ぶちょう、ほんじつよていされていたおきゃくさまがとうちゃくされました。",
          correctAnswer: "部長、 本日 予定されていた お客様が 到着されました。",
          hint: "부장님, 미리 오늘 오후 일정으로 접견 약속이 잡혀 계시던 귀빈 바이어 단이 무사히 회사에 당도하셨습니다. (到着される: 도착하시다의 존경형)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-82",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 신속한 물건 지참 겸양 행동 표현을 조립하세요. (상황: 전시관 팜플렛이 부족하다고 지적한 손님에게 얼른 창고에서 새 책자를 꺼내 줄 때)",
          japaneseWord: "ただいま新しいカタログをお持ちいたしますので、お待ちください。",
          pronunciation: "ただいまあたらしいかたろぐをおもちいたしますので、おまちください。",
          correctAnswer: "ただいま  新しい カタログを お持ちいたしますので、 お待ちください。",
          hint: "염려 마십시오. 지금 즉시 뒤편 서재에서 최신 카탈로그 소책자를 대령해 올릴 테니 찰나만 기다려 주세요. (お持ちする: 가져오다/지참하다의 겸양형)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-83",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 중차대한 사안 지칭 N1 문장을 완성하세요. (상황: 이번 다국적 거대 제약 합병 계약이 우리 연구소 생존에 직결됨을 학술 토론할 때)",
          japaneseWord: "今回の契約は、我が社にとって極めて重要な意味を持つ。",
          pronunciation: "こんかいのけいやくは、わがしゃにとってきわめてじゅうようないみをもつ。",
          correctAnswer: "今回の 契約は、 我が社にとって 極めて 重要な 意味を持つ。",
          hint: "금번 조인식으로 귀결된 대형 합약서는 당사 역사 50년에 있어서 극도로 파괴적인 핵심 가치를 함유합니다. (〜にとって: ~에 있어서/~의 입장에서, 極めて: 지극히/극도로)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-84",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 진척 공유 비즈니스 겸양 약조를 조립하세요. (상황: 새로운 부품 칩 공급 상황을 매주 월요일마다 정기 이메일로 팀원들에게 송부하겠다고 할 때)",
          japaneseWord: "今後の進捗に関しては、随時メールにて共有申し上げます。",
          pronunciation: "こんごのしんちょくにかんしては、ずいじめーるにてきょうゆうもうしあげます。",
          correctAnswer: "今後の  進捗に関しては、 随時 メールにて 共有申し上げます。",
          hint: "향후 설계 라인업의 세부 진행 정도에 대해서는 끊임없이 매번 서신 공유 보고를 아낌없이 올리겠습니다. (進捗: 진척, 随時: 필요에 따라 언제든)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-85",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 복수 소통 유도 의문문을 조립하세요. (상황: 아침에 약식 팩스를 보내 놓고, 잘 받아 보셨는지 지금 짧은 통화 가능 여부를 타진할 때)",
          japaneseWord: "先ほどお電話いたしました件ですが、少しよろしいでしょうか。",
          pronunciation: "さきほどおдеんわいたしましたけんですが、すこしよろしいでしょうか。",
          correctAnswer: "先ほど お電話いたしました 件ですが、  少し よろしいでしょうか。",
          hint: "조금 전 긴히 목소리로 유선 전송 드렸던 급한 사안 건인데, 실례지만 대화 시간 아주 소량 허락되실까요? (よろしいでしょうか: 괜찮으실까요의 정중 표현)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-86",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 고객 서식 기입 의문을 완성하세요. (상황: 헬스장 신규 가입 원장 양식판을 건네며 이름 적기를 부탁할 때)",
          japaneseWord: "お客様、こちらにお名前をご記入いただけますでしょうか。",
          pronunciation: "おきゃくさま、こちらにおなまえをごきにゅういただけますでしょうか。",
          correctAnswer: "お客様、 こちらに お名前を ご記入いただけますでしょうか。",
          hint: "고객님, 번거로우시겠지만 펜을 들어 이 칸에 성함을 바르게 기재해 주시기를 요청드려도 괜찮을까요? (ご記入いただく: 기입을 받다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-87",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 격조 높은 상황 대처 요구 서술을 조립하세요. (상황: 실시간 엔화 환율 폭등 추세 속에 마케팅팀의 초단기 반등 대응이 긴급할 때)",
          japaneseWord: "状況が刻々と変化するなかで、迅速な対応が求められている。",
          pronunciation: "じょうきょうがこくこくとへんかするなかで、じんそくなたいおう가もとめられている。",
          correctAnswer: "状況が 刻々と 変化するなかで、 迅速な 対応が 求められている。",
          hint: "원자재 환경 시장이 정말 눈 깜짝할 사이에 급변하는 국면이므로, 번개 같은 대응이 절실히 강제됩니다. (刻々と: 시시각각으로, 迅速な: 신속한)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-88",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중하고도 황송한 비즈니스 감사를 표현하세요. (상황: 주말 밤늦게 보낸 질문 메일에 성심성의껏 긴 피드백을 준 담당자에게 회신할 때)",
          japaneseWord: "ご丁寧なお返事をいただき、大変恐縮に存じます。",
          pronunciation: "ごていねいなおへんじをいただき、たいへんきょうしゅくにぞんじます。",
          correctAnswer: "ご丁寧な  お返事を いただき、 大変 恐縮に 存じます。",
          hint: "이렇게까지 성의가 넘치는 귀중한 해답 연락을 받게 되어, 한편으로 몸 둘 바 모르게 송구스럽습니다. (恐縮に存ずる: 죄송하고 감사히 사료되옵니다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-89",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 부드러운 당부 겸양 권유 문장을 완성하세요. (상황: 당사 신임 분양 아파트 카탈로그를 한번 찬찬히 읽어 달라고 요청할 때)",
          japaneseWord: "弊社のパンフレットを、ご一読いただけますと大変助かります。",
          pronunciation: "へいしゃのぱんふれっとを、ごいちどくいただけますとたいへんたすかります。",
          correctAnswer: "弊社の  パンフレットを、 ご一読 いただけますと 大変助かります。",
          hint: "바쁘신 와중이지만 저희 주택 홍보 소책자를 편하게 일독해주신다면 정말 더없이 든든하고 고맙겠습니다. (ご一読: 한번 읽어봄)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-90",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 비즈니스 대외 최고 청원 구문을 완성하세요. (상황: 마지막 단가 테이블 재조정 요구 계약서를 올리며 간청할 때)",
          japaneseWord: "何卒よろしくご検討くださいますようお願い申し上げます。",
          pronunciation: "なにとぞよろしくごけんとうくださいますようおねがいもうしあげます。",
          correctAnswer: "何卒  よろしく ご検討 くださいますよう お願い申し上げます。",
          hint: "아무쪼록 부디 너그럽고 긍정적으로 계약 사항을 다시 들여다봐주실 것을 엎드려 당부드립니다. (何卒: 모쪼록/부디)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-91",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 깔끔한 상사 언사 존경 보고를 조립하세요. (상황: 아침 회의석상에서 사장님이 언급한 연봉 인상 발언의 가치를 찬양할 때)",
          japaneseWord: "社長が会議にておっしゃった内容は、非常に重要でした。",
          pronunciation: "しゃちょうがかいぎにておっしゃったないようは、ひじょうにじゅうようでした。",
          correctAnswer: "社長が 会議にて おっしゃった内容は、 非常に 重要でした。",
          hint: "오늘 조찬 보드룸에서 사장님께서 입을 열어 말씀해 주신 그 핵심 주제는 정말 막대하게 가치 있었습니다. (おっしゃる: 말씀하시다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-92",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 성실하고 조력 의지가 넘치는 겸양 표현을 조립하세요. (상황: 신생 개발 벤처팀에 파견되어 조금이라도 기술 보탬을 주고 싶다고 다짐할 때)",
          japaneseWord: "微力ながら、皆様のお役に立てるよう努力いたします。",
          pronunciation: "びりょくながら、みなさまのおやくにたてるようどりょくいたします。",
          correctAnswer: "微力ながら、  皆様の お役に立てるよう 努力いたします。",
          hint: "미진하고 부족한 미천한 실력이나마, 동료 사원분들의 큰 성공에 윤활유가 되도록 열심히 뛰겠습니다. (役に立つ: 도움이 되다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-93",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 운명 극복 N1 기능 퀴즈 문장을 만드세요. (상황: 결국 난관 타개의 실쇠가 개인의 불굴의 집념에 전적으로 달렸음을 인생 조언할 때)",
          japaneseWord: "本日の努力いかんによっては、道は開けるものである。",
          japaneseWord: "本人の努力いかんによっては、道は開けるものである。",
          pronunciation: "ほんにんのどりょくいかんによっては、みちはひらけるものである。",
          correctAnswer: "本人の 努力 いかんによっては、 道は 開けるものである。",
          hint: "외부 탓을 할 것이 아니라 수험생 본인의 진실된 필사적 분투 방식 여하에 따라 마침내 광명이 열리는 법입니다. (〜いかんによって: ~여하에 따라서)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-94",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 일방적 제안 양해 청약 구문을 만드세요. (상황: 회사 예산 부족으로 당장 무리한 단가 동결을 갑작스레 요구하며 재고를 빌 때)",
          japaneseWord: "勝手なお願いで申し訳ありませんが、ご一考ください。",
          pronunciation: "かってなおねがいでもうしわけありませんが、ごいっこうください。",
          correctAnswer: "勝手な お願いで 申し訳ありませんが、 ご一考 ください。",
          hint: "일방적이고 무례한 청원 사안이라 면목이 없사오나, 부디 이번 한 번만 너그럽게 다시 헤아려 주십시오. (勝手な: 일방적인/자기중심적인)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-95",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 당사 전담 겸양 책임 표현을 완성하세요. (상황: 중요한 대외 지적재산권 실무 회의 PPT 자료는 당사 디자인팀이 도맡아 하겠다고 나설 때)",
          japaneseWord: "本日の打ち合わせの資料は、私どもで準備いたします。",
          pronunciation: "ほんじつのうちあわせのしりょうは、わたしどもでじゅんびいたします。",
          correctAnswer: "本日の 打ち合わせの資料は、 私どもで 準備いたします。",
          hint: "오늘 오후에 다 같이 모여 의논할 세부 세미나용 참고 파일 목록은 저희 실무진 측에서 깔끔히 대령하겠습니다. (私ども: 저희/우리측)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-96",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 N1 단골 범위 한정 표현을 만드세요. (상황: 평생을 바친 무궁화 개량 바이오 연구 논문이 마침내 네이처지에 등재되어 기쁠 때)",
          japaneseWord: "長年にわたる研究の成果が、ついに認められた。",
          pronunciation: "ながねんにわたるけんきゅうのせいかが、ついにみとめられた。",
          correctAnswer: "長年に わたる 研究の成果が、 ついに 認められた。",
          hint: "청춘의 평생 주기를 관통하여 바쳐 온 위대한 노고의 결정체가 마침내 전 세계에 널리 인정받았습니다. (〜にわたる: ~에 걸친, ついに: 마침내/결국)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-97",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 정중한 명절 카드 기원 겸양 문구를 만드세요. (상황: 새해 연하장 메일을 마감하며 고객 가정의 번영과 무병장수를 진심으로 축원할 때)",
          japaneseWord: "ご健康とご多幸を、心よりお祈り申し上げます。",
          pronunciation: "ごけんこうとごたこうを、こころよりおいのりもうしあげます。",
          correctAnswer: "ご健康と ご多幸を、 心より お祈り申し上げます。",
          hint: "희망찬 올 한 해 동안 내내 가정이 두루 평안하시고 무궁무진한 다복이 깃드시길 온 힘 다해 축원합니다. (お祈り申し上げる: 기원드리다)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-98",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 완벽한 고객 전담 응대 태세 표현을 조립하세요. (상황: 호텔 VIP 스위트룸 비서가 고객 체크인 시 24시간 언제든 편히 부르라고 안내할 때)",
          japaneseWord: "何かありましたら、何なりとお申し付けください。",
          pronunciation: "なにかありましたら、なんなりとおもうしつけください。",
          correctAnswer: "何か ありましたら、  何なりと お申し付けください。",
          hint: "혹시 투숙하시는 동안 조그마한 불편 사항이나 지시할 룸서비스가 필요하시면 사소한 것이라도 다 말씀하세요. (何なりと: 무엇이든지 기꺼이, お申し付けください: 지시/분부해 주십시오)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-99",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 약속 이행 겸양 방문 일정을 조립하세요. (상황: 사전 유선 통화로 부장님이 정해 주신 시간대에 귀사 마케팅 회의실로 찾아가겠다고 할 때)",
          japaneseWord: "ご指示いただいた時間に、オフィスへお伺いいたします。",
          pronunciation: "ごしじいただいたじかんに、おふぃすへおうかがいいたします。",
          correctAnswer: "ご指示  いただいた 時間に、 オフィスへ お伺いいたします。",
          hint: "알려주신 그 정밀한 지정 시간대에 조금도 오차 없이 귀사의 비즈니스 룸으로 찾아뵙겠습니다. (お伺いする: 찾아뵙다/여쭙다의 겸양)",
          wrongAnswers: "[]"
        },
        {
          id: "v-quiz-100",
          stageId: "virtual-stage-5-uuid",
          quizType: "ASSEMBLY",
          questionText: "[N1-ASSEMBLY] 주어진 단어 카드를 조합하여 문법 비례적 추이 N1 표현을 조립하세요. (상황: 디지털 고도 스마트화가 진행되면서 인류의 전반적 사유 능력이 퇴보함을 성토할 때)",
          japaneseWord: "技術が発展するにつれて、人間の生活様式も大きく変化した。",
          pronunciation: "ぎじゅつがはってんするにつれて、にんげんのせいかつようしきもおおきくへんかした。",
          correctAnswer: "技術が  発展するに つれて、 人間の 生活様式も 大きく変化した。",
          hint: "현대 기술 문명이 극한으로 개발 진보함에 비례하여 인류의 일상 생리적 생업 방식도 실로 거대하게 변천했습니다. (〜につれて: ~함에 따라서, 生活様式: 생활 양식)",
          wrongAnswers: "[]"
        }
      ];

      // 💡 [매일 훈련 전용 스마트 무작위 셔플링 연동 - 100문항 버전]
      // 100개의 풍부한 킬러 퀴즈 풀에서 매번 실행할 때마다 무작위 10문항을 셔플하여 동적으로 추출합니다!
      const randomlyShuffledPool = shuffleArray(assemblyQuizzes);
      const selectedTenQuizzes = randomlyShuffledPool.slice(0, 10);

      const fullyFeaturedQuizzes = selectedTenQuizzes.map(quiz => {
        const words = quiz.correctAnswer.split(' ').map(w => w.trim()).filter(Boolean);
        const shuffledOptions = shuffleArray(words);
        return {
          ...quiz,
          options: shuffledOptions,
          correctAnswer: quiz.japaneseWord
        };
      });

      return NextResponse.json({
        success: true,
        stage: virtualStage,
        quizzes: fullyFeaturedQuizzes
      });
    }

    // 📝 6코스 N1 언어지식 하프 모의고사 가상 라우팅
    if (stageNumber === 6) {
      const virtualStage = {
        id: "virtual-stage-6-uuid",
        stageNumber: 6,
        title: "📝 실전 15분 모의고사",
        category: "MOCK_EXAM",
        jlptLevel: "N1",
        difficulty: "HARD"
      };

      // N1 전체 퀴즈 풀 로드
      const allN1Quizzes = await prisma.quiz.findMany({
        where: {
          questionText: {
            contains: '[N1-'
          }
        },
        include: { stage: true }
      });

      if (allN1Quizzes.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: "N1 모의고사용 퀴즈 데이터를 찾을 수 없습니다. 대시보드에서 5000+ 문항 동기화를 먼저 진행해 주세요." 
        }, { status: 404 });
      }

      // 카테고리별 분할 셔플 추출 (문자 5, 어휘 5, 문법 5)
      const charPool = shuffleArray(allN1Quizzes.filter(q => q.stage.category === 'CHARACTERS')).slice(0, 5);
      const vocabPool = shuffleArray(allN1Quizzes.filter(q => q.stage.category === 'VOCAB')).slice(0, 5);
      const gramPool = shuffleArray(allN1Quizzes.filter(q => q.stage.category === 'GRAMMAR')).slice(0, 5);

      // 15문항 하프 모의고사 풀 병합 및 최종 셔플
      const mergedQuizzes = shuffleArray([...charPool, ...vocabPool, ...gramPool]);

      // 보기 목록 셔플 가공
      let selectedQuizzes = mergedQuizzes.map(quiz => {
        if (quiz.wrongAnswers) {
          try {
            const wrongList = JSON.parse(quiz.wrongAnswers);
            if (Array.isArray(wrongList) && wrongList.length > 0) {
              const allOptions = shuffleArray([quiz.correctAnswer, ...wrongList]);
              return {
                ...quiz,
                options: allOptions,
                wrongAnswers: undefined
              };
            }
          } catch (e) {
            console.error("모의고사 보기 셔플 에러:", e);
          }
        }
        return quiz;
      });

      return NextResponse.json({
        success: true,
        stage: virtualStage,
        quizzes: selectedQuizzes
      });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const jlptLevel = searchParams.get('jlptLevel') || 'N1'; // 대분류: N1 (N2 무시)
    const difficulty = searchParams.get('difficulty') || 'EASY'; // 소분류: EASY, MEDIUM, HARD

    // 1. 스테이지 카테고리 정보 조회
    const stage = await prisma.stage.findUnique({
      where: { stageNumber }
    });

    if (!stage) {
      return NextResponse.json({ success: false, error: '존재하지 않는 스테이지입니다.' }, { status: 404 });
    }

    // 2. 다차원 메타 태그 검색 쿼리 수행
    // [N2-EASY], [N1-HARD] 등 본문 접두사 매핑
    const metaSearchTag = `[${jlptLevel}-${difficulty}]`;

    const allQuizzesInPool = await prisma.quiz.findMany({
      where: {
        stageId: stage.id,
        questionText: {
          contains: metaSearchTag
        }
      }
    });

    if (allQuizzesInPool.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `해당 카테고리의 ${jlptLevel} [${difficulty}] 퀴즈 데이터를 찾을 수 없습니다. 상단에서 240+ 문항 강제 동기화 버튼을 먼저 눌러주세요.` 
      }, { status: 404 });
    }

    // 3. 240문항 풀에서 실시간 완전 무작위 셔플링
    const fullyShuffledPool = shuffleArray(allQuizzesInPool);

    // 4. 무작위 10문항 동적 추출
    let selectedQuizzes = fullyShuffledPool.slice(0, 10);

    // 5. 보기 셔플하여 정답 위치 무작위화 (wrongAnswers가 존재하는 모든 퀴즈 확장)
    selectedQuizzes = selectedQuizzes.map(quiz => {
      if (quiz.wrongAnswers) {
        try {
          const wrongList = JSON.parse(quiz.wrongAnswers);
          if (Array.isArray(wrongList) && wrongList.length > 0) {
            const allOptions = shuffleArray([quiz.correctAnswer, ...wrongList]);
            
            return {
              ...quiz,
              options: allOptions,
              wrongAnswers: undefined // 정답 은폐
            };
          }
        } catch (e) {
          console.error("보기 목록 셔플 파싱 에러:", e);
        }
      }
      return quiz;
    });

    return NextResponse.json({
      success: true,
      stage: {
        id: stage.id,
        stageNumber: stage.stageNumber,
        title: stage.title,
        category: stage.category,
        jlptLevel: jlptLevel,
        difficulty: difficulty
      },
      quizzes: selectedQuizzes
    });
  } catch (error) {
    console.error('다차원 퀴즈 추출 엔진 에러:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
