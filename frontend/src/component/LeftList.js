import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import style from "../CSS/Left.module.css";

import Timer from "./Timer";

import tip from "../asset/icon-tip-red.png";
import setting from "../asset/icon-setting.png";
import edit from "../asset/icon-edit.png";
import bin from "../asset/icon-trashbin.png";
import visible from "../asset/icon-visible.png";
import add from "../asset/icon-add.png";
import { renameRoom, setCurrentAgenda, setRoomPassword } from "../api/rooms";
import { addAgenda, deleteAgenda, updateAgenda } from "../api/agendas";
import { errorMessage } from "../api/errors";

function LeftList({ isHost, roomId, roomName, agendas, clickedAgendaId, onSelectAgenda, deleteModal }) {
  const queryClient = useQueryClient();

  //[안건이름변경]
  const [Changed, setChanged] = useState(null);

  //안건 hover전용
  const [hover, setHover] = useState(null);

  //[방설정]
  const [Setting, setSetting] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  //[모달]
  const [ModalId, setModalId] = useState(null);

  //Ref
  const ModalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function HandClickoutsideofModal(e) {
      if (ModalRef.current && !ModalRef.current.contains(e.target)) {
        setModalId(null);
      }
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setChanged(null);
      }
    }
    document.addEventListener("mousedown", HandClickoutsideofModal);

    return () => {
      document.removeEventListener("mousedown", HandClickoutsideofModal);
    }
  }, [ModalId, inputRef]);

  const refreshAgendas = () => queryClient.invalidateQueries({ queryKey: ["agendas", roomId] });

  async function run(task) {
    try {
      await task();
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  function handleOption(e, id) {
    setModalId(id);
    e.stopPropagation();
  }

  //방 functions
  function handleEditRoom() {
    run(async () => {
      // 빈 칸은 바꾸지 않는다 (기존: 빈 값으로 덮어써지던 문제)
      if (newRoomName.trim()) await renameRoom(roomId, newRoomName.trim());
      if (newPassword) {
        if (!/^\d{4}$/.test(newPassword)) {
          alert("비밀번호는 숫자 4자리로 입력해 주세요.");
          return;
        }
        await setRoomPassword(roomId, newPassword);
      }
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      setNewRoomName("");
      setNewPassword("");
      setSetting(false);
    });
  }

  //안건 functions
  function handleAddAgenda() {
    run(async () => {
      const agenda = await addAgenda(roomId, "안건 제목");
      // 첫 안건이면 바로 현재 안건으로
      if (clickedAgendaId === null) await setCurrentAgenda(roomId, agenda.id);
      refreshAgendas();
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    });
  }
  function handleDeleteAgenda(id) {
    run(async () => {
      await deleteAgenda(id);
      refreshAgendas();
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    });
  }
  function EditAgenda(e, id) {
    if (e.key !== "Enter") return;
    const name = e.target.value.trim();
    setChanged(null);
    if (!name) return;
    run(async () => {
      await updateAgenda(id, { name });
      refreshAgendas();
    });
  }

  return (
    <div className={style.Maindiv}>
      <div className={style.Head}>
        <div className={style.Left}>
          {roomName}
        </div>
        {isHost && <img alt="setting" src={setting} onClick={() => setSetting(!Setting)} />}
      </div>

      <hr />

      {Setting ?
        <div className={style.Setting}>
          <div className={style.SettingDiv}>
            <h2 onClick={() => setSetting(false)} >+</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditRoom();
            }}>
              <label>회의 이름 변경
                <div className={style.Input}>
                  <input
                    placeholder={roomName}
                    maxLength='12'
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                </div>
              </label>

              <label>방 비밀번호 변경
                <div className={style.Input}>
                  <input
                    type={showPassword ? "text" : "password"}
                    inputMode="numeric"
                    minLength='4'
                    maxLength='4'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <img alt="visible" src={visible} onClick={() => setShowPassword(!showPassword)} />
                </div>
              </label>

              <button type="submit">변경하기</button>
              <div className={style.Tip}>
                <img alt="tipicon" src={tip} />
                삭제하기 버튼을 누르면 이 방의 모든 회의 기록과 <br />
                데이터가 영구적으로 삭제되며 복구할 수 없습니다
              </div>

              <button
                className={style.cancel}
                onClick={(e) => {
                  e.preventDefault();
                  deleteModal(true);
                }}
              >방 삭제하기</button>
            </form>
          </div>
        </div>
        :
        <div className={style.Agenda}>
          <div className={style.List}>

            {agendas.map((agenda) => (
              <div
                onMouseEnter={() => setHover(agenda.id)}
                onMouseLeave={() => setHover(null)}
                key={agenda.id}
                className={clickedAgendaId === agenda.id ? style.ChosenBlock : style.Block}
                onClick={() => isHost && onSelectAgenda(agenda.id)}
              >
                <div className={style.Text} onDoubleClick={() => isHost && setChanged(agenda.id)}>
                  <span>•</span> {Changed === agenda.id ? <input ref={inputRef} onKeyDown={(e) => EditAgenda(e, agenda.id)} placeholder={agenda.name} /> : <h1>{agenda.name}</h1>}
                </div>
                {hover === agenda.id && isHost && <h3 alt="option"
                  onClick={(e) => {
                    handleOption(e, agenda.id);
                  }} >⋮</h3>}
                {ModalId === agenda.id && isHost &&
                  <div className={style.Modal} ref={ModalRef}>
                    <div className={style.Options}>
                      <div className={style.Edit} onClick={(e) => {
                        setChanged(agenda.id);
                        setModalId(null);
                        e.stopPropagation();
                      }}>
                        <img alt="edit" src={edit} />
                        이름 변경
                      </div>
                      <div className={style.Dlt} onClick={(e) => {
                        handleDeleteAgenda(agenda.id);
                        setModalId(null);
                        e.stopPropagation();
                      }}>
                        <img alt="bin" src={bin} />
                        삭제
                      </div>
                    </div>
                  </div>}

              </div>))}

          </div>
          {isHost && <div className={style.Add} onClick={() => handleAddAgenda()}>
            <img alt="add" src={add} />&nbsp;안건을 추가해주세요
          </div>}
        </div>
      }
      {!isHost && <div className={style.space}></div>}
      <hr />

      <Timer isHost={isHost} roomId={roomId} />
    </div >
  );
}

export default LeftList;
