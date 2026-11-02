import { useState } from "react";
import styles from "../CSS/Progress.module.css";
import completeImg from "../asset/icon-complete.png";
import RoomTile, { sortAndFilterRooms } from "./RoomTile";

function Progress({ progressRoomList, onChange }) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div>
      <div className={styles.process}>
        <div>진행중인 회의</div>
        <input placeholder="🔍︎ 검색" onChange={(e) => setSearchTerm(e.target.value)}></input>
      </div>

      <div className={styles.rooms}>
        <div className={styles.archive} onClick={() => onChange(true)}>
          <img className={styles.completeImg} src={completeImg} alt="완료됨" />
          <div className={styles.complete}>완료됨</div>
        </div>
        {sortAndFilterRooms(progressRoomList, searchTerm).map((room) => (
          <RoomTile key={room.id} room={room} styles={styles} />
        ))}
      </div>
    </div>
  );
}

export default Progress;
