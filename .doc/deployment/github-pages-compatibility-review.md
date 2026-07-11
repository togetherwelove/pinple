# GitHub Pages 호환성 검토

## 검토 기준

- `../git_and_github_pages_deployment_guide.pdf`
- `../requirements/implementation-decisions-v2.md`

## 결론

현재 서비스는 GitHub Pages에 배포할 수 없다.

GitHub Pages는 정적 파일만 호스팅하지만, 이 프로젝트에는 다음 서버 실행 요소가 포함된다.

- Next.js App Router Route Handler API
- `@supabase/ssr` 기반 서버 측 세션 처리
- Prisma와 PostgreSQL 데이터 접근

정적 내보내기로 전환하면 인증 콜백, 인원 등록 API, 그룹 결과 저장 API가 동작하지 않는다.

## 운영 배포 방식

Vercel을 운영 호스팅 플랫폼으로 사용한다. Vercel은 Next.js 서버 실행, Route Handler, SSR을 지원한다.

## GitHub 사용 범위

GitHub 저장소는 소스 코드 버전 관리와 CI/CD 연결 용도로 사용한다. GitHub Pages 배포는 사용하지 않는다.

- 원격 저장소: `https://github.com/togetherwelove/pinple.git`
- 기본 브랜치: `main`

## 구성된 운영 값과 검증 상태

| 항목 | 확정값 |
| --- | --- |
| Vercel 운영 URL 구성값 | `https://pinple-five.vercel.app` (운영 검증 완료) |
| Vercel Root Directory | `app` |
| Supabase Auth Site URL 구성값 | `https://pinple-five.vercel.app` |
| Supabase Auth Redirect URL 구성값 | `https://pinple-five.vercel.app/auth/callback` |
| Google OAuth 승인 리디렉션 URI | `https://sljhtgojmjdbwrwfjfto.supabase.co/auth/v1/callback` |

Vercel 환경 변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `DIRECT_URL`은 Production과 Preview 환경에 설정 완료되었다. Google OAuth의 승인 리디렉션 URI는 애플리케이션 도메인이 아니라 Supabase Auth 콜백을 유지한다.

## 운영 URL 검증

- 2026-07-11 `https://pinple-five.vercel.app/`에 접속을 확인했다.
- 결과: Vercel `404: NOT_FOUND` (`icn1::dbvcl-1783767530769-293b58e6b46f`).
- 배포 화면 확인: `FF3nebWEkNhgCi2UUMku76HUHatE`는 `Production / Current / Ready Latest`이며, `pinple-five.vercel.app`는 Valid Configuration으로 연결되어 있다.
- Build Logs 확인: Vercel은 `/vercel/path0/app`을 빌드했고, `/`, `/dashboard`, `/login`, `/auth/callback`, API Route 및 Proxy를 모두 생성해 `/vercel/output`에 배포했다.
- 원인 확인: 현재 Production 배포에는 `Framework: Other` Production Override가 적용되어 있고, 프로젝트 설정의 Framework Preset은 `Next.js`다. 현재 배포가 프로젝트 설정과 다른 프레임워크 구성으로 생성되어 Vercel이 Next.js 산출물을 정상적으로 라우팅하지 못한다.
- 조치: 프로젝트 설정의 `Next.js` preset을 유지하고, 현재 Production Override를 제거한 뒤 새 Production 배포를 생성한다. OAuth 설정 검증은 새 배포가 정상 응답을 반환한 뒤에 진행한다.
- 결과: Build Cache를 사용하지 않고 Production 배포를 다시 생성한 뒤 `https://pinple-five.vercel.app`의 정상 동작을 사용자 확인으로 완료했다.
- 독립 확인: 비로그인 상태에서 운영 루트 URL은 `https://pinple-five.vercel.app/login`으로 리디렉션되며 `Google로 로그인` 화면을 반환한다.
- 2026-07-11 배포 후보 URL `https://pinple-rhaevhf0v-kangchanwook.vercel.app/`에 접속을 확인했다.
- 결과: Vercel 로그인 화면으로 리디렉션되었다. 이 배포본에는 Vercel Deployment Protection이 적용되어 있다.
- 판단: 후보 URL은 배포본을 가리키지만, 공개 운영 URL로 확정할 수 없다. 보호 정책을 유지할지 해제할지 결정한 뒤, 일반 브라우저에서 서비스가 열리는 URL을 Supabase Auth Site/Redirect URL에 설정한다.
