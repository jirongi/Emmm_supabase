import { useQuery } from "@tanstack/react-query";
import style from "../CSS/UserState.module.css";
import { getMembers } from "../api/rooms";

// 접속자 = 방 멤버 중 Presence에 들어와 있는 사람
function UserState({ roomId, onlineIds }) {
    const { data: members = [] } = useQuery({
        queryKey: ["members", roomId],
        queryFn: () => getMembers(roomId),
    });
    const online = members.filter((member) => onlineIds.includes(member.user_id));
    const hosts = online.filter((member) => member.role === "host");
    const participants = online.filter((member) => member.role !== "host");

    const renderUser = (member) => (
        <div key={member.user_id} className={style.user}>
            <img alt="icon" src={member.profiles?.avatar_url} />
            <h2>{member.profiles?.name}</h2>
        </div>
    );

    return (
        <div className={style.Userlist}>
            <div className={style.Host}>
                <h3>호스트</h3>
                {hosts.map(renderUser)}
            </div>
            <div className={style.Participants}>
                <h3>참여자({participants.length})</h3>
                {participants.map(renderUser)}
            </div>
        </div>
    );
}
export default UserState;
