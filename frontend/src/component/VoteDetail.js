import { useEffect, useState } from "react";
import axios from "axios";
import style from "../CSS/Vote_detail_modal.module.css";

import hammer from "../asset/icon-hammer.png";

function VoteDetail({ token, isHost, setDetail, DetailId, DetailName, Newvote, socketVoteOption, socketVoteResult }) {

    //욥션들
    const [options, setOptions] = useState([]);

    //선택한 욥션 아이디
    const [ChosenOption, setChosenOption] = useState(null);
    const [showBtn, setShowBtn] = useState(false);

    //결과상태값
    const [result, setResult] = useState(false);

    //1등 항목들
    const [Most, setMost] = useState([]);

    //제출한적있으면edit
    const [Edit, setEdit] = useState(false);
    const [Editting, setEditting] = useState(true);

    useEffect(() => {
        if(DetailId===null||token===null)return;
        //투표 상태확인
        axios
            .get(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/voteStatus`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    if (res.data.status !== "running") setResult(true);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }, [Newvote, DetailId, socketVoteResult,token,])

    useEffect(() => {
        //투표 옵션가져오기 (나의 선택포함)
        axios
            .get(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/option`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setOptions(res.data.voteOptions);
                    if (res.data.voteSelection === null) {
                        setEdit(false);
                    } else {
                        setEditting(false);
                        setEdit(true);
                        setChosenOption(res.data.voteSelection.voteOptionId);
                    }
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }, [socketVoteOption,socketVoteResult,token,DetailId])

    useEffect(() => {
        if (result === false) {
            return;
        }
        axios
            .get(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/result`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    const HighCount = Math.max(...res.data.map(item => item.selectCount));
                    const HighCounts = res.data.filter(item => item.selectCount === HighCount);
                    const format = HighCounts.map(item => ({
                        id: item.voteOptionId,
                    }));
                    setMost(format);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }, [result,socketVoteResult,DetailId,token])

    function handleOptionBlock(id) {
        setChosenOption(parseInt(id));
        setShowBtn(true);
    }
    function SubmitChoise() {
        axios
            .post(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/voteSelect`,
                {
                    voteOptionId: ChosenOption,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },)
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setEdit(true);
                    setShowBtn(false);
                    setEditting(false);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function CancelChoise() {
        axios
            .delete(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/voteSelect`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },)
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setDetail(false);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function EditChoise() {
        axios
            .patch(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/voteSelect`,
                {
                    voteOptionId: ChosenOption,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },)
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setEdit(true);
                    setShowBtn(false);
                    setEditting(false);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function HandleEdit() {
        setEditting(true);
    }
    function ChangeVoteState() {
        axios
            .patch(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/voteStatus`,
                {
                    status: "confirm",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setResult(true);
                    axios
                        .get(`${process.env.REACT_APP_HOST_URL}/vote/${DetailId}/result`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        })
                        .catch((error) => {
                            console.error("마이페이지 정보 가져오기 실패:", error);
                        });
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    return (
        (result ?
            <div className={style.NewVote}>
                <div className={style.Maintitle}>
                    <h3>투표</h3>
                    <h2 onClick={() => setDetail(false)}>+</h2>
                </div>
                <div className={style.Subdiv}>
                    <div className={style.Subtitle}>
                        <h3>{DetailName}</h3>
                    </div>

                    <div className={style.Votelist}>
                        {options.map((option) => {
                            return (
                                <div id={option.voteOptionId} key={option.voteOptionId} className={Most.map(item => item.id).includes(option.voteOptionId) ? style.ResultVote : style.Vote} onClick={(e) => handleOptionBlock(option.voteOptionId)}>
                                    <div className={style.VoteText}>
                                        <h6>{option.content}</h6><h5>{option.selectCount}명 투표</h5>
                                    </div>
                                    {Most.map(item => item.id).includes(option.voteOptionId) && <img alt="resultHammer" className={style.resultHammer} src={hammer} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            :
            <div className={style.NewVote}>
                <div className={style.Maintitle}>
                    <h3>투표</h3>
                    <h2 onClick={() => setDetail(false)}>+</h2>
                </div>
                <div className={style.Subdiv}>
                    <div className={style.Subtitle}>
                        <h3>{DetailName}</h3>
                    </div>

                    <div className={style.Votelist}>
                        {options.map((option) => {
                            return (
                                <div id={option.voteOptionId} key={option.voteOptionId} className={ChosenOption === option.voteOptionId ? style.ChosenVote : style.Vote} onClick={(e) => Editting === true && handleOptionBlock(option.voteOptionId)}>
                                    <div className={style.VoteText}>
                                        <h6>{option.content}</h6>
                                    </div>
                                </div>
                            );
                        })}


                        <div className={style.Buttons}>
                            <button className={style.Cancel} onClick={() =>
                                Edit === true ? CancelChoise() : setDetail(false)
                            }>{Edit === true ? "취소하기" : "뒤로가기"}</button>

                            <button className={style.CreateEdit}
                                style={
                                    //수정 하고 싶으면 
                                    Editting === true ?
                                        //선택을 하면 
                                        showBtn === true ?
                                            //선택을 한적 있으면 
                                            Edit === true ?
                                                {}
                                                :
                                                {}

                                            : { visibility: "hidden" }
                                        : { visibility: "hidden" }
                                }
                                onClick={() =>
                                    Edit === true ?
                                        EditChoise()
                                        :
                                        SubmitChoise()
                                }
                            >{Edit === true ? "수정하기" : "선택하기"}</button>
                            {Editting === false && Edit === true && <button className={style.BeforeEdit} onClick={() => HandleEdit()}>수정하기</button>}

                            {Editting === false && isHost === true && Edit === true && <button
                                onClick={() => ChangeVoteState()}
                                className={style.FinishVote}
                            >확정하기</button>}
                        </div>
                    </div>
                </div>
            </div >
        )
    );
}
export default VoteDetail;