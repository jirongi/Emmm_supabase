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
import { notify } from "./Toast";

function Dm({ roomId, isHost }) {
    const queryClient = useQueryClient();
    const now = useNow(30000);

    const [EmojiModal, setEmojiModal] = useState(false);
    const [modalChat, setModalChat] = useState(false);
    const [input, setInput] = useState("");

    const ModalRef = useRef(null);
    const ChatRef = useRef(null);

    const { data: messages = [], isSuccess: messagesLoaded } = useQuery({
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

    // [host] 안 읽은 DM: 마지막으로 창을 열어 본 시각 이후에 온 메시지 (이 브라우저에만 저장)
    const seenKey = `dm-seen:${roomId}`;
    const [lastSeen, setLastSeen] = useState(() => {
        try { return Number(localStorage.getItem(seenKey)) || 0; } catch { return 0; }
    });
    const unread = isHost ? messages.filter((m) => new Date(m.created_at).getTime() > lastSeen).length : 0;

    useEffect(() => {
        if (!isHost || !modalChat || messages.length === 0) return;
        const latest = new Date(messages[messages.length - 1].created_at).getTime();
        if (latest <= lastSeen) return;
        setLastSeen(latest);
        try { localStorage.setItem(seenKey, String(latest)); } catch { /* 저장 못 해도 화면은 동작 */ }
    }, [isHost, modalChat, messages, lastSeen, seenKey]);

    // [host] 창이 닫혀 있을 때 새 DM이 오면 알림
    // 기준점은 목록을 실제로 받은 뒤에 잡는다. 받기 전의 빈 목록을 기준으로 삼으면
    // 그 뒤 도착한 기존 메시지가 전부 "새 DM"으로 보여, 읽은 DM까지 알림이 떴다.
    const knownIds = useRef(null);
    useEffect(() => {
        if (!messagesLoaded) return;
        const ids = new Set(messages.map((m) => m.id));
        if (knownIds.current && isHost && !modalChat) {
            const fresh = messages.filter((m) =>
                !knownIds.current.has(m.id) && new Date(m.created_at).getTime() > lastSeen);
            fresh.forEach((m) => notify(`새 DM · ${m.content}`, { icon: "💬", onClick: () => setModalChat(true) }));
        }
        knownIds.current = ids;
    }, [messages, messagesLoaded, isHost, modalChat, lastSeen]);

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
        <div className={style.DM}>
            {EmojiModal &&
                <div ref={ModalRef} className={style.EmojiModal}>
                    <EmojiPicker onEmojiClick={(emojiObject) => setInput((prev) => prev + emojiObject.emoji)} />
                </div>
            }
            <div className={style.DMdiv} onClick={() => setModalChat(true)}>
                <img alt="DM" src={DM} />
                {unread > 0 && !modalChat && <span key={unread} className={style.Badge}>{unread > 99 ? "99+" : unread}</span>}
            </div>
            {/* 창은 버튼(DMdiv) 바깥에 둔다: 버튼의 누름 효과(작아짐)가 창까지 움직이면 × 클릭이 빗나가 창이 다시 열렸다 */}
            {modalChat && <div className={style.ModalChat} onClick={(e) => e.stopPropagation()}>
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
    );
}
export default Dm;
