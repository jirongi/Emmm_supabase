import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmojiPicker from 'emoji-picker-react';

import style from "../CSS/DM.module.css";

import send from "../asset/icon-send.png";
import emoji from "../asset/icon-emoji.png";
import DM from "../asset/icon-DM.png";
import { getDms, sendDm } from "../api/dm";
import { errorMessage } from "../api/errors";
import { timeAgo, useNow } from "../hooks/useNow";

function Dm({ roomId, isHost }) {
    const queryClient = useQueryClient();
    const now = useNow(30000);

    const [EmojiModal, setEmojiModal] = useState(false);
    const [modalChat, setModalChat] = useState(false);
    const [input, setInput] = useState("");

    const ModalRef = useRef(null);
    const ChatRef = useRef(null);

    const { data: messages = [] } = useQuery({
        queryKey: ["dms", roomId],
        queryFn: () => getDms(roomId),
    });

    useEffect(() => {
        function HandClickoutsideofModal(e) {
            if (ModalRef.current && !ModalRef.current.contains(e.target)) {
                setEmojiModal(false);
            }
        }
        document.addEventListener("mousedown", HandClickoutsideofModal);

        return () => {
            document.removeEventListener("mousedown", HandClickoutsideofModal);
        }
    }, [EmojiModal]);

    useEffect(() => {
        if (ChatRef.current) {
            ChatRef.current.scrollTop = ChatRef.current.scrollHeight;
        }
    }, [messages, modalChat])

    async function sendMessage(content) {
        const text = content.trim();
        if (!text) return;
        try {
            await sendDm(roomId, text);
            queryClient.invalidateQueries({ queryKey: ["dms", roomId] });
            return true;
        } catch (error) {
            alert(errorMessage(error));
            return false;
        }
    }

    async function sendInput() {
        const content = input;
        // 보내는 즉시 비우고, 실패하면 되돌린다 (저장 후에 비우면 그사이 입력한 내용이 지워짐)
        setInput("");
        if (!(await sendMessage(content))) setInput(content);
    }

    return (
        <div className={style.DM} onClick={() => setModalChat(true)}>
            {EmojiModal &&
                <div ref={ModalRef} className={style.EmojiModal}>
                    <EmojiPicker onEmojiClick={(emojiObject) => setInput((prev) => prev + emojiObject.emoji)} />
                </div>
            }
            <div className={style.DMdiv}>
                <img alt="DM" src={DM} />
                {modalChat && <div className={style.ModalChat}>
                    <div className={style.Top}>
                        <h3>{isHost ? "받은 메세지" : "To.호스트"}</h3>
                        <p onClick={(e) => {
                            e.stopPropagation();
                            setModalChat(false);
                        }}>+</p>
                    </div>
                    <hr />
                    <div ref={ChatRef} className={style.ChatList}>
                        {messages.map((message) => (
                            isHost ?
                                <div key={message.id} className={style.HostTextBox}>
                                    <div className={style.Text}>{message.content}</div>
                                    {timeAgo(message.created_at, now)}
                                </div>
                                :
                                <div key={message.id} className={style.TextBox}>
                                    {timeAgo(message.created_at, now)}
                                    <div className={style.Text}>{message.content}</div>
                                </div>
                        ))}

                    </div>
                    {!isHost && <div className={style.Bottom}>
                        <div className={style.Buttons}>
                            <button onClick={(e) => sendMessage(e.currentTarget.innerText)}>천천히해주세요...</button>
                            <button onClick={(e) => sendMessage(e.currentTarget.innerText)}>5분만쉬어요</button>
                            <button onClick={(e) => sendMessage(e.currentTarget.innerText)}>힘들어요</button>
                        </div>
                        <div className={style.Inputdiv}>
                            <img alt="emoji" className={style.Emoji} src={emoji} onClick={() => setEmojiModal(true)} />
                            <input
                                value={input}
                                maxLength={1000}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        sendInput();
                                    }
                                }} />
                            <img alt="send" className={style.Send} src={send} onClick={() => sendInput()} />
                        </div>
                    </div>}
                </div>}
            </div>
        </div>
    );
}
export default Dm;
