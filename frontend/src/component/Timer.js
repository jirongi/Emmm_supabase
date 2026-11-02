import { useRef, useState, useEffect } from "react";
import axios from "axios";

import style from "../CSS/Timer.module.css";
import TimerWord from "../asset/icon-timer.png";
import TimerPlay from "../asset/icon-timer-play.png";
import TimerReset from "../asset/icon-timer-reset.png";
import TimerUpdown from "../asset/icon-timer-updown.png";
import TimerStop from "../asset/icon-timer-stop.png";

function Timer({ isHost, socketTimer, roomId, token }) {


    const [State, setState] = useState("stop");
    const [total, setTotal] = useState(0);
    const hour = Math.floor(total / 3600);
    const min = Math.floor((total % 3600) / 60);
    const sec = total % 60;
    const Time = useRef(null);

    useEffect(() => {
        if (token === null || roomId === null || isHost === null) return;
        axios
            .get(
                `${process.env.REACT_APP_HOST_URL}/timer/${roomId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
                setTotal(res.data.time); //시간 받고
                setState(res.data.state); //상태값 받기

                if (res.data.state !== "stop") {
                    Time.current = setInterval(() => { //1초식 줄어들기
                        setTotal(pre => {
                            if (pre === 1 || pre === 0) { //0초되면 멈추기
                                axios
                                    .patch(
                                        `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/status`,
                                        {
                                            state: "stop",
                                        },
                                        {
                                            headers: {
                                                Authorization: `Bearer ${token}`,
                                            },
                                        }
                                    )
                                    .then((res) => {
                                    })
                                    .catch((error) => {
                                        console.error("마이페이지 정보 가져오기 실패:", error);
                                    });
                                clearInterval(Time.current);
                                return 0;
                            }
                            return pre - 1
                        });
                    }, 1000);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });

        return () => {
            if (Time.current) {
                clearInterval(Time.current);
                Time.current = null;
            }
        };

    }, [socketTimer, roomId, token,isHost])

    //불러와서 작동하기

    function ChangeState() {
        if (total === 0) return;
        if (State === "stop") {
            axios
                .patch(
                    `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/status`,
                    {
                        state: "play",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                .then((res) => {
                })
                .catch((error) => {
                    console.error("마이페이지 정보 가져오기 실패:", error);
                });
        } else {
            axios
                .patch(
                    `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/status`,
                    {
                        state: "stop",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                .then((res) => {
                })
                .catch((error) => {
                    console.error("마이페이지 정보 가져오기 실패:", error);
                });
        }


    }

    function EditTime(e) {
        const time = total + parseInt(e.currentTarget.id) * 60;

        axios
            .patch(
                `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/time`,
                {
                    time: time,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    function Reset() {
        axios
            .patch(
                `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/time`,
                {
                    time: 0,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    function UponeMinutes() {
        const time = total + 60;
        axios
            .patch(
                `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/time`,
                {
                    time: time,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function DownoneMinutes() {
        if(total<1||total<0){
            return;
        }
        const time = total - 60;
        axios
            .patch(
                `${process.env.REACT_APP_HOST_URL}/timer/${roomId}/time`,
                {
                    time: time,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((res) => {
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    return (
        (isHost ?
            <div className={style.Maindiv}>
                <img className={style.TimerWord} alt="TimerWord" src={TimerWord} />
                <div className={style.margin}>
                    <div className={style.TImerBody}>
                        <h1>{hour.toString().padStart(2, "0")}:{min.toString().padStart(2, "0")}:{sec.toString().padStart(2, "0")}</h1>
                        <div className={style.UPandDOWN}>
                            <img alt="keyup" onClick={() => UponeMinutes()} src={TimerUpdown} />
                            <img alt="keydown" onClick={() => DownoneMinutes()} src={TimerUpdown} className={style.imgDown} />
                        </div>
                    </div>
                    <div className={style.Buttons}>
                        <button className={style.Play} onClick={() => ChangeState()}><img alt="stateBtn" id="stateBtn" src={State === "stop" ? TimerPlay : TimerStop} /></button>
                        <button className={style.Reset} onClick={() => Reset()}><img alt="reset" src={TimerReset} /></button>
                    </div>
                    <div className={style.ExtraButtons}>
                        <button id="3" onClick={(e) => EditTime(e)}>+ 3m</button>
                        <button id="5" onClick={(e) => EditTime(e)}>+ 5m</button>
                        <button id="10" onClick={(e) => EditTime(e)}>+ 10m</button>
                    </div>
                </div>
            </div>
            :
            <div className={style.Userdiv}>
                <img className={style.TimerWord} alt="TimerWord" src={TimerWord} />
                <div className={style.margin}>
                    <div className={style.TImerBody}>
                        <h1>{hour.toString().padStart(2, "0")}:{min.toString().padStart(2, "0")}:{sec.toString().padStart(2, "0")}</h1>
                    </div>
                </div>
            </div>
        )
    );
}
export default Timer;  