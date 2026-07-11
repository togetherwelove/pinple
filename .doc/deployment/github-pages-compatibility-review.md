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

## 배포 전 결정 필요 항목

1. Vercel에서 생성되는 운영 URL 또는 연결할 사용자 정의 도메인
2. Vercel 환경 변수 설정 담당자 및 방식
3. Supabase 및 Google OAuth 운영 Redirect URL
