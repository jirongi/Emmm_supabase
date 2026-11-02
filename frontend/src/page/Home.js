import { useEffect, useState } from "react";
import styles from "../CSS/Home.module.css";
import logoImg from "../asset/icon-logo.png";
import addImg from "../asset/icon-add_white.png";
import Profile from "../component/Profile";
import Progress from "../component/Progress";
import Archived from "../component/Archived";
import Joinpw from "../component/Joinpw";
import LogoutModal from "../component/LogoutModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Home() {
  const navigate = useNavigate();

  const [reset, setReset] = useState(false);

  const [Logoutmodal, setLogoutmodal] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [picture, setPicture] = useState("");
  const [userId, setUserId] = useState("");

  const [progressRooms, setProgressRooms] = useState([]);
  const [completeRooms, setCompleteRooms] = useState([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const [value, setValue] = useState("");
  const [code, setCode] = useState("");

  const [roomId, setRoomId] = useState("");
  const [isPassword, setIsPassword] = useState(false);

  function activeEnter(e) {
    if (e.key === "Enter") {
      setCode(value);
    }
  }

  function joinRoom() {
    if (isPassword === false && roomId !== "") {
      axios
        .post(`${process.env.REACT_APP_HOST_URL}/room/${roomId}/member`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          localStorage.setItem("role", res.data.role);
          localStorage.setItem("roomId", res.data.roomId);

          if (localStorage.getItem("role") === "member") navigate("/meet");
        })
        .catch((error) => {
          console.error("참여할 룸 상태 정보 가져오기 실패:", error);
        });
    } else if (isPassword === true && roomId !== "") {
      setPwOpen(true);
      setIsPassword(false);
    }
  }

  function isProfileOpen() {
    if (profileOpen === false) {
      setProfileOpen(true);
    } else if (profileOpen === true) {
      setProfileOpen(false);
    }
  }

  useEffect(() => {
    localStorage.removeItem("roomId");
    localStorage.removeItem("role");
    setToken(localStorage.getItem("accessToken"));
    const user = JSON.parse(localStorage.getItem("userInfo"));
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPicture(user.profileUrl);

    if (!token || !user) {
      setReset(!reset);
      return;
    }

    axios
      .get(`${process.env.REACT_APP_HOST_URL}/user/me/running`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setProgressRooms(res.data);
      })
      .catch((error) => {
        console.error("진행중인 룸 상태 정보 가져오기 실패:", error);
      });

    axios
      .get(`${process.env.REACT_APP_HOST_URL}/user/me/complete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCompleteRooms(res.data);
      })
      .catch((error) => {
        console.error("완료된 룸 상태 정보 가져오기 실패:", error);
      });
  }, [reset, token, userId]);

  useEffect(() => {
    if (code !== null && code.length === 10) {
      axios
        .get(
          `${process.env.REACT_APP_HOST_URL}/room/code?code=${code}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .then((res) => {
          setRoomId(res.data.roomId);
          setIsPassword(res.data.password);
          setCode("");
        })
        .catch((error) => {
          console.error("룸 입장 코드 가져오기 실패:", error);
        });
    }

    if (roomId !== null) joinRoom();
  }, [code, token, roomId]);

  return (
    <div>
      <div className={styles.extradiv}>
        <div className={styles.Maindiv}>
          {pwOpen === true ? (
            <Joinpw onChange={setPwOpen} token={token} roomId={roomId} />
          ) : null}

          <div className={styles.header}>
            <img className={styles.logo} src={logoImg} alt="이음로고" />

            <div></div>
            <div className={styles.profile}>
              {picture && (
                <img
                  className={styles.profileImg}
                  src={picture}
                  alt="프로필"
                  onClick={isProfileOpen}
                />
              )}

              {profileOpen === true ? (
                <Profile
                  onChange={setProfileOpen}
                  Logoutmodal={setLogoutmodal}
                  user={{ name: name, email: email, picture: picture }}
                />
              ) : null}
            </div>
          </div>

          <div className={styles.menu}>
            <div className={styles.new} onClick={(e) => navigate("/meet")}>
              <img className={styles.addBtn} src={addImg} alt="추가" />
            </div>

            <div className={styles.join}>
              회의 참여를 위해 코드를 입력해 주세요
              <input
                className={styles.code}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => activeEnter(e)}
              ></input>
            </div>
          </div>

          {isArchiveOpen === false ? (
            <Progress
              onChange={setIsArchiveOpen}
              progressRoomList={progressRooms}
            />
          ) : (
            <Archived
              onChange={setIsArchiveOpen}
              isOpen={isArchiveOpen}
              completeRoomList={completeRooms}
            />
          )}
        </div>
        {Logoutmodal === true ? (
          <LogoutModal
            setLogoutmodal={setLogoutmodal}
            setName={setName}
            setEmail={setEmail}
            setPicture={setPicture}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Home;
