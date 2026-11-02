import { createClient } from "@supabase/supabase-js";

// URL과 anon key는 공개용 값이다 (권한은 RLS가 막는다). 그래서 기본값을 코드에 두고,
// 환경변수는 형식이 올바를 때만 쓴다. 배포 설정에서 키를 가려진 표시(eyJhbGci•••)째로
// 붙여 넣어도 앱이 깨지지 않게 하기 위함.
const DEFAULT_URL = "https://ktnsntefvnptssqbknlf.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bnNudGVmdm5wdHNzcWJrbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MDkxMjEsImV4cCI6MjEwOTE4NTEyMX0.R1448KLBWSKJhSTVz_Qff9Rl6Tt78B0To5d0chXBYuU";

const envUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

const isUrl = (v) => /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(v ?? "");
// JWT(eyJ...) 또는 새 publishable key(sb_publishable_...)
const isKey = (v) =>
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v ?? "") || /^sb_publishable_[A-Za-z0-9_-]+$/.test(v ?? "");

export const supabase = createClient(
  isUrl(envUrl) ? envUrl : DEFAULT_URL,
  isKey(envKey) ? envKey : DEFAULT_ANON_KEY,
);
