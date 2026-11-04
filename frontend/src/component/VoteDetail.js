import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import style from "../CSS/Vote_detail_modal.module.css";

import hammer from "../asset/icon-hammer.png";
import {
    cancelVote, castVote, getMySelection, getOptions, getResults, getVote, updateVote,
} from "../api/votes";
import { errorMessage } from "../api/errors";
import { useVoteRealtime } from "../hooks/useRealtime";
import { avatarSrc } from "../lib/avatar";

// [host] 누가 투표했고 누가 아직인지
function Participation({ progress }) {
    if (!progress) return null;
    const { voted, notVoted, total } = progress;
    const person = (member, done) => (
        <div key={member.user_id} className={done ? style.PersonDone : style.PersonWait} title={done ? "투표함" : "아직 안 함"}>
            <img alt="" src={avatarSrc(member.profiles?.avatar_url)} />
            {member.profiles?.name}
        </div>
    );
    return (
        <div className={style.Participation}>
            <div className={style.ParticipationHead}>
                <b>투표 현황</b>
                <span>{voted.length}/{total}명 참여</span>
            </div>
            <div className={style.Bar}><div style={{ width: `${total ? (voted.length / total) * 100 : 0}%` }} /></div>
            <div className={style.People}>
                {voted.map((m) => person(m, true))}
                {notVoted.map((m) => person(m, false))}
            </div>
        </div>
    );
}

function VoteDetail({ isHost, userId, voteId, DetailName, onClose, progress }) {
    const queryClient = useQueryClient();
    useVoteRealtime(voteId);

    const { data: vote } = useQuery({ queryKey: ["vote", voteId], queryFn: () => getVote(voteId) });
    const { data: options = [] } = useQuery({ queryKey: ["options", voteId], queryFn: () => getOptions(voteId) });
    const { data: mySelection, isSuccess: selectionLoaded } = useQuery({
        queryKey: ["mySelection", voteId],
        queryFn: () => getMySelection(voteId, userId),
    });
    const result = vote?.status === "complete";
    const { data: results = [] } = useQuery({
        queryKey: ["results", voteId],
        queryFn: () => getResults(voteId),
        enabled: result,
    });

    //선택한 욥션 아이디
    const [ChosenOption, setChosenOption] = useState(null);
    //수정 중인지 (처음 투표하거나 "수정하기"를 누른 상태)
    const [Editting, setEditting] = useState(false);

    // 내 기존 선택을 불러오면 화면에 반영
    useEffect(() => {
        if (!selectionLoaded) return;
        setChosenOption(mySelection);
        setEditting(mySelection === null);
    }, [selectionLoaded, mySelection]);

    const hasVoted = mySelection !== null && mySelection !== undefined;
    const showBtn = Editting && ChosenOption !== null && ChosenOption !== mySelection;

    // 최다 득표 옵션들 (0표뿐이면 없음)
    const counts = Object.fromEntries(results.map((row) => [row.option_id, row.votes]));
    const maxVotes = Math.max(0, ...results.map((row) => row.votes));
    const Most = maxVotes > 0 ? results.filter((row) => row.votes === maxVotes).map((row) => row.option_id) : [];

    const refresh = () =>
        ["vote", "options", "mySelection", "results"].forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key, voteId] }),
        );

    async function run(task) {
        try {
            await task();
            refresh();
        } catch (error) {
            alert(errorMessage(error));
        }
    }

    const SubmitChoise = () => run(async () => {
        await castVote(voteId, ChosenOption);
        setEditting(false);
    });
    const CancelChoise = () => run(async () => {
        await cancelVote(voteId, userId);
        onClose();
    });
    const ChangeVoteState = () => run(() => updateVote(voteId, { status: "complete" }));

    return (
        (result ?
            <div className={style.NewVote}>
                <div className={style.Maintitle}>
                    <h3>투표</h3>
                    <h2 onClick={onClose}>+</h2>
                </div>
                <div className={style.Subdiv}>
                    <div className={style.Subtitle}>
                        <h3>{DetailName}</h3>
                    </div>

                    <div className={style.Votelist}>
                        {options.map((option) => (
                            <div key={option.id} className={Most.includes(option.id) ? style.ResultVote : style.Vote}>
                                <div className={style.VoteText}>
                                    <h6>{option.content}</h6><h5>{counts[option.id] ?? 0}명 투표</h5>
                                </div>
                                {Most.includes(option.id) && <img alt="resultHammer" className={style.resultHammer} src={hammer} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            :
            <div className={style.NewVote}>
                <div className={style.Maintitle}>
                    <h3>투표</h3>
                    <h2 onClick={onClose}>+</h2>
                </div>
                <div className={style.Subdiv}>
                    <div className={style.Subtitle}>
                        <h3>{DetailName}</h3>
                    </div>

                    {isHost && <Participation progress={progress} />}

                    <div className={style.Votelist}>
                        {options.map((option) => (
                            <div key={option.id} className={ChosenOption === option.id ? style.ChosenVote : style.Vote} onClick={() => Editting && setChosenOption(option.id)}>
                                <div className={style.VoteText}>
                                    <h6>{option.content}</h6>
                                </div>
                            </div>
                        ))}

                        <div className={style.Buttons}>
                            <button className={style.Cancel} onClick={() => (hasVoted ? CancelChoise() : onClose())}>
                                {hasVoted ? "취소하기" : "뒤로가기"}
                            </button>

                            <button
                                className={style.CreateEdit}
                                style={showBtn ? {} : { visibility: "hidden" }}
                                onClick={() => SubmitChoise()}
                            >{hasVoted ? "수정하기" : "선택하기"}</button>
                            {!Editting && hasVoted && <button className={style.BeforeEdit} onClick={() => setEditting(true)}>수정하기</button>}

                            {!Editting && isHost && hasVoted && <button
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
