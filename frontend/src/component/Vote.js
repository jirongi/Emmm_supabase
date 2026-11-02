//투표 개수/투표 이름

import { useRef, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import style from "../CSS/Vote.module.css";

import VoteNew from "./VoteNew";
import VoteDetail from "./VoteDetail";

import edit from "../asset/icon-edit.png";
import bin from "../asset/icon-trashbin.png";
import addBtn from "../asset/icon-addBtn.png";
import voteCenterHoverbefore from "../asset/icon-emptyVoteHoverbefore.png";
import voteCenterHoverafter from "../asset/icon-emptyVoteHoverafter.png";
import { deleteVote, getVotes, updateVote } from "../api/votes";
import { errorMessage } from "../api/errors";

function Vote({ isHost, userId, onChange, agendaId, clickedAgendaName }) {
    const queryClient = useQueryClient();

    //[아이콘 호버]
    const [iconVote, setIconVote] = useState(false);

    //[투표이름변경]
    const [Changed, setChanged] = useState(null);

    //[모달]
    const [ModalId, setModalId] = useState(null);
    const ModalRef = useRef(null);
    const inputRef = useRef(null);

    //[새로만들기 모달]
    const [Newvote, setNewvote] = useState(false);
    //투표 상세페이지 { id, title }
    const [detail, setDetail] = useState(null);

    //[모달외부인식]
    useEffect(() => {
        function HandClickoutsideofModal(e) {
            if (ModalRef.current && !ModalRef.current.contains(e.target)) {
                setModalId(null);
            }
            if (inputRef.current && !inputRef.current.contains(e.target)) {
                setChanged(null);
            }
        }
        document.addEventListener("mousedown", HandClickoutsideofModal);

        return () => {
            document.removeEventListener("mousedown", HandClickoutsideofModal);
        }
    }, [ModalId, inputRef]);

    const { data: votes = [] } = useQuery({
        queryKey: ["votes", agendaId],
        queryFn: () => getVotes(agendaId),
    });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["votes", agendaId] });

    function handleOption(e, id) {
        setModalId(id);
        e.stopPropagation();
    }

    async function handleDelete(voteId) {
        try {
            await deleteVote(voteId);
            refresh();
        } catch (error) {
            alert(errorMessage(error));
        }
    }

    async function EditVote(e, id) {
        if (e.key !== "Enter") return;
        const title = e.target.value.trim();
        setChanged(null);
        if (!title) return;
        try {
            await updateVote(id, { title });
            refresh();
        } catch (error) {
            alert(errorMessage(error));
        }
    }

    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <h3>투표</h3>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>

            {votes.length === 0 ?
                <>
                    <div className={style.Novote}>
                        <div
                            className={style.Novotediv}
                            onMouseEnter={() => setIconVote(true)}
                            onMouseLeave={() => setIconVote(false)}
                            onClick={() => isHost && setNewvote(true)}>
                            <img alt="Voteicon" src={iconVote ? voteCenterHoverafter : voteCenterHoverbefore} />
                            <h3>{isHost ? "투표를 추가해 주세요" : "아직 투표가 없어요"}</h3>
                        </div>
                    </div>
                </>
                :
                <>
                    <div className={style.Subdiv}>
                        <div className={style.Subtitle}>
                            <h3>{clickedAgendaName}</h3>
                            {isHost && <img alt="addBtn" src={addBtn} onClick={() => setNewvote(true)} />}
                        </div>
                        <div className={style.Votelist}>
                            {votes.map((vote) => (
                                <div className={style.Vote} key={vote.id} onClick={() => setDetail({ id: vote.id, title: vote.title })}>
                                    <div className={style.VoteText} onDoubleClick={() => isHost && setChanged(vote.id)}>
                                        {Changed === vote.id
                                            ? <input ref={inputRef} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => EditVote(e, vote.id)} placeholder={vote.title} />
                                            : <h1>{vote.title}</h1>}
                                        <span>{vote.status === "complete" ? "마감" : ""}</span>
                                    </div>
                                    {isHost && <h3
                                        className={style.option}
                                        alt="option"
                                        onClick={(e) => handleOption(e, vote.id)}>⋮</h3>}
                                    {ModalId === vote.id &&
                                        <div className={style.Modal} ref={ModalRef}>
                                            <div className={style.Options}>
                                                <div className={style.Edit} onClick={(e) => {
                                                    setChanged(vote.id);
                                                    setModalId(null);
                                                    e.stopPropagation();
                                                }}>
                                                    <img alt="edit" src={edit} />
                                                    이름 변경
                                                </div>
                                                <div className={style.Dlt} onClick={(e) => {
                                                    handleDelete(vote.id);
                                                    setModalId(null);
                                                    e.stopPropagation();
                                                }}>
                                                    <img alt="bin" src={bin} />
                                                    삭제
                                                </div>
                                            </div>
                                        </div>}
                                </div>
                            ))}

                        </div>
                    </div>
                </>}

            {Newvote && isHost &&
                <VoteNew
                    agendaId={agendaId}
                    onClose={() => setNewvote(false)}
                    onCreated={refresh}
                />
            }
            {detail &&
                <VoteDetail
                    isHost={isHost}
                    userId={userId}
                    voteId={detail.id}
                    DetailName={detail.title}
                    onClose={() => setDetail(null)}
                />
            }
        </div >
    );
}
export default Vote;
