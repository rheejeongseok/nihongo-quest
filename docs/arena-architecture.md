# 현재 아레나 구조

## DB가 출제 원본

N1·초보·모의고사 모두 Supabase PostgreSQL의 Quiz를 조회해 출제한다. 일반 아레나 입장과 모의고사 시작은 코드를 통해 문제를 생성하거나 DB에 덮어쓰지 않는다. 문항이 부족하면 오류를 반환하며 코드 자료로 대체하지 않는다.

- N1 일반: `n1Arena.mjs`에서 활성 문제를 유형별로 10개 추출한다. 제출 API가 DB 정답으로 채점한다.
- 초보: DB의 활성 초보 문제를 난이도 태그·Stage로 조회한다.
- 모의고사: `n1ExamRepository.mjs`에서 DB의 순서대로 20문항을 조회하고 DB 정답으로 채점한다. 종료 시 QuizAttempt를 저장한다.
- 현재 Quiz·Stage ID와 학습 기록은 유지한다. 구형 문제의 별도 정리 내역은 아래에 기록한다.

## Supabase Quiz 관리 필드

| 필드 | 용도 |
| --- | --- |
| jlptLevel | N1, BEGINNER. 구형 미분류는 LEGACY |
| arenaCategory | VOCAB, GRAMMAR, LISTENING, READING, WORDLE, MOCK_EXAM |
| status | ACTIVE만 출제. ARCHIVED는 기록 보관·출제 제외 |
| itemType | N1 어휘는 reading, context, paraphrase, usage |
| stimulusId | 같은 단어·지문·대화의 공통 키. 일반 아레나 한 회 소재 중복 방지 |
| examOrder | 모의고사에만 1~20의 중복 없는 순서 |
| examDomain | 모의고사 1~9 언어지식, 10~15 독해, 16~20 청해 |

새 문항은 기본 LEGACY·ARCHIVED다. 검수하고 트랙·카테고리·유형·상태를 지정해야 출제된다. 임의의 새 DB ID도 사용할 수 있다. N1 어휘 한 회 비율은 독음 3·문맥 3·바꿔 말하기 2·용법 2, 문법은 선택 6·조립 4다.

모의고사는 현재 20문항 한 회다. 활성 문항 수·순서·영역이 맞아야 시작하며 16~20번은 LISTENING이다. 진행 중 시험에 사용되는 문제·정답은 수정하지 않는 운영이 필요하다.

현재 N1 자료만 확인하는 SQL:

```sql
select * from "Quiz"
where "jlptLevel" = 'N1' and "status" = 'ACTIVE';
```

## 최초 가져오기·복구

`src/data/n1Quality*.mjs`, `n1Lexicon.mjs`, `beginnerQuizzes.mjs`, `n1Exam.mjs`는 초기 가져오기·복구 자료다. 런타임 출제는 이 파일의 문제를 읽지 않는다.

```sh
npm run db:push
npm run db:seed
```

현재 카탈로그는 N1 384 + 초보 278 + 모의고사 ID 20 = 682개다. 최초 가져오기는 안정적인 ID를 유지하고 메타데이터를 설정한다. 분류된 기존 문제의 DB 편집 내용과 활성 상태는 기본 동기화가 덮어쓰지 않는다. 개발 화면의 동기화 버튼도 같은 함수·정책을 사용하며 운영 API는 관리자 토큰이 필요하다.

코드 자료로 명시적으로 복원할 때만 `npm run db:seed -- --overwrite`를 사용한다. 이 옵션은 카탈로그 ID의 내용과 상태를 덮어쓴다. 초보만 가져올 때는 `npm run db:seed:beginner`를 사용한다. DB에 직접 추가한 별도 ID의 문제는 제거하지 않는다.

2026-10-16 연결된 Supabase에 필드·인덱스를 추가하고 현재 682개를 등록·활성화했다. 이후 사용자 요청에 따라 구형 N1 6,456개와 연결된 시도 5개·오답 5개를 백업 후 삭제했다. 현재 N1 404개(모의고사 포함)와 초보 278개는 모두 유지했다. 다른 DB에는 스키마 적용과 가져오기가 필요하며 운영 웹사이트의 코드는 별도 배포가 필요하다.

삭제는 `scripts/cleanup-legacy-n1.mjs`로 실행했다. 기본 실행은 계획만 출력하며 `--apply`에서만 백업·삭제한다. `.local-backups/`에 문제와 관련 기록을 JSON으로 저장하고 읽기·해시 검증 후 트랜잭션에서 삭제한다. 삭제 전후 남길 Quiz 전체 내용을 비교한다. 이 폴더는 Git에서 제외된다. 동일 스크립트 재실행은 대상이 없으면 삭제하지 않는다.

public 테이블 8개(User, Stage, Quiz, Bookmark, WrongAnswer, QuizAttempt, JapaneseNews, NewsRefreshState)는 모두 현재 코드에서 사용하므로 테이블 삭제는 하지 않았다. Supabase 관리 스키마는 변경하지 않았다.

## 주소 호환

N1 문자·어휘는 1, 문법은 3, 청해는 4, 독해는 7, 워들은 5, 모의고사는 `/mock-exam`이다. 이전 N1 주소 2와 5의 ASSEMBLY는 통합 코스로, 6은 새 모의고사로 연결한다. 초보 난이도별 코스·10분 진단은 유지한다. 논리 번호 7 독해는 DB Stage 3에 연결해 기존 외래키를 보존한다.

