# 인원 리스트 자동 그룹화 서비스 구현 결정 기록 V2

## 기준 문서

- 원본 PRD: `../인원 리스트 자동 그룹화 서비스 시스템 프롬프트 및 PRD V2.pdf`
- 본 문서는 2026-07-10 사용자 질의응답으로 확정된 구현 결정을 기록한다.

## 확정된 결정

| 항목 | 결정 |
| --- | --- |
| 프로젝트 위치 | 원본 PRD의 선택지 B를 적용한다. `app` 하위 폴더에 Next.js 프로젝트를 생성한다. |
| 패키지 관리자 | 원본 PRD의 선택지 A를 적용한다. pnpm을 사용한다. |
| Supabase 및 데이터베이스 | Supabase 프로젝트 ID는 `sljhtgojmjdbwrwfjfto`를 사용한다. 제공된 anon key와 데이터베이스 비밀번호는 `.env.local`에만 저장하며 문서와 저장소에는 기록하지 않는다. 런타임은 transaction-mode pooler의 `DATABASE_URL`(포트 6543, `pgbouncer=true`)을, Prisma 마이그레이션은 session-mode pooler의 `DIRECT_URL`(포트 5432)을 사용한다. |
| Supabase 사용자 동기화 | 보호된 대시보드 최초 진입 시 Supabase 사용자 정보를 Prisma `User`에 upsert한다. |
| 텍스트 입력 오류 | 한 줄이라도 형식 오류가 있으면 전체 저장을 막고 오류 목록을 표시한다. |
| 성별 입력값 | 입력은 `남`, `여`, `남자`, `여자`를 허용하고, 각각 Prisma 저장값 `M`, `F`로 변환한다. 누락값 또는 다른 값은 입력 오류로 처리하여 전체 저장을 막는다. |
| 자동 그룹화 결과 | 같은 프로젝트에서 재그룹화하면 기존 결과를 덮어쓰지 않고 새 `GroupResult`를 추가한다. |
| 명단 재업로드 및 편집 | 입력 폼의 전체 유효 명단으로 Person 목록을 원자적으로 덮어쓴다. 동일한 `이름 + 성별 + 나이` 행은 한 건으로 저장한다. 기존 GroupResult JSON 스냅샷은 명단 교체와 독립적으로 보존한다. |
| 목표 그룹 수 | 사용자가 자동 그룹화 전에 목표 그룹 수를 입력한다. 저장된 명단 인원 수 또는 목표 그룹 수가 바뀌면 시스템은 총 인원을 균등 분배하고, 나머지 인원을 앞 그룹부터 하나씩 배정한 정원을 자동 계산한다. 예: 5명, 3그룹은 `2, 2, 1`이다. 생성된 각 그룹의 목표 인원 수는 사용자가 개별적으로 조정할 수 있으며, 합계는 실제 인원 수와 같아야 한다. |
| 그룹 결과 이름 | 시스템이 `자동 그룹화_YYYY-MM-DD_HH-mm` 형식으로 자동 생성한다. |
| 드래그 앤 드롭 저장 | 멤버 이동 시 결과 JSON을 즉시 저장한다. |
| 엑셀 내보내기 | `그룹명`, `이름`, `성별`, `나이` 열을 포함한 단일 시트 Excel 파일로 내보낸다. 파일명은 `프로젝트명_그룹결과.xlsx` 형식이다. |
| UI/UX 범위 | 기능 중심의 기본 대시보드 UI를 구현한다. 별도 화면 설계서 작성은 요구하지 않는다. |

## 구현 전 차단 항목

다음 동작은 원본 PRD와 현재 질의응답에서 결정되지 않아, 관련 기능 구현 전에 확정해야 한다.

없음.

## 제공된 인증 구성

- Supabase URL은 프로젝트 ID를 기반으로 `https://sljhtgojmjdbwrwfjfto.supabase.co`를 사용한다.
- Google OAuth 콜백 URL은 `https://sljhtgojmjdbwrwfjfto.supabase.co/auth/v1/callback`로 확정한다.
- anon key는 사용자로부터 제공받았으나 보안상 이 문서에 기록하지 않는다.
- Google OAuth 클라이언트 설정은 Supabase Auth에 등록 완료되었다.
- 개발용 Site URL 및 Supabase Redirect URL은 `http://localhost:3000`으로 확정한다.
- 데이터베이스 비밀번호는 로컬 `.secret` 디렉터리에서만 읽고, `app/.env.local`에만 주입한다. `.secret/`과 `.env.local`은 Git 추적에서 제외한다.

## 구현 제약

- Next.js App Router와 React Server Components를 기본으로 사용한다.
- 클라이언트 상태가 필요한 컴포넌트에만 `use client`를 선언한다.
- Supabase는 `@supabase/ssr`, 데이터베이스 접근은 Prisma와 PostgreSQL을 사용한다.
- 스타일은 Tailwind CSS 유틸리티로 작성하며 인라인 스타일을 사용하지 않는다.
- 인원 데이터 대량 저장은 Prisma `createMany`를 사용한다.
- 자동 그룹화는 성별과 연령을 기준으로 분류한 뒤 snake-direction bucket 분배를 사용한다.
- 결과 편집은 `@dnd-kit/core`와 `@dnd-kit/sortable`을 사용한다.
- 명단 파일은 브라우저에서 `xlsx`로 파싱하고 Person API에 일괄 전송한다.
- 드래그 앤 드롭은 로컬 상태를 먼저 갱신한 뒤 Group Result API로 즉시 동기화한다. 동기화 실패 시 오류 알림을 표시하고 이전 상태로 되돌린다.
- Excel 내보내기는 브라우저에서 단일 시트로 생성한다.
- 대시보드는 데스크톱과 모바일에서 모두 사용할 수 있도록 반응형 레이아웃을 적용한다.
- 프로젝트가 없을 때는 새 대화를 시작하는 화면처럼 빈 상태를 보여준다. 프로젝트는 좌측 목록에 시간순으로 쌓이며 URL 쿼리로 선택 상태를 유지한다.

## 완료된 환경 설정

- `app/.env.local`에 Supabase URL, publishable key, `DATABASE_URL`, `DIRECT_URL`을 로컬로만 구성했다.
- Prisma 초기 마이그레이션 `20260710145843_initial_schema`을 Supabase PostgreSQL에 적용했다.
- 로컬 비밀 파일과 환경 파일은 `.gitignore`로 제외한다.

## 검증 완료

- TypeScript 검사 `tsc --noEmit` 통과
- ESLint 검사 통과
- Next.js 프로덕션 빌드 통과
- 사용자 실행 테스트에서 기본 기능 정상 동작 확인
