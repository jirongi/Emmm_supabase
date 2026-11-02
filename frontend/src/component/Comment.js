//안건 코멘트
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import style from "../CSS/Comment.module.css";
import { addComment, getComments } from "../api/comments";
import { errorMessage } from "../api/errors";
import { timeAgo, useNow } from "../hooks/useNow";

function Comment({ agendaId, onChange }) {
    const queryClient = useQueryClient();
    const now = useNow(30000);
    const [input, setInput] = useState("");

    const { data: comments = [] } = useQuery({
        queryKey: ["comments", agendaId],
        queryFn: () => getComments(agendaId),
    });

    async function commentWrite() {
        const content = input.trim();
        if (!content) return;
        // 보내는 즉시 비운다. 저장이 끝난 뒤에 비우면 그사이 새로 쓴 내용까지 지워진다.
        setInput("");
        try {
            await addComment(agendaId, content);
            queryClient.invalidateQueries({ queryKey: ["comments", agendaId] });
        } catch (error) {
            setInput(content);
            alert(errorMessage(error));
        }
    }

    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <h3>코멘트</h3>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>
            <div className={style.Subdiv}>

                <div className={style.Subtitle}></div>

                <form>
                    <label>
                        <textarea
                            placeholder="여기에 의견 남겨주세요"
                            value={input}
                            maxLength={1000}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); commentWrite(); }
                            }}
                        />
                        <button onClick={(e) => {
                            e.preventDefault();
                            commentWrite();
                        }}>보내기</button>
                    </label>
                </form>

                <div className={style.Chat}>
                    {comments.map((comment) => (
                        <div key={comment.id} className={style.Chatbox}>
                            <hr />
                            <p>
                                <span>{timeAgo(comment.created_at, now)}</span><br />
                                {comment.content}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </div >
    );
}
export default Comment;
