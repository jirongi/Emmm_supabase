import { useNavigate } from "react-router-dom";
import roomImg from "../asset/icon-meetingroom.png";
import roomHostImg from "../asset/icon-meetinghost.png";

// Progress·Archived 공용 방 카드
function RoomTile({ room, styles }) {
  const navigate = useNavigate();
  const isHost = room.role === "host";

  return (
    <div className={styles.room} onClick={() => navigate(`/meet/${room.id}`)}>
      <img
        className={isHost ? styles.roomHostImg : styles.roomImg}
        src={isHost ? roomHostImg : roomImg}
        alt={isHost ? "호스트룸" : "멤버룸"}
      />
      <div className={styles.roomName}>
        {room.name.length > 9 ? `${room.name.slice(0, 9)}...` : room.name}
      </div>
    </div>
  );
}

// 검색어로 거르고 host 방을 먼저 보여준다
export function sortAndFilterRooms(rooms, searchTerm) {
  const term = searchTerm.toLowerCase();
  return rooms
    .filter((room) => room.name.toLowerCase().includes(term))
    .sort((a, b) => (a.role === b.role ? 0 : a.role === "host" ? -1 : 1));
}

export default RoomTile;
