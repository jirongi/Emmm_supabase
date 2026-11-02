import { useEffect, useState } from "react";

// "n분 전" 표시나 타이머처럼 시간이 흐르는 화면에서만 쓴다 (페이지 전체를 매초 다시 그리지 않도록)
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function timeAgo(createdAt, now) {
  const amount = Math.floor((now - new Date(createdAt).getTime()) / 1000);
  if (amount < 60) return "1분미만";
  if (amount < 3600) return `${Math.floor(amount / 60)}분 전`;
  if (amount < 86400) return `${Math.floor(amount / 3600)}시간 전`;
  return `${Math.floor(amount / 86400)}일 전`;
}
