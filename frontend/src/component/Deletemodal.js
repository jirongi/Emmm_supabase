import { useNavigate } from "react-router-dom";
import axios from "axios";
import style from "../CSS/Deletemodal.module.css";


import tipRed from "../asset/icon-tip-red.png";
import Logo from "../asset/icon-logo.png";

function Deletemodal({ token,setDeleteModal,roomId }) {
    const navigate = useNavigate();

    function deleteRoom() {
        axios
            .delete(`${process.env.REACT_APP_HOST_URL}/room/${roomId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
            })
            .catch((error) => {
                console.error("마이페이지 정보 가져오기 실패:", error);
            });
        navigate("/home");
    }

    return (
        <div className={style.DeleteModal}>
            <div className={style.Modal}>
                <img alt="logo" src={Logo} />
                <h2>회의를 삭제하시겠습니까</h2>
                <div className={style.Tip}>
                    <img alt="icon-tip"src={tipRed} />
                    삭제하기 버튼을 누르면 이 방의 모든 회의 기록과 <br />
                    데이터가 영구적으로 삭제되며 복구할 수 없습니다
                </div>
                <div className={style.Buttons}>
                    <button onClick={() => setDeleteModal(false)}>
                        더 머무르기
                    </button>
                    <button onClick={() => deleteRoom()} className={style.dltButton}>
                        삭제하기
                    </button>
                </div>
            </div>
        </div>
    );
}
export default Deletemodal;
