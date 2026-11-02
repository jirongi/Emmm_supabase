# Domuksa_Supabase

Emmm 백엔드를 Spring(`Domuksa_Backend`)에서 Supabase로 옮기는 작업 폴더입니다.
Supabase 전환 작업에서 만드는 SQL, Edge Function, 문서는 모두 이 폴더에 둡니다.

- Supabase 프로젝트: `ktnsntefvnptssqbknlf` (https://ktnsntefvnptssqbknlf.supabase.co)
- 프론트 수정 가이드 · API 명세: https://claude.ai/artifact/Xod17TJrCc5GTkpvacMwVM

## 폴더 구조

```text
Domuksa_Supabase/
├─ supabase/
│  ├─ migrations/   DB 스키마·권한·함수 SQL (파일 이름 순서대로 실행)
│  └─ functions/    Edge Function (ai-summary)
├─ .env.example     프론트 환경변수 예시
└─ README.md
```

`supabase/` 아래 구조는 Supabase CLI 규칙을 따릅니다. 나중에 CLI를 설치하면
`npx supabase link --project-ref ktnsntefvnptssqbknlf` 후 `npx supabase db push`로 그대로 올릴 수 있습니다.

## SQL 적용 방법 (CLI 없이)

1. Supabase 대시보드 → SQL Editor → New query
2. `supabase/migrations/`의 파일을 **이름 순서대로** 하나씩 붙여 넣고 Run
3. 실행한 파일은 아래 진행 상황 표에 표시

이미 실행한 파일은 고치지 않습니다. 바꿀 내용이 생기면 새 마이그레이션 파일을 추가합니다.

## 진행 상황

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 0 | Supabase 프로젝트, Google 로그인, Redirect URL | 완료 |
| 1 | 작업 폴더 구성 | 완료 |
| 2 | DB 스키마 (`20261102000001_schema.sql`) | SQL 작성, 적용 대기 |
| 3 | 권한(RLS) | 대기 |
| 4 | RPC 함수 | 대기 |
| 5 | 실시간 · Storage | 대기 |
| 6 | 로그인 연결 확인 | 대기 |
| 7 | 프론트 교체 | 대기 |
| 8 | AI 요약 Edge Function | 대기 |
| 9 | 정리 | 대기 |

## 비밀 값 규칙

- service role key, DB 비밀번호, Google Client Secret, Gemini API 키는 **커밋하지 않습니다.**
- anon key만 프론트 `.env`에 넣습니다. 보안은 RLS가 담당합니다.
