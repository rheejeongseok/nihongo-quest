# 소스 구조와 관리 기준

2026-10-20 코드 대조 기준. [문서 목차](./README.md)에서 현재 안내와 보관 기록을 구분한다.
닉네임으로 지인과 학습하는 사용 방식을 유지한다.
인증 전환, DB 마이그레이션·데이터 변경, 점수·복습 정책 변경은 이 작업에 포함하지 않았다.

## 화면과 기능

- `src/app/Header.js`: 공통 헤더 상태와 이동. 계정·아레나 팝업과 모바일 메뉴는 `components/`로 분리.
- `src/app/ClientDashboard.js`: 트랙·뉴스 학습 상태와 동작. 소개/D-Day, 아레나 목록, 손글씨 연습은 별도 컴포넌트.
- `src/app/components/`: `AccountModal`, `ArenaEntryModal`, `MobileDrawer`, `DashboardOverview`,
  `ArenaCourseGrid`, `CalligraphyPractice`, `WordDetailModal`, `LearningBackupPanel`,
  `QuestionOptions`, `SentenceAssembly`.
- `src/data/uiCatalog.mjs`: 테마·컨셉·공통 링크·아레나 메뉴 메타데이터.
- `src/data/kanaPractice.mjs`: 퀴즈의 `KANA_CHART`에서 파생한 손글씨 문자표. 독음 자료를 중복 관리하지 않는다.
- `src/data/beginnerConversations.mjs`: 초보 회화 100개의 공통 형식과 중복 없는 5개 무작위 추첨.
- `src/data/beginnerConversationExamples.mjs`: 추가 회화 75개의 지문·번역·단어 원본.

일상회화는 Quiz DB와 별개인 소스 콘텐츠다. 초보 메인에서 자료를 로드할 때 5개를 추첨하고,
회화 카드의 ↻ 버튼으로 다시 뽑는다. 다음 추첨이나 다음 방문에서 이전 회화가 다시 나올 수 있다.

풀이 세션·채점 요청은 기존 페이지에 유지하고, 문제 유형별 렌더링부터 분리했다.
점수 정책과 서버 판정 흐름의 재설계는 별도 작업이다.

## 닉네임과 백업

- `src/lib/clientProfile.mjs`: 기존 로컬스토리지 닉네임·트랙을 요청 헤더로 변환.
  초보 트랙의 사용자 구분은 기존 서버 로직을 그대로 사용한다. 모의고사는 N1 헤더를 명시한다.
- `src/lib/learningBackup.mjs`: 기존 `/api/sync`의 코드·JSON 내보내기/가져오기 통신과 다운로드 도우미.
- `src/hooks/useLearningBackup.js`: 두 복습 화면이 공유하는 백업 상태와 이벤트 처리.
- `LearningBackupPanel`: 같은 컨트롤을 재사용. 백업 코드·입력·접힘 상태는 각 페이지가 보존한다.

JSON 키, API URL, 닉네임 헤더, 파일 이름 규칙, 가져오기 후 새로고침은 유지한다.

## 뉴스

- `src/app/api/nhk-news/route.js`: 요청 옵션과 HTTP 응답·캐시 헤더만 처리.
- `src/lib/newsService.js`: 기존 뉴스 수집·DB 풀·번역·메모리 캐시·동시 요청 처리를 유지.
- `src/data/newsFallback.mjs`: 기존 대체 학습 기사 데이터.

구조 정리의 브라우저 검증은 API를 모형으로 대체한다. 실제 뉴스 수집이나 DB 가져오기를 실행하지 않는다.

## 스타일

`globals.css`는 `styles/`의 공통·반응형·뉴스·복습·컨셉·플래시카드·손글씨 스타일을 순서대로 가져온다.
기존 선언의 순서를 보존해 분리했다. 삭제된 동기화 패널·메인 복습 버튼·정보 카드·오로라 배경의
미사용 규칙/선택자 54개는 제거했다.

루트의 적용 순서는 `globals.css → dashboard.css → header.css → simple-ui.css`다.
새 UI는 마지막 세 파일에서 관리하고, 공통 카드·버튼 규격은 `simple-ui.css`에 둔다.
색상 팔레트와 학습 상태 색은 유지하며, 기능성 플래시카드 회전·팝업 이동을 장식 효과와 구분한다.

## 데이터 작업과 검사

- 현재 문항 가져오기: `npm run db:seed` (분류된 기존 문제의 DB 편집을 보존하고, 없는 문항 생성·카탈로그에 해당하는 미분류 LEGACY 문항 갱신).
- 이미 완료한 초보 교체·문자 추가 작업: `scripts/archive/`. 현재 운영 명령으로 사용하지 않는다.
- `npm run lint`: 미정의 변수 검사 포함.
- `npm test`: 출제·채점·백업 데이터 계약·문자표·회화 100개와 무작위 5개 추첨 검사. 최신 검사 개수는 실행 결과를 따른다.
- `scripts/check-arena-ui.mjs`: PC/모바일 메뉴·팝업·아레나·손글씨·모의고사·복습·백업 코드 복사·회화 다시 뽑기 확인.

실행 중인 로컬 서버를 대상으로 브라우저 검사를 실행한다. API는 모형 응답으로 대체하며 학습 기록을 저장하지 않는다.

```powershell
$env:ARENA_CHECK_URL='http://localhost:3001'
node scripts/check-arena-ui.mjs
```

사용되지 않는 테마 선택기, 읽히지 않는 상태·획수 계산, 숨겨진 꽃가루 캔버스 처리는 제거했다.
일본어 음성 훅은 음성 목록 이벤트를 구독·해제하여 여러 화면에서 서로 덮어쓰지 않게 했다.
