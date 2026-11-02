import styles from "../CSS/Archive.module.css";
import backIcon from "../asset/icon-backArrow.png";
import { useState } from "react";
import RoomTile, { sortAndFilterRooms } from "./RoomTile";

function Archived({ onChange, completeRoomList }) {
  const [inAndOut, setInAndOut] = useState("MaindivIn");
  const [searchTerm, setSearchTerm] = useState("");

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
            <img className={styles.backIcon} src={backIcon} alt="뒤로가기" onClick={changeState} />
            <input placeholder="🔍︎ 검색" onChange={(e) => setSearchTerm(e.target.value)}></input>
          </div>

          <div className={styles.rooms}>
            {sortAndFilterRooms(completeRoomList, searchTerm).map((room) => (
              <RoomTile key={room.id} room={room} styles={styles} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Archived;
