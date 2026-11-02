import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import style from "../CSS/LogoutModal.module.css";

import Logo from "../asset/icon-logo.png";
import { signOut } from "../api/auth";

function LogoutModal({ setLogoutmodal }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    async function Logout() {
        await signOut();
        queryClient.clear();
        navigate("/", { replace: true });
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
