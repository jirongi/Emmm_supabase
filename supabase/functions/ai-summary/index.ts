// AI 요약 Edge Function
// 기존 Spring AiService·AiPromptBuilder·GeminiLlmClient를 옮긴 것.
// 호출: supabase.functions.invoke("ai-summary", { body: { agendaId } })  — host만 가능
// 필요한 시크릿: GEMINI_API_KEY (선택: GEMINI_MODEL, 기본 gemini-3.8-flash)
// (gemini-2.5-flash는 새 API 키에서 404가 나서 기본값을 바꿈)
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY는 Supabase가 자동으로 넣어 준다.

import { createClient } from "npm:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@1.8.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_COMMENTS = 30;
const MAX_COMMENT_CHARS = 400;
const MAX_FILES = 20;
const MAX_PDF_CHARS = 12000;
const GEMINI_TIMEOUT_MS = 60_000;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const limitChars = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max) + "...");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const { agendaId } = await req.json();
    if (!Number.isInteger(agendaId)) return json(400, { error: "invalid_agenda" });

    const url = Deno.env.get("SUPABASE_URL")!;
    // 호출한 사용자 권한(RLS)으로 읽고, 저장만 service role로 한다
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1) 안건 확인 (멤버가 아니면 RLS 때문에 안 보인다)
    const { data: agenda } = await userClient
      .from("agendas")
      .select("id, room_id, name, sequence")
      .eq("id", agendaId)
      .maybeSingle();
    if (!agenda) return json(404, { error: "agenda_not_found" });

    // 2) host만 허용
    const { data: isHost } = await userClient.rpc("is_host", { rid: agenda.room_id });
    if (!isHost) return json(403, { error: "not_host" });

    // 3) 재료 수집 → 4) 프롬프트 → 5) Gemini → 6) 저장
    const materials = await buildMaterials(userClient, agenda);
    const raw = await callGemini(buildSummaryPrompt(materials));
    const parsed = parseAiResponse(raw);

    const title = sanitizeTitle(parsed.title);
    const summaryText = parsed.summaryText.trim();
    if (!title || !summaryText) throw new Error("LLM 응답이 비었습니다.");

    const { error: saveError } = await admin.from("ai_summaries").upsert({
      agenda_id: agenda.id,
      title,
      summary_text: summaryText,
      updated_at: new Date().toISOString(),
    });
    if (saveError) throw saveError;
    await admin.from("agendas").update({ ai_summary_enabled: true }).eq("id", agenda.id);

    return json(200, { title, summary_text: summaryText });
  } catch (error) {
    console.error("ai-summary failed:", error);
    return json(500, { error: "llm_failed", detail: String((error as Error)?.message ?? error) });
  }
});

// ---------------------------------------------------------------------------
// 재료 수집 (기존 AiService.buildMaterials)
// ---------------------------------------------------------------------------
type Agenda = { id: number; room_id: number; name: string; sequence: number };

async function buildMaterials(db: ReturnType<typeof createClient>, agenda: Agenda) {
  // 투표 + 옵션별 득표 수
  const { data: votes = [] } = await db
    .from("votes")
    .select("id, title, status")
    .eq("agenda_id", agenda.id)
    .order("created_at");
  const voteIds = (votes ?? []).map((v) => v.id);
  const { data: results = [] } = voteIds.length
    ? await db.from("vote_results").select("vote_id, content, votes").in("vote_id", voteIds)
    : { data: [] };

  // 코멘트: 최근 30개를 오래된 순으로, 각 400자
  const { data: comments = [] } = await db
    .from("comments")
    .select("content")
    .eq("agenda_id", agenda.id)
    .order("created_at", { ascending: false })
    .limit(MAX_COMMENTS);

  // 파일 최대 20개, PDF는 본문 텍스트 추출
  const { data: files = [] } = await db
    .from("files")
    .select("file_name, storage_path, is_pdf")
    .eq("agenda_id", agenda.id)
    .order("created_at")
    .limit(MAX_FILES);

  const fileExtractedTexts: string[] = [];
  for (const file of files ?? []) {
    if (!file.is_pdf) continue;
    try {
      const { data: blob, error } = await db.storage.from("agenda-files").download(file.storage_path);
      if (error || !blob) continue;
      const pdf = await getDocumentProxy(new Uint8Array(await blob.arrayBuffer()));
      const { text } = await extractText(pdf, { mergePages: true });
      if (text?.trim()) fileExtractedTexts.push(limitChars(text, MAX_PDF_CHARS));
    } catch (e) {
      // PDF 하나가 실패해도 요약은 계속
      console.warn("pdf extract failed:", file.file_name, e);
    }
  }

  return {
    agendaId: agenda.id,
    agendaName: agenda.name,
    sequence: agenda.sequence,
    votes: (votes ?? []).map((v) => ({
      title: v.title,
      voteStatus: v.status,
      options: (results ?? [])
        .filter((r) => r.vote_id === v.id)
        .map((r) => ({ contents: r.content, selectCount: r.votes })),
    })),
    comments: (comments ?? [])
      .reverse()
      .map((c) => ({ content: limitChars(c.content, MAX_COMMENT_CHARS) })),
    files: (files ?? []).map((f) => ({ fileName: f.file_name })),
    fileExtractedTexts,
  };
}

// ---------------------------------------------------------------------------
// 프롬프트 (기존 AiPromptBuilder 그대로)
// ---------------------------------------------------------------------------
function buildSummaryPrompt(materials: unknown) {
  return `너는 기업의 수석 회의 서기다.
아래 [입력 데이터(JSON)]만 근거로 "회의 결과 보고서"를 작성한다.
반드시 아래 규칙을 지켜서 결과를 출력하라.

=========================
[절대 출력 규칙 - 위반 금지]
1) 출력은 **오직 JSON 객체 1개**만 허용한다. (설명/코드펜스/추가 텍스트/주석 금지)
2) JSON 키는 정확히 "title", "summaryText" 두 개만 출력한다. 다른 키 금지.
3) title: 한국어 20자 이내, 따옴표(" '), 해시(#), 이모지 금지. "회의/보고서" 같은 뻔한 단어 금지.
4) summaryText: 반드시 **마크다운(Markdown)** 문서이며, 아래 [문서 템플릿] 구조를 그대로 따른다.
5) 입력 JSON에 없는 내용은 절대 생성(추측/상상/추가)하지 말 것.
6) 의미 없는 랜덤 문자열/반복문자(예: asdasd, qweqwe, vnv...) 절대 금지.
7) 모든 섹션은 "데이터가 없으면 없음"을 명확히 표기한다.
=========================

[분석 지침]
- Vote가 있으면 "결과 요약 + 해석(수렴/갈림)"을 작성
- Files/PDF 추출 텍스트가 있으면 "자료의 주장/근거/한계"만 정리(확대해석 금지)
- Comments가 있으면 "논의 흐름/쟁점/요구사항/결정"을 댓글에서만 추출해 구조화
  * 댓글의 표현이 짧아도, 중복되는 키워드/문장으로 묶어서 "핵심 테마"로 정리
  * 누가 말했다(발화자 정보)가 없으면 사람 구분을 하지 말고 "의견 A/B"처럼 중립적으로 정리
  * 공격적/감정적 표현이 있더라도 평가하지 말고 사실만 기록

[문서 템플릿 - summaryText는 반드시 이 구조]
# 0. 안건 개요
- 안건: (agendaName / sequence)
- 요약 범위: 투표 / 댓글 / 자료(파일·PDF) 기반 정리

---
# 1. 투표 결과 요약
(투표 데이터가 없으면: "진행된 투표가 없습니다."만 출력)
- 투표 주제:
- 상태:
- 결과:
  - 옵션명: 득표수
- 해석:
  - **핵심 수렴 지점**:
  - **의견 갈림 지점**:

---
# 2. 코멘트 기반 논의 요약
(코멘트이 없으면: "등록된 코멘트이 없습니다."만 출력)
- 논의 흐름:
  - (처음) ...
  - (중간) ...
  - (마무리) ...
- **핵심 테마 Top 3**:
  1) 테마 1: (코멘트 근거 문장/요지)
  2) 테마 2: (코멘트 근거 문장/요지)
  3) 테마 3: (코멘트 근거 문장/요지)
- 쟁점/질문:
  - 항목 1
  - 항목 2
- 합의/결정(코멘트에 근거가 있을 때만):
  - 항목 1
  - 항목 2

---
# 3. 업로드된 자료 검토 결과
(자료가 없으면: "검토된 자료가 없습니다."만 출력)
- 자료 요약:
  - 항목 1
  - 항목 2
- 근거/한계(자료에 실제로 있는 내용만):
  - 항목 1
  - 항목 2
- 비교/맥락(있을 때만):
  - 항목 1

---
# 4. Final Summary
> **[최종 결론]**
> 한 문장으로 최종 합의/핵심 결론을 정리함. (근거는 투표/코멘트/자료 중 존재하는 것만)

- **핵심 포인트**:
  - 항목 1
  - 항목 2
  - 항목 3
- **결정 사항**:
  - 항목 1
  - 항목 2
- **Next Steps**:
  - (우선순위 1) ...
  - (우선순위 2) ...
  - (우선순위 3) ...

[출력 JSON 스키마 - 이 형태로만 출력]
{
  "title": "여기에 20자 이내 제목",
  "summaryText": "여기에 위 템플릿을 따른 마크다운 보고서"
}

[입력 데이터(JSON)]
${JSON.stringify(materials)}`;
}

// ---------------------------------------------------------------------------
// Gemini 호출 (기존 GeminiLlmClient). 429면 잠깐 쉬고 최대 2번 더 시도.
// ---------------------------------------------------------------------------
async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY 시크릿이 없습니다.");
  const model = (Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash").replace(/^models\//, "");

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    );

    if (res.status === 429 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 5000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

    const body = await res.json();
    const parts = body?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!text) throw new Error("Gemini 응답이 비었습니다.");
    return text;
  }
}

// ---------------------------------------------------------------------------
// 응답 파싱 (코드펜스·앞뒤 설명 제거 후 첫 { ~ 마지막 } 만 파싱)
// ---------------------------------------------------------------------------
function parseAiResponse(raw: string): { title: string; summaryText: string } {
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);

  const parsed = JSON.parse(s);
  return {
    title: typeof parsed?.title === "string" ? parsed.title : "",
    summaryText: typeof parsed?.summaryText === "string" ? parsed.summaryText : "",
  };
}

function sanitizeTitle(title: string) {
  return title.replace(/["'#]/g, "").trim().slice(0, 20);
}
