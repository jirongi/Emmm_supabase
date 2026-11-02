import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import styles from "../CSS/Home.module.css";
import logoImg from "../asset/icon-logo.png";
import addImg from "../asset/icon-add_white.png";
import Profile from "../component/Profile";
import Progress from "../component/Progress";
import Archived from "../component/Archived";
import Joinpw from "../component/Joinpw";
import LogoutModal from "../component/LogoutModal";
import { useAuth } from "../auth/AuthProvider";
import { findRoom, getMyRooms, joinRoom } from "../api/rooms";
import { errorMessage } from "../api/errors";
import { avatarSrc } from "../lib/avatar";

function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [Logoutmodal, setLogoutmodal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const [value, setValue] = useState("");
  // 비밀번호 입력이 필요한 방 { room_id, name }
  const [pwRoom, setPwRoom] = useState(null);

  const { data: rooms = [] } = useQuery({
    queryKey: ["myRooms", user.id],
    queryFn: () => getMyRooms(user.id),
  });
  const progressRooms = rooms.filter((room) => room.state === "running");
  const completeRooms = rooms.filter((room) => room.state === "complete");

  async function enterCode() {
    const code = value.trim();
    if (code.length !== 10) {
      alert("회의 코드는 10자리입니다.");
      return;
    }
    try {
      const room = await findRoom(code);
      try {
        // 이미 멤버이거나 비밀번호 없는 방이면 바로 들어간다
        await joinRoom(room.room_id);
        navigate(`/meet/${room.room_id}`);
      } catch (error) {
        if (error.message === "wrong_password") setPwRoom(room);
        else alert(errorMessage(error));
      }
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  function activeEnter(e) {
    if (e.key === "Enter") enterCode();
  }

  return (
    <div>
      <div className={styles.extradiv}>
        <div className={styles.Maindiv}>
          {pwRoom && <Joinpw onChange={() => setPwRoom(null)} room={pwRoom} />}

          <div className={styles.header}>
            <img className={styles.logo} src={logoImg} alt="이음로고" />

            <div></div>
            <div className={styles.profile}>
              {profile && (
                <img
                  className={styles.profileImg}
                  src={avatarSrc(profile.avatar_url)}
                  alt="프로필"
                  onClick={() => setProfileOpen(!profileOpen)}
                />
              )}

              {profileOpen && (
                <Profile
                  onChange={setProfileOpen}
                  Logoutmodal={setLogoutmodal}
                  user={{ name: profile?.name, email: profile?.email, picture: avatarSrc(profile?.avatar_url) }}
                />
              )}
            </div>
          </div>

          <div className={styles.menu}>
            <div className={styles.new} onClick={() => navigate("/meet")}>
              <img className={styles.addBtn} src={addImg} alt="추가" />
            </div>

            <div className={styles.join}>
              회의 참여를 위해 코드를 입력해 주세요
              <input
                className={styles.code}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={activeEnter}
              ></input>
            </div>
          </div>

          {isArchiveOpen === false ? (
            <Progress onChange={setIsArchiveOpen} progressRoomList={progressRooms} />
          ) : (
            <Archived onChange={setIsArchiveOpen} completeRoomList={completeRooms} />
          )}
        </div>
        {Logoutmodal && <LogoutModal setLogoutmodal={setLogoutmodal} />}
      </div>
    </div>
  );
}

export default Home;
