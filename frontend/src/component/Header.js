import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import style from "../CSS/Header.module.css";

import copy from "../asset/icon-copy.png";
import logo from "../asset/icon-logo.png";
import out from "../asset/icon-out.png";

//사이트 메인 아이콘 + 구글 아이콘 + 방번호 + 완료/진행중 상태
function Header({
  setLogoutmodal,
  setEmail,
  setName,
  setPicture,
  setState,
  token,
  isHost,
  code,
  state,
  roomId,
  name,
  email,
  picture,
}) {
  const navigate = useNavigate();
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

  useEffect(() => {
    const user = localStorage.getItem("userInfo");

    if (!token && !user) {
      navigate("/home");
    }

    setName(JSON.parse(user).name);
    setEmail(JSON.parse(user).email);
    setPicture(JSON.parse(user).profileUrl);
  }, [token, navigate, setName, setEmail, setPicture]);

  function handleButton() {
    if (state === "running") {
      axios
        .patch(
          `
          ${process.env.REACT_APP_HOST_URL}/room/${roomId}/state`,
          {
            state: "complete",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .catch((error) => {
          console.error("마이페이지 정보 가져오기 실패:", error);
        });
      return;
    } else {
      axios
        .patch(
          `
          ${process.env.REACT_APP_HOST_URL}/room/${roomId}/state`,
          {
            state: "running",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .catch((error) => {
          console.error("마이페이지 정보 가져오기 실패:", error);
        });
    }
  }

  function handleRoomNumber() {
    navigator.clipboard.writeText(
      document.getElementById("RoomNumber").innerText,
    );
    alert("클립이 복사되었습니다!");
  }

  function backtohome() {
    navigate("/home");
  }

  return (
    <div className={style.Maindiv}>
      <div className={style.Left}>
        <img src={logo} alt="logo" onClick={() => backtohome()} />
      </div>

      <div className={style.Right}>
        <div
          id="state"
          className={state === "running" ? style.StateIng : style.StateFinish}
          onClick={() => isHost && handleButton()}
        >
          <strong>•</strong>&nbsp;{state === "running" ? "진행중" : "완료"}
        </div>
        <div
          id="RoomNumber"
          className={style.Number}
          onClick={() => handleRoomNumber()}
        >
          {code}
          <img alt="copy" src={copy} />
        </div>
        <img
          alt="profileicon"
          src={picture}
          onClick={() => setProfileOpen(true)}
        />

        {/*--> 모달 <--*/}
        {profileOpen ? (
          <div className={style.ProfileModal} ref={ModalRef}>
            <div className={style.Maindiv}>
              <div className={style.Subdiv}>
                <img src={picture} alt="googleicon" />
                <div className={style.ModalInfo}>
                  <div className={style.Name}>{name}</div>
                  <span>{email}</span>
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
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default Header;
