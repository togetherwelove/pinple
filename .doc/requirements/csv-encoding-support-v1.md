# CSV 한글 인코딩 지원 결정 기록 V1

## 기준 문서

- `../인원 리스트 자동 그룹화 서비스 시스템 프롬프트 및 PRD V2.pdf`
- `implementation-decisions-v2.md`
- 2026-07-12 사용자 질의응답

## 확정된 정책

| 항목 | 결정 |
| --- | --- |
| 대상 파일 | `.csv` 파일 |
| 우선 인코딩 | UTF-8 |
| 대체 인코딩 | UTF-8 디코딩 실패 시 CP949(EUC-KR) |
| Excel 파일 | `.xls`, `.xlsx`의 기존 `xlsx` 파싱 흐름을 유지 |
| CSV 구조 | 기존과 동일하게 첫 번째 시트의 앞 세 열을 텍스트 입력란에 채운다. 헤더 처리 정책은 변경하지 않는다. |

## 검증 기준

1. UTF-8 CSV의 한글 이름이 보존된다.
2. Microsoft Excel에서 저장한 CP949 CSV의 한글 이름이 보존된다.
3. Excel 업로드 동작은 회귀하지 않는다.

## 검증 결과

- UTF-8 우선, CP949(EUC-KR) 대체 디코딩 경로를 구현했다.
- `.xls`, `.xlsx`는 기존 `xlsx` ArrayBuffer 파싱 경로를 유지한다.
- `tsc --noEmit` 통과
- `pnpm lint` 통과
- `pnpm build` 통과
- 실제 CP949 CSV 업로드 확인은 운영 배포 후 사용자 파일로 수행한다.
