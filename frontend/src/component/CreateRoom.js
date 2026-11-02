import { useNavigate } from "react-router-dom";
import axios from "axios";

import style from "../CSS/CreateRoom.module.css";
//icon imgs
import visible from "../asset/icon-visible.png";
import tip from "../asset/icon-tip.png";
import CreateNewimg from "../asset/icon-createNew.png";

function CreateRoom({
    setRoomName, setPassword, setRoomId, setCode, setModalNew,
    token, RoomName, password
}) {
    const navigate = useNavigate();

    function CreateRoom() {
        axios
            .post(`${process.env.REACT_APP_HOST_URL}/room/host`,
                {
                    roomName: RoomName,
                    password: password,
                    role: "host",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            .then((res) => {
                localStorage.setItem("roomId", res.data.roomId);
                setRoomId(res.data.roomId);
                setCode(res.data.code);
                if (res.status === 200) {
                    setModalNew(false);
                }
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
    }

    function backtohome() {
        navigate("/home");
    }
    function handleVisible() {
        const pw = document.getElementById("password");
        if (pw.type === "password") {
            pw.type = "text";
            return;
        }
        pw.type = "password";

    }

    return (
        <div className={style.ModalNew}>
            <div className={style.Modal}>
                <div className={style.Left}>
                    <img alt="boardImg" src={CreateNewimg} />
                </div>
                <div className={style.Right}>
                    <h2 onClick={() => backtohome()}>+</h2>
                    <div className={style.ModalDiv}>
                        <h1>환영합니다</h1>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            CreateRoom();
                        }}>
                            <label>회의 이름
                                <div className={style.Input}>
                                    <input
                                        id="name"
                                        maxLength='12'
                                        required
                                        onChange={() => {
                                            setRoomName(document.getElementById("name").value);
                                        }}
                                    />
                                </div>
                            </label>

                            <label>방 비밀번호
                                <div className={style.Input}>
                                    <input
                                        id="password"
                                        type="password"
                                        minLength='4'
                                        maxLength='4'
                                        onChange={() => {
                                            setPassword(document.getElementById("password").value);
                                        }}
                                    />
                                    <img alt="visible" src={visible} onClick={() => handleVisible()} />
                                </div>
                            </label>
                            <div className={style.Tip}>
                                <img alt="icon-tip" src={tip} />
                                비밀번호를 변경하신 후에는 함께 회의 중인<br />
                                팀원들에게 새 비밀번호를 꼭 공유해 주세요!
                            </div>
                            <button>생성하기</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default CreateRoom;
