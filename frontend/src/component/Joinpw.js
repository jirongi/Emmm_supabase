//홈페이지 프로필 사진 눌렀을 때 나오는 창
import { useEffect, useRef, useState } from "react";

import styles from "../CSS/Joinpw.module.css";

import deleteIcon from "../asset/icon-delete.png";
import { useNavigate } from "react-router-dom";
import { joinRoom } from "../api/rooms";

function Joinpw({ onChange, room }) {
  const navigate = useNavigate();
  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const inputRef3 = useRef(null);
  const inputRef4 = useRef(null);

  // 칸마다 입력한 숫자. 렌더와 무관하므로 state가 아니라 ref로 둔다.
  const inputNum = useRef([]).current;
  const [password, setPassword] = useState("");

  const [wrongPw, setWrongPw] = useState("pwNomal");

  // 창이 뜨면 바로 첫 칸에 입력할 수 있게
  useEffect(() => {
    inputRef1.current?.focus();
  }, []);

  function onDelete(e) {
    if (e.target.value.length === 1) {
      switch (e.target.name) {
        case "pw1":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            if (e.target.value) e.target.value = "";
            inputNum[0] = e.target.value;
          }
          break;
        case "pw2":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            if (e.target.value) e.target.value = "";
            inputNum[1] = e.target.value;
          }
          break;
        case "pw3":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            if (e.target.value) e.target.value = "";
            inputNum[2] = e.target.value;
          }
          break;
        case "pw4":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            if (e.target.value) e.target.value = "";
            inputNum[3] = e.target.value;
          }
          break;
        default:
          break;
      }
    } else if (e.target.value.length === 0) {
      switch (e.target.name) {
        case "pw2":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            inputRef1.current.focus();
          }
          break;
        case "pw3":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            inputRef2.current.focus();
          }
          break;
        case "pw4":
          if (e.keyCode === 8 || e.keyCode === 46) {
            e.preventDefault();
            inputRef3.current.focus();
          }
          break;
        default:
          break;
      }
    }

    if (e.key === "Enter") {
      handleJoin();
    }
  }

  function onInput(e) {
    if (e.target.value.length === 1) {
      const value = e.target.value;
      const cleanedNumber = value.replace(/\D/g, "");
      switch (e.target.name) {
        case "pw1":
          if (cleanedNumber.length === 0) {
            e.target.value = "";
            return;
          }
          inputNum[0] = e.target.value;
          inputRef2.current.focus();
          break;
        case "pw2":
          if (cleanedNumber.length === 0) {
            e.target.value = "";
            return;
          }
          inputNum[1] = e.target.value;
          inputRef3.current.focus();
          break;
        case "pw3":
          if (cleanedNumber.length === 0) {
            e.target.value = "";
            return;
          }
          inputNum[2] = e.target.value;
          inputRef4.current.focus();
          break;
        case "pw4":
          if (cleanedNumber.length === 0) {
            e.target.value = "";
            return;
          }
          inputNum[3] = e.target.value;
          break;
        default:
          break;
      }
    }

    setPassword(inputNum.join(""));
  }

  async function handleJoin() {
    try {
      await joinRoom(room.room_id, password);
      navigate(`/meet/${room.room_id}`);
    } catch {
      setWrongPw("pwWrong");
      // 틀리면 네 칸을 비우고 첫 칸부터 다시
      [inputRef1, inputRef2, inputRef3, inputRef4].forEach((r) => { if (r.current) r.current.value = ""; });
      inputNum.length = 0;
      setPassword("");
      inputRef1.current?.focus();
      setTimeout(function () {
        setWrongPw("pwNomal");
      }, 500);
    }
  }

  return (
    <div>
      <div className={styles.extradiv}>
        <div className={styles.maindiv}>
          <div className={styles.modal}>
            <img
              className={styles.deleteIcon}
              src={deleteIcon}
              alt="나가기"
              onClick={() => onChange(false)}
            />
            <div className={styles.title}>
              {room.name}
              <br />
              <span>참여자 확인을 위한 4자리 숫자를 입력해 주세요</span>
            </div>
            <div className={styles.pwInput}>
              <input
                className={styles[wrongPw]}
                name="pw1"
                type="password"
                maxLength="1"
                ref={inputRef1}
                onChange={onInput}
                onKeyDown={onDelete}
              ></input>
              <input
                className={styles[wrongPw]}
                name="pw2"
                type="password"
                maxLength="1"
                ref={inputRef2}
                onChange={onInput}
                onKeyDown={onDelete}
              ></input>
              <input
                className={styles[wrongPw]}
                name="pw3"
                type="password"
                maxLength="1"
                ref={inputRef3}
                onChange={onInput}
                onKeyDown={onDelete}
              ></input>
              <input
                className={styles[wrongPw]}
                name="pw4"
                type="password"
                maxLength="1"
                ref={inputRef4}
                onChange={onInput}
                onKeyDown={onDelete}
              ></input>
            </div>
            <div className={styles.joinBtn} onClick={handleJoin}>
              입장하기
            </div>
            <div className={styles.lowText}>
              기분 좋은 회의의 시작, 두먹사가 함께합니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Joinpw;
