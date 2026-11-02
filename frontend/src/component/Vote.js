//투표 개수/투표 이름

import { useRef, useEffect, useState } from "react";
import axios from "axios";
import style from "../CSS/Vote.module.css";

import VoteNew from "./VoteNew";
import VoteDetail from "./VoteDetail";

import edit from "../asset/icon-edit.png";
import bin from "../asset/icon-trashbin.png";
import addBtn from "../asset/icon-addBtn.png";
import voteCenterHoverbefore from "../asset/icon-emptyVoteHoverbefore.png";
import voteCenterHoverafter from "../asset/icon-emptyVoteHoverafter.png";

function Vote({ token, isHost, onChange, clickedAgendaId, socketVote, socketVoteOption, socketVoteResult, setSocketVoteId, clickedAgendaName }) {

    //[아이콘 호버]
    const [iconVote, setIconVote] = useState(false);

    //[투표리스트]
    const [votes, setVotes] = useState([]);
    //[투표 존제 여부]
    const [voteEmpty, setVoteEmpty] = useState(true);

    //[투표이름변경]
    const [Changed, setChanged] = useState(null);

    //[새로운 투표 (객체)]
    const [Voteobj, setVoteobj] = useState([]);

    //[모달]
    const [ModalId, setModalId] = useState(null);
    const ModalRef = useRef(null);
    const inputRef = useRef(null);

    //[새로만들기 모달]
    const [Newvote, setNewvote] = useState(false);
    //투표 상세페이지
    const [Detail, setDetail] = useState(false);
    const [DetailId, setDetailId] = useState(null);
    const [DetailName, setDetailName] = useState(null);

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

    //[투표list]
    useEffect(() => {
        if (clickedAgendaId === null || token === null) return;
        axios
            .get(`${process.env.REACT_APP_HOST_URL}/vote/${clickedAgendaId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setVotes(res.data);
                    if (res.data.length === 0) {
                        setVoteEmpty(true);
                    } else {
                        setVoteEmpty(false);
                    }
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }, [socketVote,token,clickedAgendaId]);
    function addVote() {
        axios
            .post(`${process.env.REACT_APP_HOST_URL}/vote/${clickedAgendaId}`,
                {
                    title: "찬반투표",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                setVoteobj(res.data);
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    function handleOption(e, id) {
        setModalId(id);
        e.stopPropagation();
    }
    function deleteVote(voteId) {
        axios
            .delete(
                `${process.env.REACT_APP_HOST_URL}/vote/${voteId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .catch((error) => {
                console.error("실패:", error);
            });
    }

    function EditVote(e, id) {
        if (e.key === "Enter") {
            axios
                .patch(`${process.env.REACT_APP_HOST_URL}/vote/${id}`, {
                    title: e.target.value,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .catch((error) => {
                    console.error("실패:", error);
                });
            setChanged(null);
        }

    }

    function openDetail(id) {
        setSocketVoteId(id);
        setDetailId(id);
        setDetail(true);
    }
    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <h3>투표</h3>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>

            {voteEmpty ?
                <>
                    <div className={style.Novote}>
                        <label htmlFor="Newfile">
                            <div
                                className={style.Novotediv}
                                onMouseEnter={() => setIconVote(true)}
                                onMouseLeave={() => setIconVote(false)}
                                onClick={() => {
                                    isHost && setNewvote(true);
                                    isHost && addVote();
                                }}>
                                <img alt="Voteicon" src={iconVote ? voteCenterHoverafter : voteCenterHoverbefore} />
                                <h3>투표를 추가해 주세요</h3>
                            </div>
                        </label>
                    </div>
                </>
                :
                <>
                    <div className={style.Subdiv}>
                        <div className={style.Subtitle}>
                            <h3>{clickedAgendaName}</h3>
                            {isHost && <img
                                alt="addBtn"
                                src={addBtn}
                                onClick={() => {
                                    setNewvote(true);
                                    addVote();
                                }} />}
                        </div>
                        <div className={style.Votelist}>
                            {votes.map((vote) => (
                                <div className={style.Vote} id={vote.voteId} key={vote.voteId} onClick={(e) => { setDetailName(vote.title); openDetail(vote.voteId); }}>
                                    <div className={style.VoteText} onDoubleClick={() => setChanged(vote.voteId)}>
                                        {Changed === vote.voteId ? <input id="newVoteName" ref={inputRef} onKeyDown={(e) => EditVote(e, vote.voteId)} placeholder={vote.title} /> : <h1>{vote.title}</h1>}
                                        <span>{vote.number}</span>
                                    </div>
                                    {isHost && <h3
                                        className={style.option}
                                        alt="option"
                                        onClick={(e) => handleOption(e, vote.voteId)}>⋮</h3>}
                                    {ModalId === vote.voteId &&
                                        <div key={vote.voteId} className={style.Modal} ref={ModalRef}>
                                            <div className={style.Options}>
                                                <div className={style.Edit} onClick={(e) => {

                                                    setChanged(vote.voteId);
                                                    setModalId(null);
                                                    e.stopPropagation();
                                                }}>
                                                    <img alt="edit" src={edit} />
                                                    이름 변경
                                                </div>
                                                <div className={style.Dlt} id={vote.voteId} onClick={(e) => {

                                                    deleteVote(vote.voteId);
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

            {
                Newvote === true && isHost &&
                <VoteNew
                    token={token}
                    setNewvote={setNewvote}
                    Voteobj={Voteobj}
                />
            }
            {
                Detail === true &&
                <VoteDetail
                    //웹소켓 욥션
                    socketVoteOption={socketVoteOption}
                    socketVoteResult={socketVoteResult}
                    token={token}
                    isHost={isHost}
                    Newvote={Newvote}
                    DetailName={DetailName}
                    DetailId={DetailId}
                    setDetail={setDetail}
                />
            }
        </div >
    );
}
export default Vote;
