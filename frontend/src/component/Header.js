import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import style from "../CSS/Header.module.css";

import copy from "../asset/icon-copy.png";
import logo from "../asset/icon-logo.png";
import out from "../asset/icon-out.png";
import { useAuth } from "../auth/AuthProvider";
import { setRoomState } from "../api/rooms";
import { errorMessage } from "../api/errors";
import { avatarSrc } from "../lib/avatar";

//사이트 메인 아이콘 + 구글 아이콘 + 방번호 + 완료/진행중 상태
function Header({ setLogoutmodal, isHost, code, state, roomId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const ModalRef = useRef(null);

  useEffect(() => {
    function HandClickoutsideofModal(e) {
      if (ModalRef.current && !ModalRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", HandClickoutsideofModal);

    return () =>
      document.removeEventListener("mousedown", HandClickoutsideofModal);
  }, [ModalRef]);

  async function handleButton() {
    try {
      await setRoomState(roomId, state === "running" ? "complete" : "running");
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  function handleRoomNumber() {
    navigator.clipboard.writeText(code);
    alert("클립이 복사되었습니다!");
  }

  return (
    <div className={style.Maindiv}>
      <div className={style.Left}>
        <img src={logo} alt="logo" onClick={() => navigate("/home")} />
      </div>

      <div className={style.Right}>
        <div
          id="state"
          className={state === "running" ? style.StateIng : style.StateFinish}
          onClick={() => isHost && handleButton()}
        >
          <strong>•</strong>&nbsp;{state === "running" ? "진행중" : "완료"}
        </div>
        <div id="RoomNumber" className={style.Number} onClick={() => handleRoomNumber()}>
          {code}
          <img alt="copy" src={copy} />
        </div>
        <img alt="profileicon" src={avatarSrc(profile?.avatar_url)} onClick={() => setProfileOpen(true)} />

        {/*--> 모달 <--*/}
        {profileOpen && (
          <div className={style.ProfileModal} ref={ModalRef}>
            <div className={style.Maindiv}>
              <div className={style.Subdiv}>
                <img src={avatarSrc(profile?.avatar_url)} alt="googleicon" />
                <div className={style.ModalInfo}>
                  <div className={style.Name}>{profile?.name}</div>
                  <span>{profile?.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setLogoutmodal(true);
                setProfileOpen(false);
              }}
            >
              <img alt="out" src={out} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;
