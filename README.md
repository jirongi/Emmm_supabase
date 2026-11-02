# Domuksa_Supabase

Emmm(이음) 회의 서비스를 Spring 백엔드(`Domuksa_Backend`) 없이 Supabase로 돌리는 버전입니다.
Supabase 전환 작업에서 만든 SQL, Edge Function, 프론트, 문서는 모두 이 폴더에 있습니다.

- Supabase 프로젝트: `ktnsntefvnptssqbknlf` (https://ktnsntefvnptssqbknlf.supabase.co)
- 프론트 수정 가이드 · API 명세: https://claude.ai/artifact/Xod17TJrCc5GTkpvacMwVM

## 폴더 구조

```text
Domuksa_Supabase/
├─ supabase/
│  ├─ migrations/   DB 스키마·권한·함수 SQL (파일 이름 순서대로 실행)
│  ├─ functions/    Edge Function (ai-summary)
│  └─ tests/        권한 테스트 SQL (마이그레이션 아님, SQL Editor에서 필요할 때 실행)
├─ frontend/        React 앱 (Domuksa_Front 복사본을 Supabase로 교체)
└─ README.md
```

## 구조

```text
React (frontend/)
  └─ supabase-js ──┬─ Auth        Google 로그인
                   ├─ Postgres    테이블 13개 + RLS 권한 + RPC 6개
                   ├─ Realtime    테이블 변경 이벤트 + 접속자 Presence
                   ├─ Storage     agenda-files (비공개, 1시간 signed URL)
                   └─ Edge Function ai-summary ── Gemini
```

## 프론트 실행

```bash
cd frontend
cp .env.example .env   # REACT_APP_SUPABASE_ANON_KEY 채우기
npm install
npm start              # http://localhost:3000
```

- 백엔드 호출은 전부 `frontend/src/api/`에 있고, 화면 컴포넌트는 이 함수만 부릅니다.
- 실시간은 `frontend/src/hooks/useRealtime.js` (방·안건·투표 채널 + 접속자 Presence).
- 로그인 상태는 `frontend/src/auth/AuthProvider.js`.
- localhost에서 열면 오른쪽 아래에 **개발용 로그인**(이메일·비밀번호)이 보입니다. 배포 주소에서는 보이지 않습니다.
  Supabase Authentication → Users에서 만든 테스트 계정으로 host·member 흐름을 확인할 때 씁니다.

## 배포 (Vercel)

1. Vercel에서 이 저장소로 새 프로젝트를 만들고 **Root Directory를 `frontend`** 로 지정 (Framework: Create React App)
2. Environment Variables에 `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` 추가
3. 배포 주소를 Supabase Authentication → URL Configuration → Redirect URLs에 `https://<주소>/**` 형태로 추가
4. `/meet/123` 같은 주소로 새로고침해도 열리도록 `frontend/vercel.json`이 모든 경로를 `index.html`로 보냅니다

## SQL 적용 방법 (CLI 없이)

1. Supabase 대시보드 → SQL Editor → New query
2. `supabase/migrations/`의 파일을 **이름 순서대로** 하나씩 붙여 넣고 Run

이미 실행한 파일은 고치지 않습니다. 바꿀 내용이 생기면 새 마이그레이션 파일을 추가합니다.
`supabase/` 아래 구조는 Supabase CLI 규칙을 따르므로, CLI가 있으면
`npx supabase link --project-ref ktnsntefvnptssqbknlf` 후 `npx supabase db push`로도 올릴 수 있습니다.

## Edge Function 배포 (CLI 없이)

1. 대시보드 → Edge Functions → Secrets 에 `GEMINI_API_KEY` 추가 (선택: `GEMINI_MODEL`, 기본 `gemini-3.5-flash-lite`)
2. Edge Functions → Deploy a new function → Via Editor
3. 이름 `ai-summary`, `supabase/functions/ai-summary/index.ts` 내용 전체를 붙여 넣고 Deploy
4. 함수 설정에서 "Verify JWT"가 켜져 있는지 확인 (로그인한 사용자만 호출)

`gemini-2.5-flash`는 새 API 키에서 404, `gemini-3.8-flash`는 응답이 60초를 넘겨 쓰지 않습니다.

## 진행 상황

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 0 | Supabase 프로젝트, Google 로그인, Redirect URL | 완료 |
| 1 | 작업 폴더 구성 | 완료 |
| 2 | DB 스키마 (`20261102000001_schema.sql`) | 완료 (적용됨) |
| 3 | 권한(RLS) (`20261102000002_rls.sql`) | 완료 (적용됨) |
| 4 | RPC 함수 (`20261102000003_rpc.sql`) + 테스트 (`tests/rls_smoke_test.sql`) | 완료 (적용됨, 테스트 35/35 통과) |
| 5 | 실시간 · Storage (`20261102000004_realtime_storage.sql`) | 완료 (적용됨) |
| 6 | 로그인 연결 확인 | 테스트 계정 로그인 확인, **Google 로그인은 직접 확인 필요** |
| 7 | 프론트 교체 + 타이머 보조 SQL (`20261102000005_timer_started_at.sql`) | 완료 (두 계정 브라우저 시험 18단계 통과) |
| 8 | AI 요약 Edge Function (`supabase/functions/ai-summary`) | 완료 (투표·코멘트·PDF 요약 확인, member 호출 403) |
| 9 | 정리 | 완료 (남은 수동 작업은 아래) |

## 남은 수동 작업

- [ ] 실제 Google 계정으로 로그인 → 방 만들기 한 번 확인
- [ ] `ai-summary` 함수를 최신 `index.ts`로 다시 배포 (Gemini 대기 시간 120초 반영)
- [ ] Vercel 새 프로젝트 배포 (위 "배포" 참고)
- [ ] Storage `agenda-files`에 남은 시험용 폴더 삭제 (대시보드 → Storage)
- [ ] 테스트 계정(`test-a`, `test-b`)은 계속 쓸 거면 비밀번호를 더 길게, 안 쓸 거면 삭제

## 비밀 값 규칙

- service role key, DB 비밀번호, Google Client Secret, Gemini API 키는 **커밋하지 않습니다.**
- anon key만 프론트 `.env`에 넣습니다. 보안은 RLS가 담당합니다.
- `frontend/.env`는 git에 올라가지 않습니다 (`frontend/.gitignore`).
