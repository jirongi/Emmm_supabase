import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import style from "../CSS/Right.module.css";

import File from "../component/File";
import Comment from "../component/Comment";
import Vote from "../component/Vote";
import AI from "../component/AiSummary";
import Users from "../component/UserState";

import iconFile from "../asset/Mainicon-file.png";
import iconChat from "../asset/Mainicon-comment.png";
import iconVote from "../asset/Mainicon-vote.png";
import iconAI from "../asset/Mainicon-AI.png";
import iconFileColor from "../asset/Mainicon-color-file.png";
import iconChatColor from "../asset/Mainicon-color-comment.png";
import iconVoteColor from "../asset/Mainicon-color-vote.png";
import iconAIColor from "../asset/Mainicon-color-Ai.png";
import { getAgendaUsage } from "../api/agendas";

function RightList({ isHost, roomId, userId, agenda, onlineIds }) {
  const agendaId = agenda?.id ?? null;
  const [mode, setMode] = useState("basic");
  const [hover, setHover] = useState("");

  // 안건에 이미 쓰인 기능은 아이콘을 색칠한다
  const { data: usage } = useQuery({
    queryKey: ["usage", agendaId],
    queryFn: () => getAgendaUsage(agendaId),
    enabled: !!agendaId,
  });

  //안건 변경되면 오른쪽 다시 블럭화면으로 돌아오기
  useEffect(() => {
    setMode("basic");
  }, [agendaId]);

  function open(next) {
    if (agendaId === null) {
      alert("안건을 선택해주세요!");
      return;
    }
    setMode(next);
  }

  const block = (key, label, id, iconClass, plain, color, used, className) => (
    <div
      className={className}
      id={id}
      onClick={() => open(key)}
      onMouseEnter={() => setHover(key)}
      onMouseLeave={() => setHover("")}
    >
      <img alt={`Mainicon-${id}`} className={iconClass} src={used || hover === key ? color : plain} />
      <h3>{label}</h3>
    </div>
  );

  const Mode = {
    basic: <>
      <div className={style.Maindiv}>
        <div className={style.Subdiv}>
          {block("File", "파일", "file", style.imgFile, iconFile, iconFileColor, usage?.file, style.Block)}
          {block("Comment", "코멘트", "comment", style.imgComment, iconChat, iconChatColor, usage?.comment, style.Block)}
          {block("Vote", "투표", "vote", style.imgVote, iconVote, iconVoteColor, usage?.vote, style.Block)}
        </div>
        <div className={style.Subdiv}>
          {block("AI", "AI 요약", "ai", style.imgAI, iconAI, iconAIColor, usage?.ai, style.BigBlock)}
          <div className={style.SmallBlock} id="users">
            <Users roomId={roomId} onlineIds={onlineIds} />
          </div>
        </div>
      </div>
    </>,
    File: <File isHost={isHost} roomId={roomId} userId={userId} agendaId={agendaId} onChange={setMode} />,
    Comment: <Comment agendaId={agendaId} onChange={setMode} />,
    Vote: <Vote
      roomId={roomId}
      onlineIds={onlineIds}
      clickedAgendaName={agenda?.name} //투표리스트 title=안건이름
      isHost={isHost}
      userId={userId}
      agendaId={agendaId}
      onChange={setMode}
    />,
    AI: <AI isHost={isHost} agendaId={agendaId} onChange={setMode} />
  };
  return Mode[mode];
}

export default RightList;
