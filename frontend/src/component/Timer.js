import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import style from "../CSS/Timer.module.css";
import TimerWord from "../asset/icon-timer.png";
import TimerPlay from "../asset/icon-timer-play.png";
import TimerReset from "../asset/icon-timer-reset.png";
import TimerUpdown from "../asset/icon-timer-updown.png";
import TimerStop from "../asset/icon-timer-stop.png";
import { getTimer, remainingSeconds, updateTimer } from "../api/timer";
import { errorMessage } from "../api/errors";
import { useNow } from "../hooks/useNow";

function Timer({ isHost, roomId }) {
    const queryClient = useQueryClient();
    const { data: timer } = useQuery({
        queryKey: ["timer", roomId],
        queryFn: () => getTimer(roomId),
    });
    const now = useNow(500);

    const State = timer?.status ?? "stop";
    const total = remainingSeconds(timer, now);
    const hour = Math.floor(total / 3600);
    const min = Math.floor((total % 3600) / 60);
    const sec = total % 60;

    async function save(fields) {
        try {
            await updateTimer(roomId, fields);
            queryClient.invalidateQueries({ queryKey: ["timer", roomId] });
        } catch (error) {
            alert(errorMessage(error));
        }
    }

    // 0초가 되면 host 화면 한 곳만 정지 요청을 보낸다 (기존: 모든 사람이 각자 보냄)
    const stopping = useRef(false);
    useEffect(() => {
        if (!isHost || State !== "play" || total > 0) {
            stopping.current = false;
            return;
        }
        if (stopping.current) return;
        stopping.current = true;
        save({ status: "stop", remainingSec: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, State, total]);

    function ChangeState() {
        if (total === 0) return;
        if (State === "stop") save({ status: "play" });
        else save({ status: "stop", remainingSec: total });
    }

    const addSeconds = (seconds) => save({ remainingSec: Math.max(0, total + seconds) });
    const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

    return (
        (isHost ?
            <div className={style.Maindiv}>
                <img className={style.TimerWord} alt="TimerWord" src={TimerWord} />
                <div className={style.margin}>
                    <div className={style.TImerBody}>
                        <h1>{time}</h1>
                        <div className={style.UPandDOWN}>
                            <img alt="keyup" onClick={() => addSeconds(60)} src={TimerUpdown} />
                            <img alt="keydown" onClick={() => total > 0 && addSeconds(-60)} src={TimerUpdown} className={style.imgDown} />
                        </div>
                    </div>
                    <div className={style.Buttons}>
                        <button className={style.Play} onClick={() => ChangeState()}><img alt="stateBtn" src={State === "stop" ? TimerPlay : TimerStop} /></button>
                        <button className={style.Reset} onClick={() => save({ status: "stop", remainingSec: 0 })}><img alt="reset" src={TimerReset} /></button>
                    </div>
                    <div className={style.ExtraButtons}>
                        <button onClick={() => addSeconds(3 * 60)}>+ 3m</button>
                        <button onClick={() => addSeconds(5 * 60)}>+ 5m</button>
                        <button onClick={() => addSeconds(10 * 60)}>+ 10m</button>
                    </div>
                </div>
            </div>
            :
            <div className={style.Userdiv}>
                <img className={style.TimerWord} alt="TimerWord" src={TimerWord} />
                <div className={style.margin}>
                    <div className={style.TImerBody}>
                        <h1>{time}</h1>
                    </div>
                </div>
            </div>
        )
    );
}
export default Timer;
