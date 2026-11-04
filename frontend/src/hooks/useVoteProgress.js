import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelections, getVotes } from "../api/votes";
import { getMembers } from "../api/rooms";
import { notify } from "../component/Toast";

// 안건의 투표별 참여 현황. 대상 = 지금 접속 중인 멤버 + 이미 투표한 멤버
export function useVoteProgress(agendaId, roomId, onlineIds) {
  const { data: votes = [] } = useQuery({
    queryKey: ["votes", agendaId],
    queryFn: () => getVotes(agendaId),
    enabled: !!agendaId,
  });
  const voteIds = votes.map((vote) => vote.id);
  const { data: selections = [] } = useQuery({
    queryKey: ["voters", agendaId, voteIds],
    queryFn: () => getSelections(voteIds),
    enabled: voteIds.length > 0,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["members", roomId],
    queryFn: () => getMembers(roomId),
    enabled: !!roomId,
  });

  return useMemo(() => {
    const byVote = {};
    for (const vote of votes) {
      const voted = new Set(selections.filter((s) => s.vote_id === vote.id).map((s) => s.user_id));
      const eligible = members.filter((m) => onlineIds.includes(m.user_id) || voted.has(m.user_id));
      byVote[vote.id] = {
        vote,
        voted: eligible.filter((m) => voted.has(m.user_id)),
        notVoted: eligible.filter((m) => !voted.has(m.user_id)),
        total: eligible.length,
      };
    }
    return byVote;
  }, [votes, selections, members, onlineIds]);
}

// [host] 진행 중인 투표에 접속자 모두가 참여하면 한 번 알린다
export function useVoteDoneAlert(progress, userId, enabled) {
  const doneRef = useRef({});

  useEffect(() => {
    if (!enabled) return;
    for (const { vote, notVoted, total, voted } of Object.values(progress)) {
      const done = vote.status === "running" && total > 1 && notVoted.length === 0;
      const before = doneRef.current[vote.id];
      // 처음 본 투표는 기준값만 기록 (들어오자마자 알림이 뜨지 않게)
      if (before === false && done && voted.some((m) => m.user_id !== userId)) {
        notify(`'${vote.title}' 투표에 모두 참여했어요 (${total}명)`, { icon: "🗳️" });
      }
      doneRef.current[vote.id] = done;
    }
  }, [progress, userId, enabled]);
}
