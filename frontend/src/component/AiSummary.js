import ReactMarkdown from 'react-markdown'

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import style from "../CSS/AI.module.css";

import buttonHoverbefore from "../asset/icon-AIsummaryHoverbefore.png";
import buttonHoverafter from "../asset/icon-AIsummaryHoverafter.png";
import iconHoverbefore from "../asset/icon-emptyAIHoverbefore.png";
import iconHoverafter from "../asset/icon-emptyAIHoverafter.png";
import loading from "../asset/icon-loading.jpg";
import { generateSummary, getSummary } from "../api/ai";
import { timeAgo, useNow } from "../hooks/useNow";

function AI({ isHost, agendaId, onChange }) {
    const queryClient = useQueryClient();
    const now = useNow(30000);
    const [generating, setGenerating] = useState(false);
    const [iconAI, setIconAI] = useState(false); //아이콘 호버
    const [buttonAI, setButtonAI] = useState(false); //버튼 호버

    // 요약이 저장되면 실시간 이벤트로 다시 불러온다 (기존 1초 폴링 제거)
    const { data: summary } = useQuery({
        queryKey: ["summary", agendaId],
        queryFn: () => getSummary(agendaId),
    });

    async function generate() {
        if (!isHost) {
            alert("AI 요약은 호스트만 시작할 수 있어요.");
            return;
        }
        setGenerating(true);
        try {
            await generateSummary(agendaId);
            queryClient.invalidateQueries({ queryKey: ["summary", agendaId] });
        } catch {
            alert("AI 요약을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setGenerating(false);
        }
    }

    const isSummaried = !!summary || generating;

    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <div className={style.Left}>
                    <h3>AI 요약</h3>
                    {summary && isHost && !generating && <img onClick={() => generate()} alt="aisummaryBtn" src={buttonAI ? buttonHoverafter : buttonHoverbefore} onMouseEnter={() => setButtonAI(true)} onMouseLeave={() => setButtonAI(false)} />}
                </div>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>
            {isSummaried ?
                <div className={style.MarkdownBody}>
                    {summary && !generating ? <article className={style.Report}>
                        <header className={style.ReportHead}>
                            <span className={style.Chip}>✨ AI 회의 요약</span>
                            <h1>{summary.title}</h1>
                            <p>{timeAgo(summary.updated_at, now)} 업데이트</p>
                        </header>
                        <div className={style.Markdown}>
                            <ReactMarkdown>
                                {summary.summary_text}
                            </ReactMarkdown>
                        </div>
                    </article> :
                        <div className={style.Generating}>
                            <img alt="loading" className={style.Loading} src={loading} />
                            <p>회의 내용을 정리하고 있어요…</p>
                        </div>}
                </div> :
                <div className={style.NoAI}>
                    <div className={style.NoAIdiv} onClick={() => generate()} onMouseEnter={() => setIconAI(true)} onMouseLeave={() => setIconAI(false)}>
                        <img alt='aiIcon' src={iconAI ? iconHoverafter : iconHoverbefore} />
                        <h3>{isHost ? "여기 눌러서 AI 요약을 시작하세요" : "호스트가 AI 요약을 시작하면 여기에 보여요"}</h3>
                    </div>
                </div>
            }

        </div >
    );
}
export default AI;
