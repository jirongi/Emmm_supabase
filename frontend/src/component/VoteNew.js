import { useState } from "react";
import style from '../CSS/Vote_new_modal.module.css';
import { createVote } from "../api/votes";
import { errorMessage } from "../api/errors";

// 제목과 옵션을 화면에서 모아 두었다가 "생성하기"에서 한 번에 저장한다.
// (기존: 모달을 열기만 해도 서버에 빈 투표가 생기던 문제)
function NewVote({ agendaId, onClose, onCreated }) {
    const [title, setTitle] = useState("");
    // { key, content } — key는 화면용 임시 번호
    const [options, setOptions] = useState([]);
    const [nextKey, setNextKey] = useState(1);
    const [saving, setSaving] = useState(false);

    function addOption() {
        setOptions((prev) => [...prev, { key: nextKey, content: "" }]);
        setNextKey((k) => k + 1);
    }

    function editOption(key, content) {
        setOptions((prev) => prev.map((option) => (option.key === key ? { ...option, content } : option)));
    }

    function deleteOption(key) {
        setOptions((prev) => prev.filter((option) => option.key !== key));
    }

    async function Create() {
        const contents = options.map((option) => option.content.trim()).filter(Boolean);
        if (!title.trim()) {
            alert("투표 안건 이름을 입력해주세요");
            return;
        }
        if (contents.length < 2) {
            alert("투표를 생성하려면 옵션을 2개 이상 입력해주세요");
            return;
        }
        setSaving(true);
        try {
            await createVote(agendaId, title.trim(), contents);
            onCreated();
            onClose();
        } catch (error) {
            alert(errorMessage(error));
            setSaving(false);
        }
    }

    return (
        <div className={style.NewVote}>
            <div className={style.Maintitle}>
                <h3>투표</h3>
                <h2 onClick={onClose}>+</h2>
            </div>
            <div className={style.Subdiv}>
                <div className={style.Subtitle}>
                    <h3>투표 안건이름</h3>
                </div>

                <div className={style.Votelist}>
                    <div className={style.Vote}>
                        <div className={style.VoteText}>
                            <input
                                placeholder="새로운 투표 안건을 입력하세요!"
                                maxLength={100}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={style.Subtitle}>
                        <h3>옵션</h3>
                    </div>

                    {options.map((option) => (
                        <div key={option.key} className={style.Vote}>
                            <div className={style.VoteText}>
                                <input
                                    placeholder="옵션 내용을 입력하세요!"
                                    maxLength={100}
                                    value={option.content}
                                    onChange={(e) => editOption(option.key, e.target.value)}
                                />
                            </div>
                            <h1 onClick={() => deleteOption(option.key)}>+</h1>
                        </div>
                    ))}
                    <div className={style.Subsubtitle} onClick={addOption}>
                        <h1>+</h1><h4>옵션 추가</h4>
                    </div>

                </div>
                <div className={style.Buttons}>
                    <button className={style.Cancel} onClick={onClose}>취소하기</button>
                    <button className={style.Create} disabled={saving} onClick={() => Create()}>생성하기</button>
                </div>
            </div>
        </div>
    );
}
export default NewVote;
