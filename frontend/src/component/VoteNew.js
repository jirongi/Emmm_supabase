import { useState } from "react";
import axios from "axios";
import style from '../CSS/Vote_new_modal.module.css';

function NewVote({ token, setNewvote, Voteobj }) {

    const [options, setOptions] = useState([]);

    function addOption() {
        axios
            .post(`${process.env.REACT_APP_HOST_URL}/vote/${Voteobj.vote.voteId}/option`,
                {
                    content: "옵션",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setOptions([...options, res.data]);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    function editOption(e) {
        axios
            .patch(`${process.env.REACT_APP_HOST_URL}/vote/${e.target.id}/option`,
                {
                    content: e.target.value,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setOptions(prev =>
                        prev.map(option =>
                            option.voteOption.voteOptionId === parseInt(e.target.id)
                                ? {
                                    ...option,
                                    voteOption: {
                                        ...option.voteOption,
                                        title: e.target.value,
                                    },
                                }
                                : option
                        )
                    );
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function deleteOption(target) {
        axios
            .delete(`${process.env.REACT_APP_HOST_URL}/vote/${target.id}/option`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setOptions(options.filter((option) => option.voteOption.voteOptionId !== parseInt(target.id)));
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function Create() {
        if (options.length < 2) {
            alert("투표를 생성하려면 옵션을 2개 이상 입력해주세요");
            return;
        }
        const newtitle = document.getElementById("newVoteName").value;
        axios
            .patch(`${process.env.REACT_APP_HOST_URL}/vote/${Voteobj.vote.voteId}`,
                {
                    title: newtitle,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setNewvote(false);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function DeleteandOut() {
        axios
            .delete(`${process.env.REACT_APP_HOST_URL}/vote/${Voteobj.vote.voteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setNewvote(false);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    return (
        <div className={style.NewVote}>
            <div className={style.Maintitle}>
                <h3>투표</h3>
                <h2 onClick={() => DeleteandOut()}>+</h2>
            </div>
            <div className={style.Subdiv}>
                <div className={style.Subtitle}>
                    <h3>투표 안건이름</h3>
                </div>

                <div className={style.Votelist}>
                    <div className={style.Vote}>
                        <div className={style.VoteText}>
                            <input id="newVoteName" placeholder="새로운 투표 안건을 입력하세요!" />
                        </div>
                    </div>

                    <div className={style.Subtitle}>
                        <h3>옵션</h3>
                    </div>

                    {options.map((option) => {
                        return (
                            <div id={option.voteOption.voteOptionId} key={option.voteOption.voteOptionId} className={style.Vote}>
                                <div className={style.VoteText}>
                                    <input id={option.voteOption.voteOptionId} placeholder="새로운 투표 안건을 입력하세요!" onBlur={(e) => editOption(e)} />
                                </div>
                                <h1 id={option.voteOption.voteOptionId} onClick={(e) => deleteOption(e.target)}>+</h1>
                            </div>
                        );
                    })}
                    <div className={style.Subsubtitle} onClick={() => addOption()}>
                        <h1>+</h1><h4>옵션 추가</h4>
                    </div>

                </div>
                <div className={style.Buttons}>
                    <button className={style.Cancel} onClick={() => DeleteandOut()}>취소하기</button>
                    <button className={style.Create} onClick={() => Create()}>생성하기</button>
                </div>
            </div>
        </div>
    );
}
export default NewVote;