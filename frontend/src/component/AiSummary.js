import ReactMarkdown from 'react-markdown'

import { useEffect, useState } from "react";
import axios from "axios";
import style from "../CSS/AI.module.css";

import buttonHoverbefore from "../asset/icon-AIsummaryHoverbefore.png";
import buttonHoverafter from "../asset/icon-AIsummaryHoverafter.png";
import iconHoverbefore from "../asset/icon-emptyAIHoverbefore.png";
import iconHoverafter from "../asset/icon-emptyAIHoverafter.png";
import loading from "../asset/icon-loading.jpg";

function AI({ isHost, token, onChange, clickedAgendaId, AIState, socketAI }) {
    const [summary, setSummary] = useState(null);
    const [title, setTitle] = useState(null);

    const [isSummaried, setIsSummaried] = useState(false); //요약 했었는지?
    const [iconAI, setIconAI] = useState(false); //아이콘 호버
    const [buttonAI, setButtonAI] = useState(false); //버튼 호버

    useEffect(() => {
        setIsSummaried(AIState);

        const interval = setInterval(() => {

            axios.get(`${process.env.REACT_APP_HOST_URL}/ai/${clickedAgendaId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((res) => {
                    if (res.data.title && res.data.summaryText) {
                        setTitle(res.data.title);
                        setSummary(res.data.summaryText);
                        clearInterval(interval);
                    }
                })
                .catch(() => {
                });

        }, 1000);

        return () => clearInterval(interval);

    }, [socketAI,clickedAgendaId,token,AIState]);

    function PostAI() {
        setTitle(null);
        setSummary(null);
        setIsSummaried(true);
        axios
            .post(`${process.env.REACT_APP_HOST_URL}/ai/${clickedAgendaId}`,
                {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    function PatchAI() {
        axios
            .patch(`${process.env.REACT_APP_HOST_URL}/ai/${clickedAgendaId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                if (res.status === 200 || res.status === 201) {
                    setTitle(res.data.title);
                    setSummary(res.data.summaryText);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }
    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <div className={style.Left}>
                    <h3>AI 요약</h3>
                    {isSummaried && isHost && <img onClick={() => PatchAI()} alt="aisummaryBtn" src={buttonAI ? buttonHoverafter : buttonHoverbefore} onMouseEnter={() => setButtonAI(true)} onMouseLeave={() => setButtonAI(false)} />}
                </div>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>
            {isSummaried ?
                <div className={style.MarkdownBody}>
                    {title !== null && summary !== null ? <>
                        <h5>{title}</h5>
                        <ReactMarkdown>
                            {summary}
                        </ReactMarkdown>
                    </> :
                        <img alt="loading" className={style.Loading} src={loading} />}
                </div> :
                <div className={style.NoAI}>
                    <div className={style.NoAIdiv} onClick={() => { PostAI(); }} onMouseEnter={() => setIconAI(true)} onMouseLeave={() => setIconAI(false)}>
                        <img alt='aiIcon' src={iconAI ? iconHoverafter : iconHoverbefore} />
                        <h3>여기 눌러서 AI 요약을 시작하세요</h3>
                    </div>
                </div>
            }

        </div >
    );
}
export default AI;


