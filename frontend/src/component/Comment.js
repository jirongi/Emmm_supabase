
//채팅방  룸+채팅방

//룸에 있는 안건에 있는 파일 불러오기+ 확대
import axios from "axios";
import { useEffect, useState } from "react";
import style from "../CSS/Comment.module.css";

function Comment({ now, token, clickedAgendaId, onChange, socketComment,setSocketComment }) {

    const [comments, setComments] = useState([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        if(!clickedAgendaId||!token)return;
        axios
            .get(`${process.env.REACT_APP_HOST_URL}/comment/${clickedAgendaId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setComments(res.data.reverse());
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }, [socketComment,clickedAgendaId,token])

    function commentWrite() {
        setSocketComment(Math.random());
        if (input === null || input === "") {
            return;
        }
        axios
            .post(`${process.env.REACT_APP_HOST_URL}/comment/${clickedAgendaId}`,
                {
                    content: input,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then(() => {
                setInput("");
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    function handleFormat(amount) {
        if (amount < 60) return "1분미만";
        if (amount < 3600) return `${Math.floor(amount / 60)}분 전`;
        if (amount < 86400) return `${Math.floor(amount / 3600)}시간 전`;
        return `${Math.floor(amount / 86400)}일 전`;
    }
    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <h3>코멘트</h3>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>
            <div className={style.Subdiv}>

                <div className={style.Subtitle}>
                    {/* <h3>코멘트</h3>
                    <div className={style.number}>13</div> */}
                </div>

                <form>
                    <label>
                        <textarea
                            placeholder="여기에 의견 남겨주세요"
                            id="input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); commentWrite(); }
                            }}
                        />
                        <button onClick={(e) => {
                            e.preventDefault();
                            commentWrite();
                        }}>보내기</button>
                    </label>
                </form>

                <div className={style.Chat}>
                    {comments.map((comment) => {
                        //1000ms=1s 초단위
                        const diff = Math.floor((now - new Date(comment.createdAt).getTime()) / 1000);
                        return (
                            <div key={comment.commentId} id={comment.commentId} className={style.Chatbox}>
                                <hr />
                                <p>
                                    <span>{handleFormat(diff)}</span><br />
                                    {comment.content}
                                </p>
                            </div>
                        )
                    })}
                </div>

            </div>
        </div >
    );
}
export default Comment;
