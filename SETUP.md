# 🛠️ NihongoQuest — 로컬 개발 환경 세팅 가이드

> ⚠️ 이 파일은 git에 커밋됩니다.  
> ⚠️ `.env` 파일은 git에서 제외(`gitignore`)되므로, 새 PC/환경에서는 아래를 참고해 직접 생성해야 합니다.

---

## 📁 git에 포함되지 않는 파일 목록

| 파일 | 이유 |
|------|------|
| `.env` | API 키, DB 비밀번호 등 민감 정보 포함 |
| `node_modules/` | `npm install`로 재생성 |
| `.next/` | `npm run build`로 재생성 |
| `prisma/dev.db` | 로컬 SQLite DB (개발용) |

---

## 🔑 .env 파일 전체 구성

프로젝트 루트(`d:\BuyRawFish\nihongo-quest\`)에 `.env` 파일을 생성하고 아래 내용을 채워넣으세요.

```env
# ──────────────────────────────────────────────────
# 1. Supabase PostgreSQL — 트랜잭션 풀러 (일반 쿼리용)
# ──────────────────────────────────────────────────
DATABASE_URL="postgresql://<user>:<password>@<host>:6543/<db>?pgbouncer=true"

# ──────────────────────────────────────────────────
# 2. Supabase PostgreSQL — 세션 풀러 (마이그레이션용)
# ──────────────────────────────────────────────────
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/<db>"

# ──────────────────────────────────────────────────
# 3. DeepL API — NHK 실시간 뉴스 한국어 번역
# ──────────────────────────────────────────────────
DEEPL_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
```

---

## 🔍 환경변수 상세 설명

### `DATABASE_URL` / `DIRECT_URL`
- **용도:** Supabase(PostgreSQL) DB 연결
- **어디서 발급:** [https://supabase.com](https://supabase.com) → 프로젝트 선택 → `Settings` → `Database` → `Connection string`
- **두 가지 URL의 차이:**
  - `DATABASE_URL` (포트 6543): pgBouncer 트랜잭션 풀러 → 실제 앱 쿼리에 사용
  - `DIRECT_URL` (포트 5432): 직접 연결 → `prisma migrate`, `prisma db push` 등 마이그레이션 전용

> 💡 실제 값은 회사 PC의 `.env` 파일을 열어 복사하거나, Supabase 대시보드에서 재확인 가능

---

### `DEEPL_API_KEY`
- **용도:** NHK RSS 실시간 뉴스를 한국어로 자동 번역
- **어디서 발급:** [https://www.deepl.com/ko/account/summary](https://www.deepl.com/ko/account/summary) → `Authentication Key for DeepL API`
- **플랜 구분:**
  - Free 플랜: 키가 `:fx`로 끝남 → `api-free.deepl.com` 자동 사용
  - Pro 플랜: `:fx` 없음 → `api.deepl.com` 자동 사용
- **무료 한도:** 월 500,000자 (뉴스 5개 × 수백 요청도 충분)

---

## 🚀 새 환경에서 시작하는 순서

```bash
# 1. 의존성 설치
npm install

# 2. .env 파일 생성 (위 내용 참고해서 직접 작성)

# 3. Prisma 클라이언트 생성
npx prisma generate

# 4. DB 스키마 동기화 (Supabase에 테이블 없을 때)
npx prisma db push

# 5. 개발 서버 시작
npm run dev
```

---

## 🗄️ DB 스키마 요약 (prisma/schema.prisma)

| 모델 | 설명 |
|------|------|
| `User` | 닉네임, 포인트, 스트릭, 뱃지 |
| `Stage` | 아레나 스테이지 (번호, 카테고리, 난이도) |
| `Quiz` | 퀴즈 문항 (문제, 정답, 오답, 힌트) |
| `Bookmark` | 사용자 단어장 |
| `WrongAnswer` | 오답노트 |
| `QuizAttempt` | 퀴즈 시도 기록 |

---

## 📡 외부 서비스 연결 목록

| 서비스 | 용도 | 대시보드 |
|--------|------|---------|
| Supabase | PostgreSQL DB 호스팅 | [supabase.com](https://supabase.com) |
| DeepL API | 실시간 뉴스 한국어 번역 | [deepl.com/account](https://www.deepl.com/ko/account/summary) |
| NHK RSS | 실시간 시사 뉴스 원문 | `https://www3.nhk.or.jp/rss/news/cat0.xml` (무료, 키 불필요) |

---

## ⚙️ 자주 쓰는 개발 명령어

```bash
npm run dev          # 개발 서버 시작 (localhost:3000)
npx prisma studio    # DB 시각화 브라우저 GUI
npx prisma db push   # 스키마 변경사항 DB 반영
npx prisma generate  # Prisma 클라이언트 재생성
npm run build        # 프로덕션 빌드
```
