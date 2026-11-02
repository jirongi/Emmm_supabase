//ai요약본,gpt/제미나이api불러오기

import { useEffect, useState } from "react";
import axios from 'axios';
import style from "../CSS/UserState.module.css";

function UserState({ roomId, token, socketUser, socketVoteId }) {

    const [User, setUsers] = useState([]);

    useEffect(() => {
        if (!token || !roomId) return;
        axios
            .get(`${process.env.REACT_APP_HOST_URL}/room/${roomId}/online`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                setUsers(res.data);
            })
            .catch((error) => {
                console.error(error);
            })
    }, [roomId, token, socketUser])

    return (
        <div className={style.Userlist}>
            <div className={style.Host}>
                <h3>호스트</h3>
                {User
                    .filter((item) => item.online === true && item.role === "host")
                    .map((player) => {
                        return (
                            <div id={player.userId} key={player.userId} className={style.user}>
                                <img alt="icon" src={player.profileUrl} />
                                <h2>{player.name}</h2>
                            </div>
                        )

                    })
                }
            </div>
            <div className={style.Participants}>
                <h3>참여자(
                    {
                        User
                            .filter((item) => item.role !== "host" && item.online === true).length
                    })</h3>
                {User
                    .filter((item) => item.online === true && item.role !== "host")
                    .map((player) => {
                        return (
                            <div id={player.userId} key={player.userId} className={style.user}>
                                <img alt="icon" src={player.profileUrl} />
                                <h2>{player.name}</h2>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    );
}
export default UserState;
