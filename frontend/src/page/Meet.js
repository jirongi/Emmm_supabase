import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Left from "../component/LeftList";
import Right from "../component/RightList";
import Header from "../component/Header";
import DM from "../component/Dm.js";
import Deletemodal from "../component/Deletemodal.js";
import CreateModal from "../component/CreateRoom.js";
import LogoutModal from "../component/LogoutModal.js";

import style from "../CSS/Meet.module.css";

import { useAuth } from "../auth/AuthProvider";
import { getMyRole, getRoom, setCurrentAgenda } from "../api/rooms";
import { getAgendas } from "../api/agendas";
import { errorMessage } from "../api/errors";
import { useAgendaRealtime, useRoomRealtime } from "../hooks/useRealtime";
import { useVoteDoneAlert, useVoteProgress } from "../hooks/useVoteProgress";

function Meet() {
  const { roomId: roomParam } = useParams();
  const roomId = roomParam ? Number(roomParam) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const [deleteModal, setDeleteModal] = useState(false);
  const [Logoutmodal, setLogoutmodal] = useState(false);

  // 멤버가 아니거나 없는 방이면 RLS 때문에 조회가 실패한다
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId),
    enabled: !!roomId,
    retry: false,
  });
  const { data: role } = useQuery({
    queryKey: ["role", roomId, user.id],
    queryFn: () => getMyRole(roomId, user.id),
    enabled: !!roomId,
    retry: false,
  });
  const { data: agendas = [], isSuccess: agendasLoaded } = useQuery({
    queryKey: ["agendas", roomId],
    queryFn: () => getAgendas(roomId),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (roomQuery.isError) {
      alert("참여하지 않았거나 존재하지 않는 회의입니다.");
      navigate("/home", { replace: true });
    }
  }, [roomQuery.isError, navigate]);

  const onlineIds = useRoomRealtime(roomId, user, profile, {
    onRemoved: () => {
      alert("회의방이 삭제되었거나 회의에서 나가게 되었습니다.");
      navigate("/home", { replace: true });
    },
  });

  const room = roomQuery.data;
  const isHost = role === "host";
  // 지금 보는 안건 = 방의 현재 안건. host가 바꾸면 모두의 화면이 따라 바뀐다.
  const clickedAgenda = agendas.find((agenda) => agenda.id === room?.current_agenda_id) ?? null;
  useAgendaRealtime(clickedAgenda?.id);
  // host: 지금 안건의 투표에 접속자가 모두 참여하면 알림
  const voteProgress = useVoteProgress(clickedAgenda?.id, roomId, onlineIds);
  useVoteDoneAlert(voteProgress, user.id, isHost);

  async function selectAgenda(agendaId) {
    try {
      await setCurrentAgenda(roomId, agendaId);
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  if (!roomId) {
    return (
      <div className={style.extradiv}>
        <CreateModal onCreated={(newRoom) => navigate(`/meet/${newRoom.id}`, { replace: true })} />
      </div>
    );
  }

  // 안건 목록까지 받은 뒤 그린다 (먼저 그리면 현재 안건이 잠깐 "선택 안 됨"으로 보임)
  if (!room || !role || !agendasLoaded) return null;

  return (
    <div className={style.extradiv}>
      <div className={style.Maindiv}>
        <div className={style.Header}>
          <Header
            setLogoutmodal={setLogoutmodal}
            isHost={isHost}
            code={room.code}
            state={room.state}
            roomId={roomId}
          />
        </div>
        <div className={style.Component}>
          <Left
            deleteModal={setDeleteModal}
            onSelectAgenda={selectAgenda}
            agendas={agendas}
            isHost={isHost}
            roomId={roomId}
            roomName={room.name}
            clickedAgendaId={clickedAgenda?.id ?? null}
          />
          <Right
            agenda={clickedAgenda}
            onlineIds={onlineIds}
            isHost={isHost}
            roomId={roomId}
            userId={user.id}
          />
        </div>
        <DM isHost={isHost} roomId={roomId} />
      </div>

      {deleteModal && <Deletemodal setDeleteModal={setDeleteModal} roomId={roomId} />}
      {Logoutmodal && <LogoutModal setLogoutmodal={setLogoutmodal} />}
    </div>
  );
}

export default Meet;
