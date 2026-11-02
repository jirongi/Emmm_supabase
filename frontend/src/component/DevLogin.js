import { useState } from "react";
import { supabase } from "../lib/supabase";

// 개발용: localhost에서만 보이는 테스트 계정 로그인 (Google 계정 없이 host/member 흐름 확인용)
function DevLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (window.location.hostname !== "localhost") return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: "fixed", right: 16, bottom: 16, zIndex: 9999, display: "flex", gap: 6,
        padding: 8, background: "#fff", border: "1px dashed #999", borderRadius: 8, fontSize: 12,
      }}
    >
      <span style={{ alignSelf: "center", color: "#666" }}>개발용 로그인</span>
      <input data-testid="dev-email" placeholder="test-a@emmm.test" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input data-testid="dev-password" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">로그인</button>
      {error && <span style={{ color: "crimson", alignSelf: "center" }}>{error}</span>}
    </form>
  );
}

export default DevLogin;
