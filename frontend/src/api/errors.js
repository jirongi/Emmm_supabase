// supabase-js는 { data, error }를 돌려준다. api/ 함수는 error가 있으면 던진다.
export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

// DB 함수(RPC)가 raise 하는 코드 → 화면 문구
const MESSAGES = {
  login_required: "로그인이 필요합니다.",
  room_not_found: "존재하지 않는 회의 코드입니다.",
  room_closed: "이미 완료된 회의라 참여할 수 없습니다.",
  wrong_password: "비밀번호가 맞지 않습니다.",
  not_host: "호스트만 할 수 있는 작업입니다.",
  vote_not_found: "존재하지 않는 투표입니다.",
  vote_closed: "이미 마감된 투표입니다.",
  invalid_option: "선택할 수 없는 항목입니다.",
};

export function errorMessage(error) {
  return MESSAGES[error?.message] ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
