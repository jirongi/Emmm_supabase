import { useNavigate } from "react-router-dom";
import style from "../CSS/LogoutModal.module.css";

import Logo from "../asset/icon-logo.png";

function LogoutModal({ setLogoutmodal,setName,setEmail,setPicture }) {
    const navigate = useNavigate();

    function Logout() {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("roomId");
        setName(null);
        setEmail(null);
        setPicture(null);
        navigate("/loading");
    }
    return (
        <div className={style.DeleteModal}>
            <div className={style.Modal}>
                <img alt="logo" src={Logo} />
                <h2>로그아웃 하시겠습니까?</h2>
                <div className={style.Tip}>
                    오늘 회의는 만족스러우셨나요? <br />
                    고생한 당신, 이제 푹 쉬셔도 좋아요! 다음에 또 만나요.
                </div>
                <div className={style.Buttons}>
                    <button onClick={() => setLogoutmodal(false)}>
                        더 머무르기
                    </button>
                    <button onClick={() => Logout()} className={style.dltButton}>
                        로그아웃
                    </button>
                </div>
            </div>
        </div>
    );
}
export default LogoutModal;
