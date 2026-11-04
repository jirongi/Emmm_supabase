import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// 테이블 변경 이벤트를 받으면 내용은 쓰지 않고 해당 쿼리만 다시 불러온다.
// DELETE 이벤트는 RLS 때문에 기본 키만 오고 필터가 걸리지 않으므로 필터 없이 받는다.
function listen(channel, table, filter, onChange) {
  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table, filter }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table, filter }, onChange)
    .on("postgres_changes", { event: "DELETE", schema: "public", table }, onChange);
  return channel;
}

// 회의방 단위: 방 정보, 안건 목록, 타이머, DM, 멤버, 접속자(Presence)
export function useRoomRealtime(roomId, user, profile, { onRemoved } = {}) {
  const queryClient = useQueryClient();
  const [onlineIds, setOnlineIds] = useState([]);
  // 방 삭제 시 rooms·room_members DELETE가 함께 오므로 한 번만 알린다
  const removedRef = useRef(false);
  const onRemovedRef = useRef(onRemoved);
  onRemovedRef.current = () => {
    if (removedRef.current) return;
    removedRef.current = true;
    onRemoved?.();
  };

  const profileName = profile?.name;

  useEffect(() => {
    if (!roomId || !user) return;
    removedRef.current = false;
    const refresh = (key) => () => queryClient.invalidateQueries({ queryKey: [key, roomId] });
    const byRoom = `room_id=eq.${roomId}`;

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: user.id } },
    });

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      refresh("room"),
    );
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms" }, (payload) => {
      if (payload.old?.id === roomId) onRemovedRef.current?.();
    });
    listen(channel, "agendas", byRoom, refresh("agendas"));
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "timers", filter: byRoom },
      refresh("timer"),
    );
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "dm_messages", filter: byRoom },
      refresh("dms"),
    );
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "room_members", filter: byRoom },
      refresh("members"),
    );
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "room_members" }, (payload) => {
      if (payload.old?.room_id !== roomId) return;
      if (payload.old.user_id === user.id) onRemovedRef.current?.();
      else refresh("members")();
    });

    channel.on("presence", { event: "sync" }, () => {
      setOnlineIds(Object.keys(channel.presenceState()));
    });

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      channel.track({ user_id: user.id, name: profileName ?? "" });
      // 연결이 끊긴 동안 놓친 변경을 반영
      ["room", "agendas", "timer", "dms", "members"].forEach((key) => refresh(key)());
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, profileName, queryClient]);

  return onlineIds;
}

// 안건 단위: 댓글, 파일, 투표 목록, AI 요약
export function useAgendaRealtime(agendaId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!agendaId) return;
    const refresh = (...keys) => () =>
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    const byAgenda = `agenda_id=eq.${agendaId}`;

    const channel = supabase.channel(`agenda:${agendaId}`);
    const usage = ["usage", agendaId];
    listen(channel, "comments", byAgenda, refresh(["comments", agendaId], usage));
    listen(channel, "files", byAgenda, refresh(["files", agendaId], usage));
    listen(channel, "votes", byAgenda, refresh(["votes", agendaId], ["vote"], usage));
    listen(channel, "ai_summaries", byAgenda, refresh(["summary", agendaId], usage));
    // 투표 참여 현황: vote_selections에는 agenda_id가 없어 필터 없이 받는다 (RLS로 내 방 것만 옴)
    listen(channel, "vote_selections", undefined, refresh(["voters", agendaId]));
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        refresh(
          ["comments", agendaId], ["files", agendaId], ["votes", agendaId], ["summary", agendaId], usage,
          ["voters", agendaId],
        )();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agendaId, queryClient]);
}

// 투표 상세: 옵션, 선택(득표)
export function useVoteRealtime(voteId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!voteId) return;
    const refresh = () => {
      ["options", "results", "mySelection"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key, voteId] }),
      );
      queryClient.invalidateQueries({ queryKey: ["voters"] });
    };
    const byVote = `vote_id=eq.${voteId}`;

    const channel = supabase.channel(`vote:${voteId}`);
    listen(channel, "vote_options", byVote, refresh);
    listen(channel, "vote_selections", byVote, refresh);
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [voteId, queryClient]);
}
