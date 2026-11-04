# ORACULUM — 실행 및 개발 안내

전 세계 상징문화 플랫폼의 작동하는 1차 버전입니다. 아직 모든 50개 요구사항을 완성한 서비스는 아닙니다. 타로·사주·주역·천체 위치와 보호된 서버 기록을 먼저 구현했습니다.

## 실행

Node.js 22.13 이상, npm과 Git이 필요합니다. Windows PowerShell에서도 실행합니다.

```sh
npm ci
npm test
npm run typecheck
npm run db:generate
npm run build
```

최초 로컬 데이터베이스 준비 (생성된 마이그레이션마다 최초 한 번):

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_chief_susan_delgado.sql
npm run dev
```

서버가 출력하는 Local 주소를 엽니다. 로컬에서는 화면의 ChatGPT 로그인 버튼으로 개발용 계정에 로그인할 수 있습니다. 이 모의 로그인은 배포 빌드에 포함되지 않습니다. 호스팅된 사이트는 플랫폼의 ChatGPT 인증을 사용합니다. 직접 API를 노출하는 다른 호스팅으로 옮길 경우 인증 프록시가 서명/검증한 사용자 ID만 신뢰하도록 교체해야 합니다. 외부 요청자가 인증 헤더를 임의로 전달할 수 있는 구성으로 운영하지 마세요.

`npm start`는 빌드된 Worker를 로컬에서 실행합니다. 로컬 DB와 배포 DB는 별개입니다.

## 구현한 기능

- 78장 타로: 22 메이저 + 4수트 × 14장. RWS 번호 관례 (힘 VIII, 정의 XI). 자체 SVG 카드 아트, 정방향/역방향, 중복 없는 Web Crypto 추첨, 터치/클릭 선택, 3D 뒤집기.
- 원 카드, 쓰리 카드, 관계, 선택, 켈틱 크로스, 커스텀 1–10장 배열.
- 64괘의 문왕 순서·한자·한국어 이름·상하괘 구조. 세 동전법 또는 직접 입력. 아래부터 효 생성, 6·9 변효와 원괘·변괘 계산.
- 사주: lunar-javascript 1.7.7. 1962–2099년 양력·UTC+9 표준시 입력. 절기용 UTC+8 환산으로 연주·월주, 한국 표준시로 일주·시주. 자시 일주 경계 2규칙. 오행은 8자 단순 개수.
- Astronomy Engine 2.1.19: 태양·달·수성·금성·화성·목성·토성의 지구 중심 Tropical 황경, 원형 차트와 천체 선택.
- 4단계 규칙 기반 해설. API 연결 시 별도 AI 해설. 계산과 문장을 별도 관리.
- 로그인 사용자별 서버 저장·조회·삭제·전체 삭제·JSON 내보내기. 같은 결과를 다시 열어도 재추첨하지 않음. 기록 저장 시 서버가 카드 ID를 원본 데이터와 대조하고, 명식·괘·황경을 원입력에서 재계산해 정규화.
- 세계 문화 항목 5개, 타로 78장/주역 64괘 검색 사전, 출처 링크, 원어 명칭, 지원 범위 안내.
- 반응형 UI, 모바일 5탭, 화면 간 스크롤 복원, 움직임 줄이기, 설치용 웹 매니페스트, 인쇄 스타일.

## 계산과 문화적 한계

기본 해설은 ORACULUM의 현대적 편집이며 고전 원전 번역이나 과학적인 미래 예측이 아닙니다. 마이너 카드 설명은 수트와 수의 상징을 조합한 간략 해설입니다. 계통별 심층 해설은 아직 포함하지 않았습니다. UNESCO·박물관·엔진의 공개 자료를 참고하며 제휴를 주장하지 않습니다. 원전/현대 번역의 저작권이 다르므로 외부 번역을 복제하지 않았습니다.

사주는 한국 음력·윤달, 진태양시, 해외 출생, 1962년 이전 역사 시간대, 서머타임 자동 환산을 지원하지 않습니다. 서머타임으로 기록한 출생시간은 먼저 UTC+9 표준시로 바꿔 입력해야 합니다. lunar는 중국 역법 라이브러리이며 한국의 모든 만세력과 대조 검증된 엔진이라는 뜻은 아닙니다. 경계·학파 차이를 화면에 표시합니다. 지장간·십성·대운·용신·신살은 제공하지 않습니다.

주역의 괘사·효사 전체 원문/번역, 점성술 하우스·상승점·각도 분석·Sidereal/베다, 얼굴·손 사진 분석, 꿈 일기, 다국어 번역 UI, RAG/벡터검색, 관리자 콘텐츠 승인과 대규모 자료는 미구현입니다. 세계문화 사전은 5개 초기 항목이며 모든 나라의 자료를 조사 완료했다고 주장하지 않습니다. 오프라인·서비스 워커는 미구현입니다. PDF는 브라우저 인쇄/저장 스타일만 제공하며 서버 생성 PDF와 기기별 폰트 임베딩은 검증하지 않았습니다.

## AI 연결 (선택)

기본 기능은 API 키 없이 작동합니다. 현재 배포에는 API 키를 넣지 않았습니다. 사이트 런타임 비밀 환경변수 `OPENAI_API_KEY`와 선택적인 `AI_MODEL`을 설정하면 `/api/explain`이 서버에서만 호출합니다. 기본 모델 식별자는 `gpt-4.1-mini`입니다. 실제 모델의 계정 접근 가능 여부는 운영자가 확인해야 합니다. 키를 브라우저 코드나 Git에 넣지 마세요.

AI 입력은 정규화한 계산 스냅샷과 자체 규칙 해설입니다. 질문은 최대 500자, 요청 60KB 제한, 인증 사용자별 분당 8회 제한과 25초 타임아웃을 적용합니다. AI가 오류를 내거나 키가 없으면 규칙 해설을 명시적으로 반환합니다. AI가 항상 계산 수치를 정확히 인용한다는 보장은 없으므로 화면의 원 계산표와 비교해야 합니다. AI 추가 해설은 기본 기록의 해설을 자동으로 덮어쓰지 않습니다. 내보내기에는 현재 표시된 해설을 포함합니다.

## 데이터와 보안

현재 런타임은 Cloudflare D1 + Drizzle입니다. `db/postgres.sql`은 전환용 스키마이며 현재 런타임에 PostgreSQL 어댑터가 연결되어 있지는 않습니다. 배포 플랫폼이 D1 마이그레이션을 적용합니다. 일반 PostgreSQL로 옮길 때 DB 어댑터, rate-limit 원자 쿼리, 서버 인증을 함께 교체해야 합니다.

저장된 결과 스냅샷, 당시 기본 해설과 규칙 버전을 유지합니다. 저장 없이 사용한 출생 정보는 브라우저에만 머물지만, 해설 요청을 누르면 서버로 전달되며 AI가 연결되어 있으면 AI 제공자에게 전송됩니다. 서버 조회/수정은 인증된 사용자 ID로 제한합니다. Origin 검사, 제한된 입력 크기, prepared SQL, 사용자별 요청 제한, no-store 응답을 적용했습니다. DB 암호화는 플랫폼의 기본 보관 보호에 의존하며 앱 자체의 종단간 암호화는 아닙니다. 별도 비밀번호나 사진, 위치, 연락처를 저장하지 않습니다.

사용자 기록 1,000개 제한이 있습니다. 동시 저장 시 잠깐 1,000개를 초과할 수 있습니다. 실제 서비스의 법률 검토·침투 테스트·백업/복원 운영·모니터링은 별도의 배포 운영 작업입니다.

## 구조

- `components/Oraculum.tsx`: 화면/내비게이션/검색/기록/설정
- `components/ReadingPanels.tsx`: 체험·결과·해설·내보내기
- `components/Art.tsx`: 자체 SVG 카드·천체·괘 그림
- `lib/catalog.ts`: 78카드, 64괘, 문화 항목, 참고 자료
- `lib/engines.ts`: 추첨·사주·주역·황경·규칙 해설·정규화
- `app/api/readings`, `account`: 보호된 영구 기록 API
- `app/api/explain`: 선택적 서버 AI + 규칙 기반 폴백
- `db/schema.ts`, `drizzle/`: D1 스키마/마이그레이션
- `tests/`: 계산 경계와 입력/기록 검증
- `THIRD_PARTY_NOTICES.md`: 엔진과 아트 출처

## 검증

`npm test`는 덱 수·고유 ID·중복 추첨 방지·64개 고유 비트 패턴·변효·사주 기준값·입춘/자시 경계·잘못된 날짜·천체 기준값·레코드 검증을 검사합니다. TypeScript와 실제 배포용 빌드, 로컬 DB API 검증을 별도로 실시합니다. 이후 검증 결과는 `docs/verification-20261104.md`에 기록합니다.

## Delivery verification update

20 automated tests now pass, including route-level SQLite isolation and disk persistence checks. Hosted D1 and browser end-to-end checks remain unverified due environment restrictions. Native deployment was attempted but failed at source-host DNS resolution. There is no live URL for this delivery. See docs/verification-20261104.md for exact evidence and limitations.

Guest save attempts hold a validated snapshot in tab sessionStorage for up to 30 minutes across login; this is an explicitly disclosed temporary draft, not the permanent record store. Pending data is removed on successful save. Minimal per-user request-rate metadata is retained separately from reading deletion to prevent quota-reset abuse.

## Cloudflare 배포 (self-hosted)

라이브: https://oraculum.suupeopiwosu.workers.dev

```sh
D1_DATABASE_NAME=oraculum-db D1_DATABASE_ID=<d1-id> npm run build
npx wrangler d1 execute oraculum-db --remote --config dist/server/wrangler.json --file drizzle/0000_chief_susan_delgado.sql
npx wrangler deploy --config dist/server/wrangler.json
```

이 배포에는 ChatGPT 로그인 프록시가 없어서 Worker가 클라이언트가 보낸 `oai-authenticated-*` 헤더를 지웁니다. 그래서 로그인 없이 쓰는 기능만 작동하고, 기록 저장은 별도 인증을 붙여야 작동합니다.
