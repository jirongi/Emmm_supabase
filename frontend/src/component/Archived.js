import styles from "../CSS/Archive.module.css";
import backIcon from "../asset/icon-backArrow.png";
import roomImg from "../asset/icon-meetingroom.png";
import roomHostImg from "../asset/icon-meetinghost.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Archived({ onChange, isOpen, completeRoomList }) {
  const navigate = useNavigate();
  const [inAndOut, setInAndOut] = useState("MaindivIn");

  const [searchTerm, setSearchTerm] = useState("");

  function getRoomId(e) {
    localStorage.setItem("roomId", e.currentTarget.id);
    navigate("/meet");
  }

  function changeState() {
    setInAndOut("MaindivOut");
    setTimeout(function () {
      onChange(false);
    }, 200);
  }

  return (
    <div>
      <div className={styles.extradiv}>
        <div className={styles[inAndOut]}>
          <div className={styles.archiveHeader}>
            <img
              className={styles.backIcon}
              src={backIcon}
              alt="뒤로가기"
              onClick={changeState}
            />
            <input
              placeholder="🔍︎ 검색"
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            ></input>
          </div>

          <div className={styles.rooms}>
            {completeRoomList
              .filter((completeRoomList) => {
                if (searchTerm === "") {
                  return completeRoomList;
                } else if (
                  completeRoomList.roomName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                ) {
                  return completeRoomList;
                }
              })
              .map((completeRoomList) => {
                if (completeRoomList.role === "host") {
                  return (
                    <div
                      id={completeRoomList.roomId}
                      key={completeRoomList.roomId}
                      className={styles.room}
                      onClick={(e) => getRoomId(e)}
                    >
                      <img
                        className={styles.roomHostImg}
                        src={roomHostImg}
                        alt="호스트룸"
                      />

                      <div className={styles.roomName}>
                        {completeRoomList.roomName.length > 9
                          ? `${completeRoomList.roomName.slice(0, 9)}...`
                          : completeRoomList.roomName}
                      </div>
                    </div>
                  );
                }
              })}
            {completeRoomList
              .filter((completeRoomList) => {
                if (searchTerm === "") {
                  return completeRoomList;
                } else if (
                  completeRoomList.roomName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                ) {
                  return completeRoomList;
                }
              })
              .map((completeRoomList) => {
                if (completeRoomList.role === "member") {
                  return (
                    <div
                      id={completeRoomList.roomId}
                      key={completeRoomList.roomId}
                      className={styles.room}
                      onClick={(e) => getRoomId(e)}
                    >
                      <img
                        className={styles.roomImg}
                        src={roomImg}
                        alt="멤버룸"
                      />

                      <div className={styles.roomName}>
                        {completeRoomList.roomName.length > 9
                          ? `${completeRoomList.roomName.slice(0, 9)}...`
                          : completeRoomList.roomName}
                      </div>
                    </div>
                  );
                }
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Archived;
