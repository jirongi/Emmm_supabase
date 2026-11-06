import { useState } from "react";
import { useNavigate } from "react-router-dom";

import style from "../CSS/CreateRoom.module.css";
//icon imgs
import visible from "../asset/icon-visible.png";
import tip from "../asset/icon-tip.png";
import CreateNewimg from "../asset/icon-createNew.png";
import { createRoom, setCurrentAgenda } from "../api/rooms";
import { addAgenda } from "../api/agendas";
import { errorMessage } from "../api/errors";

function CreateRoom({ onCreated }) {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate() {
        if (password && !/^\d{4}$/.test(password)) {
            alert("비밀번호는 숫자 4자리로 입력해 주세요.");
            return;
        }
        setSubmitting(true);
        try {
            const room = await createRoom(name.trim(), password);
            // 첫 안건 하나를 미리 만들어 바로 회의를 시작할 수 있게 (실패해도 방은 그대로 연다)
            try {
                const agenda = await addAgenda(room.id, "안건 제목");
                await setCurrentAgenda(room.id, agenda.id);
            } catch {
                /* 안건은 방 안에서 직접 추가할 수 있다 */
            }
            onCreated(room);
        } catch (error) {
            alert(errorMessage(error));
            setSubmitting(false);
        }
    }

    return (
        <div className={style.ModalNew}>
            <div className={style.Modal}>
                <div className={style.Left}>
                    <img alt="boardImg" src={CreateNewimg} />
                </div>
                <div className={style.Right}>
                    <h2 onClick={() => navigate("/home")}>+</h2>
                    <div className={style.ModalDiv}>
                        <h1>환영합니다</h1>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleCreate();
                        }}>
                            <label>회의 이름
                                <div className={style.Input}>
                                    <input
                                        maxLength='12'
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </label>

                            <label>방 비밀번호
                                <div className={style.Input}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        inputMode="numeric"
                                        minLength='4'
                                        maxLength='4'
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <img alt="visible" src={visible} onClick={() => setShowPassword(!showPassword)} />
                                </div>
                            </label>
                            <div className={style.Tip}>
                                <img alt="icon-tip" src={tip} />
                                비밀번호를 변경하신 후에는 함께 회의 중인<br />
                                팀원들에게 새 비밀번호를 꼭 공유해 주세요!
                            </div>
                            <button disabled={submitting}>생성하기</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default CreateRoom;
