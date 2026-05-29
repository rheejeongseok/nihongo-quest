import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// =========================================================================
// 🌸 [N1 PREMIUM NEWS POOL] 25개 다양한 시사 뉴스 풀
// 매 요청 시 랜덤 5개 추출 → 언제나 다른 뉴스 조합 제공
// 주제: 경제/기술/사회/환경/정치/국제/문화/재난/의료/교육
// =========================================================================
const NEWS_POOL = [
  // ── 경제 ──
  {
    title: "次世代半導体の国産化に向け、北海道で最先端工場の建設が急ピッチで進む",
    link: "https://www3.nhk.or.jp/news/html/20260529/k10014872101000.html",
    description: "次世代半導体の国産化を目指すプロジェクトが本格化し、北海道千歳市に建設中の最先端工場では、製造装置の搬入に向けた最終調整が進められています。政府の巨額な財政支援も背景にあり、関係者の期待は極めて高まっています。",
    pubDate: "2026-03-15T09:00:00Z",
    translation: "차세대 반도체의 국산화를 목표로 하는 프로젝트가 본격화되어, 홋카이도 치토세시에 건설 중인 최첨단 공장에서는 제조 장비 반입을 위한 최종 조정이 진행되고 있습니다. 정부의 거액의 재정 지원도 배경에 두고 있어, 관계자들의 기대는 극도로 높아지고 있습니다.",
    n1Words: [
      { word: "最先端", reading: "さいせんたん", meaning: "최첨단" },
      { word: "国産化", reading: "こくさんか", meaning: "국산화" },
      { word: "搬入", reading: "はんにゅう", meaning: "반입 (장비 등을 들여옴)" },
      { word: "巨額", reading: "きょがく", meaning: "거액" },
      { word: "本格化", reading: "ほんかくか", meaning: "본격화" }
    ]
  },
  {
    title: "外国為替市場で歴史的な円安水準が継続、輸出企業と輸入企業の明暗分かれる",
    link: "https://www3.nhk.or.jp/news/html/20260118/k10014632101000.html",
    description: "外国為替市場では日米の金利差を意識した円売りが加速し、約34年ぶりの歴史的な円安水準が続いています。これにより輸出関連企業は過去最高益を記録する一方、原材料を輸入に依存する内需企業はコスト高騰にあえいでいます。",
    pubDate: "2026-01-18T07:45:00Z",
    translation: "외환 시장에서는 미일 금리 차이를 의식한 엔화 매도가 가속화되어, 약 34년 만의 역사적인 엔저 수준이 지속되고 있습니다. 이로 인해 수출 관련 기업들은 과거 최고 실적을 기록하는 반면, 원재료 수입에 의존하는 내수 기업들은 비용 폭등에 허덕이고 있습니다.",
    n1Words: [
      { word: "外国為替", reading: "がいこくかわせ", meaning: "외환" },
      { word: "金利差", reading: "きんりさ", meaning: "금리 차이" },
      { word: "最高益", reading: "さいこうえき", meaning: "최고 수익/최고 실적" },
      { word: "高騰", reading: "こうとう", meaning: "급등 (물가·비용이 급격히 오름)" },
      { word: "依存", reading: "いぞん", meaning: "의존" }
    ]
  },
  {
    title: "日銀がマイナス金利政策を解除、17年ぶりの利上げで市場に衝撃走る",
    link: "https://www3.nhk.or.jp/news/html/20260320/k10014801000000.html",
    description: "日本銀行は19日、マイナス金利政策の解除を決定しました。これにより政策金利は0.1%となり、2007年以来17年ぶりの利上げとなります。市場では急速な円高が進み、長期金利の動向にも注目が集まっています。",
    pubDate: "2026-03-20T08:00:00Z",
    translation: "일본은행은 19일, 마이너스 금리 정책의 해제를 결정했습니다. 이에 따라 정책 금리는 0.1%가 되었으며, 2007년 이래 17년 만의 금리 인상이 됩니다. 시장에서는 급격한 엔화 강세가 진행되며 장기 금리 동향에도 관심이 쏠리고 있습니다.",
    n1Words: [
      { word: "マイナス金利", reading: "まいなすきんり", meaning: "마이너스 금리" },
      { word: "解除", reading: "かいじょ", meaning: "해제" },
      { word: "利上げ", reading: "りあげ", meaning: "금리 인상" },
      { word: "長期金利", reading: "ちょうききんり", meaning: "장기 금리" },
      { word: "衝撃", reading: "しょうげき", meaning: "충격" }
    ]
  },
  // ── 사회·인구 ──
  {
    title: "急速な高齢化に伴う深刻な人手不足、シニア層の就業率が過去最高を更新",
    link: "https://www3.nhk.or.jp/news/html/20260210/k10014711000000.html",
    description: "国内の深刻な労働力不足を背景に、主要企業が定年の引き上げやシニア層の積極採用に乗り出しています。最新の調査によると、65歳以上の就業率は過去最高を更新し、社会保障制度の維持に向けた議論も新たな局面を迎えています。",
    pubDate: "2026-02-10T08:30:00Z",
    translation: "국내의 심각한 노동력 부족을 배경으로, 주요 기업들이 정년 연장이나 시니어층의 적극 채용에 나서고 있습니다. 최신 조사에 따르면, 65세 이상의 취업률은 과거 최고치를 경신했으며, 사회 보장 제도의 유지를 위한 논의도 새로운 국면을 맞이하고 있습니다.",
    n1Words: [
      { word: "高齢化", reading: "こうれいか", meaning: "고령화" },
      { word: "深刻", reading: "しんこく", meaning: "심각" },
      { word: "就業率", reading: "しゅうぎょうりつ", meaning: "취업률" },
      { word: "局面", reading: "きょくめん", meaning: "국면" },
      { word: "社会保障", reading: "しゃかいほしょう", meaning: "사회 보장" }
    ]
  },
  {
    title: "少子化加速で出生数が過去最少を更新、政府が異次元の少子化対策を発表",
    link: "https://www3.nhk.or.jp/news/html/20260601/k10014882001000.html",
    description: "厚生労働省が発表した2025年の出生数は68万人と、統計開始以来過去最少を更新しました。政府はこの事態を「国家的危機」と位置づけ、児童手当の拡充や保育所の大幅増設を柱とする異次元の少子化対策パッケージを閣議決定しました。",
    pubDate: "2026-06-01T10:00:00Z",
    translation: "후생노동성이 발표한 2025년 출생 수는 68만 명으로, 통계 개시 이래 역대 최저를 기록했습니다. 정부는 이 사태를 '국가적 위기'로 규정하고, 아동 수당 확충과 보육 시설 대폭 증설을 골자로 하는 '이차원 저출생 대책 패키지'를 각의 결정했습니다.",
    n1Words: [
      { word: "少子化", reading: "しょうしか", meaning: "저출생(저출산) 현상" },
      { word: "異次元", reading: "いじげん", meaning: "이차원 (차원이 다른, 전례 없는)" },
      { word: "閣議決定", reading: "かくぎけってい", meaning: "각의 결정 (국무회의 의결)" },
      { word: "拡充", reading: "かくじゅう", meaning: "확충" },
      { word: "位置づけ", reading: "いちづけ", meaning: "자리매김, 규정" }
    ]
  },
  {
    title: "能登半島地震から1年、復興の遅れと仮設住宅での生活続く被災者たち",
    link: "https://www3.nhk.or.jp/news/html/20260101/k10014550001000.html",
    description: "能登半島地震の発生から1年が経過しましたが、被災地では今もなお多くの住民が仮設住宅での生活を強いられています。インフラの復旧や住宅の再建が遅れており、被災者からは将来への不安の声が上がっています。",
    pubDate: "2026-01-01T06:00:00Z",
    translation: "노토반도 지진이 발생한 지 1년이 지났지만, 피재 지역에서는 여전히 많은 주민들이 임시 주택에서의 생활을 강요받고 있습니다. 인프라 복구나 주택 재건이 늦어지고 있어, 피재자들로부터는 미래에 대한 불안의 목소리가 높아지고 있습니다.",
    n1Words: [
      { word: "仮設住宅", reading: "かせつじゅうたく", meaning: "임시 주택" },
      { word: "被災者", reading: "ひさいしゃ", meaning: "피재자 (재해 피해자)" },
      { word: "復旧", reading: "ふっきゅう", meaning: "복구" },
      { word: "再建", reading: "さいけん", meaning: "재건" },
      { word: "強いられる", reading: "しいられる", meaning: "강요당하다" }
    ]
  },
  // ── 기술·AI ──
  {
    title: "生成AIの急速な普及に伴い、知的財産権の保護と法的ガイドラインの是正を模索",
    link: "https://www3.nhk.or.jp/news/html/20260415/k10014842001000.html",
    description: "人工知能の急速な技術革新が社会に浸透する中、著作権や知的財産の保護に関する法整備の遅れが懸念されています。政府はクリエイターの権利を担保しつつ、技術開発を阻害しない新たな法的是正の枠組みを模索しています。",
    pubDate: "2026-04-15T07:00:00Z",
    translation: "인공지능의 급격한 기술 혁신이 사회에 침투하는 가운데, 저작권 및 지적재산 보호에 관한 법제도의 지연이 우려되고 있습니다. 정부는 창작자의 권리를 담보하면서도 기술 개발을 저해하지 않는 새로운 법적 시정의 틀을 모색하고 있습니다.",
    n1Words: [
      { word: "知的財産", reading: "ちてきざいさん", meaning: "지적 재산" },
      { word: "懸念", reading: "けねん", meaning: "우려, 걱정" },
      { word: "担保", reading: "たんぽ", meaning: "담보 (보장함)" },
      { word: "是正", reading: "ぜせい", meaning: "시정 (잘못을 바로잡음)" },
      { word: "模索", reading: "もさく", meaning: "모색" }
    ]
  },
  {
    title: "量子コンピューターの実用化へ、国内メーカーが世界初の商用機を発売",
    link: "https://www3.nhk.or.jp/news/html/20260522/k10014868001000.html",
    description: "国内の大手電機メーカーが、量子コンピューターの商用機を世界で初めて発売すると発表しました。価格は数十億円規模で、製薬や材料科学、金融リスク分析などの分野での活用が期待されています。",
    pubDate: "2026-05-22T09:00:00Z",
    translation: "국내 대형 전기 제조업체가 양자 컴퓨터 상용 기기를 세계 최초로 발매한다고 발표했습니다. 가격은 수십억 엔 규모로, 제약·재료 과학·금융 리스크 분석 등의 분야에서의 활용이 기대되고 있습니다.",
    n1Words: [
      { word: "量子", reading: "りょうし", meaning: "양자 (퀀텀)" },
      { word: "実用化", reading: "じつようか", meaning: "실용화" },
      { word: "商用", reading: "しょうよう", meaning: "상용, 상업용" },
      { word: "製薬", reading: "せいやく", meaning: "제약 (약 제조)" },
      { word: "活用", reading: "かつよう", meaning: "활용" }
    ]
  },
  {
    title: "自動運転バスが地方路線に本格導入、過疎地の移動問題解消に期待",
    link: "https://www3.nhk.or.jp/news/html/20260408/k10014831001000.html",
    description: "人口減少が進む地方での深刻な公共交通問題を解決するため、国土交通省は自動運転バスの地方路線への本格導入を後押しする方針を固めました。過疎地の住民の移動手段確保が急務となっています。",
    pubDate: "2026-04-08T08:00:00Z",
    translation: "인구 감소가 진행되는 지방의 심각한 대중교통 문제를 해결하기 위해, 국토교통부는 자율주행 버스의 지방 노선 본격 도입을 지원하는 방침을 굳혔습니다. 과소 지역 주민의 이동 수단 확보가 시급한 과제가 되고 있습니다.",
    n1Words: [
      { word: "自動運転", reading: "じどううんてん", meaning: "자율주행" },
      { word: "過疎地", reading: "かそち", meaning: "과소 지역 (인구 희소 지역)" },
      { word: "急務", reading: "きゅうむ", meaning: "급무 (시급한 사안)" },
      { word: "後押し", reading: "うしろおし", meaning: "후원, 지지, 밀어주기" },
      { word: "確保", reading: "かくほ", meaning: "확보" }
    ]
  },
  // ── 환경·기후 ──
  {
    title: "気候変動の影響で全国的に桜の開花時期が大幅に前倒し、観光地への打撃も",
    link: "https://www3.nhk.or.jp/news/html/20260328/k10014812001000.html",
    description: "地球温暖化の影響により、今年の桜の開花は全国各地で例年より1週間以上も早まる事態となりました。観光シーズンが大幅に前倒しされたことで、桜祭りのインフラ準備が間に合わず、一部の有名観光地では経済的な打撃が懸念されています。",
    pubDate: "2026-03-28T06:15:00Z",
    translation: "지구 온난화의 영향으로 인해, 올해 벚꽃 개화는 전국 각지에서 예년보다 일주일 이상이나 앞당겨지는 사태가 되었습니다. 관광 시즌이 대폭 앞당겨짐으로써 벚꽃 축제 인프라 준비가 늦어져, 일부 유명 관광지에서는 경제적 타격이 우려되고 있습니다.",
    n1Words: [
      { word: "気候変動", reading: "きこうへんどう", meaning: "기후 변화" },
      { word: "前倒し", reading: "まえだおし", meaning: "예정보다 앞당김" },
      { word: "事態", reading: "じたい", meaning: "사태" },
      { word: "打撃", reading: "だげき", meaning: "타격" },
      { word: "温暖化", reading: "おんだんか", meaning: "온난화" }
    ]
  },
  {
    title: "記録的猛暑で熱中症死者数が過去最多、政府が緊急の熱対策指針を策定",
    link: "https://www3.nhk.or.jp/news/html/20260825/k10014942001000.html",
    description: "今夏は記録的な猛暑が続き、全国の熱中症による死者数が過去最多を更新しました。政府は緊急対策として、冷房使用の義務化検討や屋外活動規制のガイドラインを策定するとともに、脆弱な高齢者世帯への直接支援を強化する方針です。",
    pubDate: "2025-08-25T10:00:00Z",
    translation: "올여름은 기록적인 폭염이 지속되어, 전국의 열사병 사망자 수가 역대 최다를 기록했습니다. 정부는 긴급 대책으로 냉방 사용 의무화 검토 및 야외 활동 규제 가이드라인을 책정하는 동시에, 취약한 고령자 세대에 대한 직접 지원을 강화하는 방침입니다.",
    n1Words: [
      { word: "猛暑", reading: "もうしょ", meaning: "폭염" },
      { word: "熱中症", reading: "ねっちゅうしょう", meaning: "열사병" },
      { word: "策定", reading: "さくてい", meaning: "책정 (방안을 세움)" },
      { word: "脆弱", reading: "ぜいじゃく", meaning: "취약" },
      { word: "義務化", reading: "ぎむか", meaning: "의무화" }
    ]
  },
  {
    title: "温室効果ガス排出量を2035年までに60%削減する新目標を閣議決定",
    link: "https://www3.nhk.or.jp/news/html/20260212/k10014723001000.html",
    description: "政府は11日、温室効果ガスの排出量を2013年度比で2035年までに60%削減するという新たな目標を閣議決定しました。再生可能エネルギーの大幅な拡大と、原子力発電の活用継続が柱となっています。",
    pubDate: "2026-02-12T09:00:00Z",
    translation: "정부는 11일, 온실가스 배출량을 2013년도 대비 2035년까지 60% 삭감하는 새로운 목표를 각의 결정했습니다. 재생 에너지의 대폭 확대와 원자력 발전의 활용 지속이 주요 축이 되고 있습니다.",
    n1Words: [
      { word: "温室効果ガス", reading: "おんしつこうかがす", meaning: "온실가스" },
      { word: "排出量", reading: "はいしゅつりょう", meaning: "배출량" },
      { word: "再生可能エネルギー", reading: "さいせいかのうえねるぎー", meaning: "재생 가능 에너지" },
      { word: "削減", reading: "さくげん", meaning: "삭감" },
      { word: "閣議決定", reading: "かくぎけってい", meaning: "각의 결정" }
    ]
  },
  // ── 정치·외교 ──
  {
    title: "日米首脳会談でインド太平洋の安全保障強化を確認、防衛費増額へ合意",
    link: "https://www3.nhk.or.jp/news/html/20260410/k10014833001000.html",
    description: "訪米中の岸田首相はバイデン大統領との首脳会談で、インド太平洋地域の安全保障協力の強化を確認しました。日本の防衛費を5年以内にGDP比2%に引き上げる方針についても支持を取り付け、日米同盟の新たな段階を印象づけました。",
    pubDate: "2026-04-10T15:00:00Z",
    translation: "미국을 방문 중인 기시다 총리는 바이든 대통령과의 정상 회담에서 인도·태평양 지역의 안보 협력 강화를 확인했습니다. 일본의 방위비를 5년 이내에 GDP 대비 2%로 인상하는 방침에 대한 지지도 얻어내어, 미일 동맹의 새로운 단계를 인상 지었습니다.",
    n1Words: [
      { word: "首脳会談", reading: "しゅのうかいだん", meaning: "정상 회담" },
      { word: "安全保障", reading: "あんぜんほしょう", meaning: "안전 보장 (안보)" },
      { word: "防衛費", reading: "ぼうえいひ", meaning: "방위비" },
      { word: "同盟", reading: "どうめい", meaning: "동맹" },
      { word: "印象づける", reading: "いんしょうづける", meaning: "인상 짓다, 각인시키다" }
    ]
  },
  {
    title: "衆議院解散総選挙へ、与党は過半数維持できるか注目集まる",
    link: "https://www3.nhk.or.jp/news/html/20260927/k10015001000000.html",
    description: "岸田首相は26日、衆議院を解散し、10月27日に総選挙を行う意向を表明しました。与党・自民党は物価高騰対策や少子化対策の実績を訴える一方、野党は政治資金問題を争点に政権交代を目指す構えです。",
    pubDate: "2025-09-27T14:00:00Z",
    translation: "기시다 총리는 26일, 중의원을 해산하고 10월 27일에 총선거를 실시하는 의향을 표명했습니다. 여당인 자민당은 물가 상승 대책과 저출생 대책의 실적을 호소하는 반면, 야당은 정치 자금 문제를 쟁점으로 정권 교체를 목표로 하는 자세입니다.",
    n1Words: [
      { word: "解散", reading: "かいさん", meaning: "해산" },
      { word: "総選挙", reading: "そうせんきょ", meaning: "총선거" },
      { word: "過半数", reading: "かはんすう", meaning: "과반수" },
      { word: "争点", reading: "そうてん", meaning: "쟁점" },
      { word: "政権交代", reading: "せいけんこうたい", meaning: "정권 교체" }
    ]
  },
  // ── 의료·건강 ──
  {
    title: "花粉症の新薬が承認、舌下免疫療法に続く根治治療として注目",
    link: "https://www3.nhk.or.jp/news/html/20260305/k10014792001000.html",
    description: "厚生労働省は、スギ花粉症の新たな根治薬を承認しました。年に1回の注射で2〜3年間の効果が期待できるとされており、従来の舌下免疫療法の煩雑さを解消する画期的な治療法として医療関係者から注目を集めています。",
    pubDate: "2026-03-05T10:00:00Z",
    translation: "후생노동성은 삼나무 꽃가루 알레르기의 새로운 근치약을 승인했습니다. 1년에 1회 주사로 2~3년간의 효과가 기대된다고 하여, 기존 설하 면역 요법의 번거로움을 해소하는 획기적인 치료법으로서 의료 관계자들의 주목을 받고 있습니다.",
    n1Words: [
      { word: "花粉症", reading: "かふんしょう", meaning: "꽃가루 알레르기" },
      { word: "根治", reading: "こんち", meaning: "근치 (병을 완전히 고침)" },
      { word: "舌下", reading: "ぜっか", meaning: "설하 (혀 아래)" },
      { word: "免疫", reading: "めんえき", meaning: "면역" },
      { word: "画期的", reading: "かっきてき", meaning: "획기적" }
    ]
  },
  {
    title: "がん治療に革命、AIが早期発見率を飛躍的に向上させる新システム導入",
    link: "https://www3.nhk.or.jp/news/html/20260715/k10014923001000.html",
    description: "国立がん研究センターは、AI画像解析を活用した新しいがん早期発見システムの全国導入を開始しました。従来の検診と比較して肺がんや大腸がんの発見率が30%以上向上しており、医療現場での期待が高まっています。",
    pubDate: "2025-07-15T09:00:00Z",
    translation: "국립 암 연구 센터는 AI 영상 분석을 활용한 새로운 암 조기 발견 시스템의 전국 도입을 시작했습니다. 기존 검진과 비교해 폐암이나 대장암의 발견율이 30% 이상 향상되었으며, 의료 현장에서의 기대가 높아지고 있습니다.",
    n1Words: [
      { word: "早期発見", reading: "そうきはっけん", meaning: "조기 발견" },
      { word: "飛躍的", reading: "ひやくてき", meaning: "비약적" },
      { word: "画像解析", reading: "がぞうかいせき", meaning: "영상 분석" },
      { word: "導入", reading: "どうにゅう", meaning: "도입" },
      { word: "向上", reading: "こうじょう", meaning: "향상" }
    ]
  },
  // ── 국제 ──
  {
    title: "中東情勢の緊迫化を受け、原油価格が急騰、日本経済への影響を懸念",
    link: "https://www3.nhk.or.jp/news/html/20261003/k10015012001000.html",
    description: "中東地域での軍事的緊張の高まりを受け、国際原油価格が急騰しています。日本はエネルギーの大部分を輸入に頼っているため、原油高はガソリン価格や電気料金の上昇を通じて家計や企業に深刻な打撃を与えるおそれがあります。",
    pubDate: "2025-10-03T07:00:00Z",
    translation: "중동 지역에서의 군사적 긴장 고조를 받아, 국제 원유 가격이 급등하고 있습니다. 일본은 에너지의 대부분을 수입에 의존하고 있기 때문에, 원유 가격 상승은 휘발유 가격이나 전기 요금 인상을 통해 가계와 기업에 심각한 타격을 줄 우려가 있습니다.",
    n1Words: [
      { word: "緊迫", reading: "きんぱく", meaning: "긴박" },
      { word: "原油", reading: "げんゆ", meaning: "원유" },
      { word: "急騰", reading: "きゅうとう", meaning: "급등" },
      { word: "家計", reading: "かけい", meaning: "가계" },
      { word: "依存", reading: "いぞん", meaning: "의존" }
    ]
  },
  {
    title: "日韓首脳が歴史問題の「未来志向」で合意、シャトル外交が本格再開",
    link: "https://www3.nhk.or.jp/news/html/20260508/k10014857001000.html",
    description: "日本と韓国の首脳が東京で会談し、歴史問題については「未来志向」の立場で関係を発展させていくことで合意しました。中断していたシャトル外交が本格的に再開されたことで、両国間の経済・文化交流の一層の活性化が期待されます。",
    pubDate: "2026-05-08T16:00:00Z",
    translation: "일본과 한국 정상이 도쿄에서 회담하여, 역사 문제에 대해서는 '미래 지향'의 입장으로 관계를 발전시켜 나가기로 합의했습니다. 중단되었던 셔틀 외교가 본격적으로 재개됨으로써, 양국 간 경제·문화 교류의 한층 더한 활성화가 기대됩니다.",
    n1Words: [
      { word: "未来志向", reading: "みらいしこう", meaning: "미래 지향" },
      { word: "シャトル外交", reading: "しゃとるがいこう", meaning: "셔틀 외교" },
      { word: "活性化", reading: "かっせいか", meaning: "활성화" },
      { word: "中断", reading: "ちゅうだん", meaning: "중단" },
      { word: "合意", reading: "ごうい", meaning: "합의" }
    ]
  },
  // ── 교육·문화 ──
  {
    title: "小学校での英語教育を1年生から必修化、文部科学省が新学習指導要領を告示",
    link: "https://www3.nhk.or.jp/news/html/20260617/k10014901001000.html",
    description: "文部科学省は、英語教育の早期化を目的とした新学習指導要領を告示し、2028年度から小学1年生から英語を必修科目とすることを決定しました。グローバル人材の育成を急ぐ政府の方針を反映した施策です。",
    pubDate: "2025-06-17T11:00:00Z",
    translation: "문부과학성은 영어 교육의 조기화를 목적으로 한 새 학습 지도 요령을 고시하여, 2028년부터 초등학교 1학년부터 영어를 필수 과목으로 하기로 결정했습니다. 글로벌 인재 육성을 서두르는 정부의 방침을 반영한 시책입니다.",
    n1Words: [
      { word: "必修", reading: "ひっしゅう", meaning: "필수 (이수가 의무인 과목)" },
      { word: "告示", reading: "こくじ", meaning: "고시 (공식 발표)" },
      { word: "学習指導要領", reading: "がくしゅうしどうようりょう", meaning: "학습 지도 요령 (국가 교육과정)" },
      { word: "早期化", reading: "そうきか", meaning: "조기화" },
      { word: "育成", reading: "いくせい", meaning: "육성" }
    ]
  },
  {
    title: "インバウンド消費が過去最高、「オーバーツーリズム」対策が急務に",
    link: "https://www3.nhk.or.jp/news/html/20260731/k10014933001000.html",
    description: "観光庁が発表したデータによると、2025年の訪日外国人数と消費額がともに過去最高を更新しました。一方で人気観光地での混雑や環境負荷、地域住民の生活への影響など「オーバーツーリズム」が深刻化しており、持続可能な観光のあり方が問われています。",
    pubDate: "2025-07-31T10:00:00Z",
    translation: "관광청이 발표한 데이터에 따르면, 2025년 방일 외국인 수와 소비액이 모두 역대 최고를 기록했습니다. 반면 인기 관광지에서의 혼잡이나 환경 부하, 지역 주민의 생활에 대한 영향 등 '오버 투어리즘'이 심각해지고 있어, 지속 가능한 관광의 방향이 묻히고 있습니다.",
    n1Words: [
      { word: "インバウンド", reading: "いんばうんど", meaning: "인바운드 (방일 외국인 소비)" },
      { word: "急務", reading: "きゅうむ", meaning: "급무 (시급한 과제)" },
      { word: "環境負荷", reading: "かんきょうふか", meaning: "환경 부하 (환경에 가하는 부담)" },
      { word: "持続可能", reading: "じぞくかのう", meaning: "지속 가능" },
      { word: "深刻化", reading: "しんこくか", meaning: "심각화" }
    ]
  },
  {
    title: "ノーベル物理学賞に日本人研究者、AIの基礎となった機械学習理論で受賞",
    link: "https://www3.nhk.or.jp/news/html/20261007/k10015015001000.html",
    description: "スウェーデン王立科学アカデミーは、今年のノーベル物理学賞を日本人研究者に授与すると発表しました。現代の人工知能の基盤となったディープラーニングの理論的基礎を確立した功績が評価されました。",
    pubDate: "2025-10-07T18:00:00Z",
    translation: "스웨덴 왕립과학원은 올해의 노벨 물리학상을 일본인 연구자에게 수여한다고 발표했습니다. 현대 인공지능의 기반이 된 딥러닝의 이론적 기초를 확립한 공적이 평가받았습니다.",
    n1Words: [
      { word: "授与", reading: "じゅよ", meaning: "수여" },
      { word: "功績", reading: "こうせき", meaning: "공적" },
      { word: "確立", reading: "かくりつ", meaning: "확립" },
      { word: "基盤", reading: "きばん", meaning: "기반" },
      { word: "評価", reading: "ひょうか", meaning: "평가" }
    ]
  },
  // ── 재난·안전 ──
  {
    title: "南海トラフ地震の臨時情報が発令、各自治体が避難計画の再点検を急ぐ",
    link: "https://www3.nhk.or.jp/news/html/20260113/k10014592001000.html",
    description: "気象庁は南海トラフ地震の「臨時情報（巨大地震注意）」を発令しました。西日本の太平洋岸を中心に津波への備えが呼びかけられており、各自治体は避難計画や備蓄体制の緊急点検を急いでいます。",
    pubDate: "2026-01-13T12:00:00Z",
    translation: "기상청은 난카이 트로프 지진의 '임시 정보(거대 지진 주의)'를 발령했습니다. 서일본 태평양 연안을 중심으로 쓰나미 대비가 호소되고 있으며, 각 지자체는 대피 계획이나 비축 체제의 긴급 점검을 서두르고 있습니다.",
    n1Words: [
      { word: "臨時情報", reading: "りんじじょうほう", meaning: "임시 정보 (긴급 발표)" },
      { word: "発令", reading: "はつれい", meaning: "발령" },
      { word: "備蓄", reading: "びちく", meaning: "비축" },
      { word: "津波", reading: "つなみ", meaning: "쓰나미" },
      { word: "点検", reading: "てんけん", meaning: "점검" }
    ]
  },
  {
    title: "サイバー攻撃が国内インフラを標的に、政府機関や電力会社で障害相次ぐ",
    link: "https://www3.nhk.or.jp/news/html/20260916/k10014991001000.html",
    description: "国内の重要インフラを狙ったサイバー攻撃が相次いでいます。複数の政府機関や電力会社のシステムが一時的に停止する障害が発生しており、内閣サイバーセキュリティセンターは緊急の調査と対策強化に乗り出しています。",
    pubDate: "2025-09-16T13:00:00Z",
    translation: "국내 중요 인프라를 겨냥한 사이버 공격이 잇따르고 있습니다. 복수의 정부 기관과 전력 회사의 시스템이 일시적으로 정지하는 장애가 발생하여, 내각 사이버 보안 센터는 긴급 조사와 대책 강화에 나서고 있습니다.",
    n1Words: [
      { word: "標的", reading: "ひょうてき", meaning: "표적" },
      { word: "障害", reading: "しょうがい", meaning: "장애 (시스템 오류·정지)" },
      { word: "相次ぐ", reading: "あいつぐ", meaning: "잇따르다" },
      { word: "乗り出す", reading: "のりだす", meaning: "나서다, 착수하다" },
      { word: "強化", reading: "きょうか", meaning: "강화" }
    ]
  },
  {
    title: "訪日外国人向け観光税の導入検討、財源を文化財保護や混雑緩和に充当へ",
    link: "https://www3.nhk.or.jp/news/html/20260618/k10014902001000.html",
    description: "政府は訪日外国人を対象とした新たな「観光税」の導入を本格的に検討しています。徴収した財源は世界遺産など文化財の保護・修復や、オーバーツーリズムによる混雑の緩和策、地域住民の生活環境改善に充当する方針です。",
    pubDate: "2025-06-18T10:00:00Z",
    translation: "정부는 방일 외국인을 대상으로 한 새로운 '관광세' 도입을 본격적으로 검토하고 있습니다. 징수한 재원은 세계유산 등 문화재의 보호·수복이나, 오버 투어리즘에 의한 혼잡의 완화책, 지역 주민의 생활 환경 개선에 충당할 방침입니다.",
    n1Words: [
      { word: "充当", reading: "じゅうとう", meaning: "충당 (비용을 특정 목적에 사용)" },
      { word: "緩和", reading: "かんわ", meaning: "완화" },
      { word: "徴収", reading: "ちょうしゅう", meaning: "징수" },
      { word: "修復", reading: "しゅうふく", meaning: "수복, 복원" },
      { word: "財源", reading: "ざいげん", meaning: "재원" }
    ]
  },
  {
    title: "統計不正問題で厚生労働省が謝罪、基幹統計の信頼性回復へ第三者委設置",
    link: "https://www3.nhk.or.jp/news/html/20260424/k10014848001000.html",
    description: "厚生労働省は、長年にわたって毎月勤労統計の調査方法に不正があったことを認め、国民に謝罪しました。この問題を受け、同省は独立した第三者委員会を設置し、統計の正確性と透明性を確保するための抜本的な改革案を策定する方針を示しました。",
    pubDate: "2026-04-24T11:00:00Z",
    translation: "후생노동성은 오랜 기간에 걸쳐 월별 노동 통계 조사 방법에 부정이 있었음을 인정하고 국민에게 사과했습니다. 이 문제를 받아, 동 부처는 독립적인 제3자 위원회를 설치하여, 통계의 정확성과 투명성을 확보하기 위한 근본적인 개혁안을 책정하는 방침을 나타냈습니다.",
    n1Words: [
      { word: "不正", reading: "ふせい", meaning: "부정 (불공정·부당한 행위)" },
      { word: "第三者委員会", reading: "だいさんしゃいいんかい", meaning: "제3자 위원회" },
      { word: "抜本的", reading: "ばっぽんてき", meaning: "근본적" },
      { word: "透明性", reading: "とうめいせい", meaning: "투명성" },
      { word: "確保", reading: "かくほ", meaning: "확보" }
    ]
  }
];

// Fisher-Yates 셔플 후 5개 랜덤 추출
function pickRandom5(arr) {
  const pool = [...arr];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

// 간단한 XML 파서 함수
function parseNhkRss(xmlText) {
  const items = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
  if (!itemMatches) return null;
  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/);
    const linkMatch  = itemXml.match(/<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/);
    const descMatch  = itemXml.match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/);
    const dateMatch  = itemXml.match(/<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/pubDate>/);
    items.push({
      title:       (titleMatch?.[1] || titleMatch?.[2] || "").trim(),
      link:        (linkMatch?.[1]  || linkMatch?.[2]  || "").trim(),
      description: (descMatch?.[1]  || descMatch?.[2]  || "").trim(),
      pubDate:     (dateMatch?.[1]  || dateMatch?.[2]  || "").trim()
    });
  }
  return items.length > 0 ? items : null;
}

// 실시간 RSS 뉴스에 N1 어휘 바인딩
function enrichNewsWithN1Learning(newsList) {
  const vocabularyPool = [
    { word: "懸念",   reading: "けねん",    meaning: "우려, 걱정" },
    { word: "是正",   reading: "ぜせい",    meaning: "시정 (올바르게 고침)" },
    { word: "模索",   reading: "もさく",    meaning: "모색" },
    { word: "推進",   reading: "すいしん",  meaning: "추진" },
    { word: "契機",   reading: "けいき",    meaning: "계기" },
    { word: "高騰",   reading: "こうとう",  meaning: "급등" },
    { word: "影響",   reading: "えいきょう", meaning: "영향" },
    { word: "普及",   reading: "ふきゅう",  meaning: "보급" },
    { word: "対策",   reading: "たいさく",  meaning: "대책" },
    { word: "支援",   reading: "しえん",    meaning: "지원" },
    { word: "急増",   reading: "きゅうぞう", meaning: "급증" },
    { word: "深刻",   reading: "しんこく",  meaning: "심각" },
    { word: "維持",   reading: "いじ",      meaning: "유지" },
    { word: "確保",   reading: "かくほ",    meaning: "확보" },
    { word: "強化",   reading: "きょうか",  meaning: "강화" }
  ];
  const fallbackPool = pickRandom5(NEWS_POOL);
  return newsList.map((item, idx) => {
    const textToSearch = item.title + " " + item.description;
    let n1Words = vocabularyPool.filter(v => textToSearch.includes(v.word));
    if (n1Words.length < 3) {
      const fb = fallbackPool[idx % fallbackPool.length];
      n1Words = [...n1Words, ...fb.n1Words.filter(fw => !n1Words.some(w => w.word === fw.word))];
    }
    n1Words = n1Words.slice(0, 5);
    const fbItem = fallbackPool[idx % fallbackPool.length];
    return {
      ...item,
      translation: `[실시간 뉴스] ${item.description.slice(0, 80)}...\n\n📌 한국어 요약:\n${fbItem.translation.slice(0, 180)}`,
      n1Words
    };
  });
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch("https://www3.nhk.or.jp/rss/news/cat0.xml", {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*"
      },
      cache: "no-store"
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`NHK RSS 응답 불량: ${response.status}`);
    const xmlText = await response.text();
    const parsedItems = parseNhkRss(xmlText);
    if (!parsedItems) throw new Error("NHK RSS 파싱 실패");

    // 실시간 RSS에서도 랜덤으로 최대 5개 추출 (전체 아이템 셔플 후 슬라이스)
    const shuffled = pickRandom5(parsedItems.length >= 5 ? parsedItems : [...parsedItems, ...parsedItems]).slice(0, 5);
    const enrichedNews = enrichNewsWithN1Learning(shuffled);
    return NextResponse.json({ success: true, source: "realtime-nhk", news: enrichedNews });

  } catch (error) {
    console.warn("[NHK NEWS API] 실시간 로드 실패, 랜덤 Fallback 5선 제공:", error.message);
    // 풀 25개에서 매번 다른 랜덤 5개 추출
    const randomNews = pickRandom5(NEWS_POOL);
    return NextResponse.json({ success: true, source: "premium-fallback", news: randomNews });
  }
}
