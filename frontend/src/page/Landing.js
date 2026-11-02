import googleLogoImg from "../asset/googleLogo.png";
import styles from "../CSS/Landing.module.css";
import logoImg from "../asset/icon-logo.png";
import landingBg from "../asset/background_line-landing.png";
import file from "../asset/Mainicon-color-file.png";
import comment from "../asset/Mainicon-color-comment.png";
import vote from "../asset/Mainicon-color-vote.png";
import ai from "../asset/Mainicon-color-Ai.png";
import people from "../asset/icon-people-blue.png";
import glass from "../asset/icon-glass.png";
import clock from "../asset/icon-clock.png";
import dm from "../asset/icon-dm-landing.png";
import fimg1 from "../asset/landing-function1.png";
import fimg2 from "../asset/landing-function2.png";
import fimg3 from "../asset/landing-function3.png";
import simg1 from "../asset/landing-strength1.png";
import simg2 from "../asset/landing-strength2.png";
import simg3 from "../asset/landing-strength3.png";
import handong from "../asset/icon-handong.png";
import mutsa from "../asset/icon-mutsa.png";

function Landing() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("memberId");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("roomId");

  const handleGoogleLogin = () => {
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_GOOGLE_AUTH_REDIRECT_URI}&response_type=code&scope=email profile`;
  };

  return (
    <>
      <div className={styles.extradiv}>
        <div className={styles.Maindiv}>
          <div className={styles.menubar}>
            <img className={styles.logoImg} src={logoImg} alt="이음 로고" />
            <div className={styles.menus}>
              <a className={styles.menu} href="#menu1">
                이음
              </a>
              <a className={styles.menu} href="#menu2">
                기능
              </a>
              <a className={styles.menu} href="#menu3">
                강점
              </a>
              <a className={styles.menu} href="#menu4">
                서비스
              </a>
            </div>

            <div
              className={styles.loginButton}
              alt=""
              onClick={handleGoogleLogin}
            >
              <img
                className={styles.googleLogo}
                src={googleLogoImg}
                alt="구글로고"
              />
              로그인
            </div>
          </div>

          <div id="menu1" className={styles.first}>
            <img className={styles.line} src={landingBg} alt="라인" />

            <img className={styles.people} src={people} alt="사람들" />
            <img className={styles.glass} src={glass} alt="돋보기" />
            <img className={styles.clock} src={clock} alt="시계" />
            <img className={styles.dm} src={dm} alt="디엠" />

            <div className={styles.icon}>
              <div className={styles.progress}>
                <strong>•</strong> 진행중
              </div>
              <img className={styles.file} src={file} alt="파일" />
              <img className={styles.comment} src={comment} alt="코멘트" />
              <img className={styles.vote} src={vote} alt="투표" />
              <img className={styles.ai} src={ai} alt="ai" />
              <div className={styles.complete}>
                <strong>•</strong> 완료
              </div>
            </div>

            <div className={styles.firstText}>
              <div className={styles.textEmmm}>이음</div>
              <div className={styles.text2}>
                침묵은 짧게, 아이디어는 깊게, 회의의 흐름을 잇다
              </div>
              <div className={styles.start} onClick={handleGoogleLogin}>
                시작하기
              </div>
            </div>
          </div>

          <div className={styles.firstLine}>
            <div>
              “혹시 오늘도 ‘음...’ 하다가 <strong>회의 </strong>
              끝나셨나요?”
            </div>
            <div>
              대학생 <strong>93%</strong>가 겪는 회의의 비효율, 가장 절실했던
              당사자들이 직접 <strong>마침표</strong>를 찍습니다
            </div>
          </div>

          <div id="menu2" className={styles.second}>
            <div className={styles.secondText}>
              <div className={styles.secondText1}>
                <span>이음 </span>만의 기능
              </div>
              <div className={styles.secondText2}>
                복잡한 건 빼고, 결론만 남기는 주요 기능
              </div>
            </div>
            <div className={styles.functions}>
              <div className={styles.function}>
                <img className={styles.functionImg} src={fimg1} alt="기능1" />
                <div className={styles.functionTitle}>익명 기반 소통</div>
                <div className={styles.functionDetail1}>
                  모든 툴 익명 보장. 목소리 큰 팀원이 이끄는 회의는 끝났습니다.
                  당신의 ‘진짜’ 생각을 편하게 던지세요
                </div>
              </div>
              <div className={styles.function}>
                <img className={styles.functionImg} src={fimg2} alt="기능2" />
                <div className={styles.functionTitle}>안건보드</div>
                <div className={styles.functionDetail2}>
                  회의 주제가 한눈에 안건보드가 흐름을 잡아줘요
                </div>
              </div>
              <div className={styles.function}>
                <img className={styles.functionImg} src={fimg3} alt="기능3" />
                <div className={styles.functionTitle}>회의 툴 블록</div>
                <div className={styles.functionDetail3}>
                  의견 제시에서 결론까지 블록 하나로
                  <br /> 더 이상 툴 사이에서 길을 잃지 마세요
                </div>
              </div>
            </div>
          </div>

          <div className={styles.secondLine}>
            <div>
              준비부터 결과까지, 단 <strong>세 단계면 </strong> 충분합니다
            </div>
            <div>
              “<strong>익명성</strong>으로 입을 틔우고,
              <strong> 안건 보드</strong>로 방향을 잡고,
              <strong> 회의 툴 블록</strong>으로 결론을 맺습니다.”
            </div>
          </div>

          <div id="menu3" className={styles.third}>
            <div className={styles.thirdText}>
              <div className={styles.thirdText1}>익명이 중요한 이유</div>
              <div className={styles.thirdText2}>
                침묵을 깨는 익명 블록으로 의견 발산부터 AI 요약까지 끊김 없이
                <span> 이음</span>
              </div>
            </div>
            <div className={styles.functions}>
              <div className={styles.function}>
                <img className={styles.functionImg} src={simg1} alt="강점1" />
                <div className={styles.strength1}>
                  <strong>공개적인 회의 환경</strong>은 발언을 위축시킨다
                </div>
              </div>
              <div className={styles.function}>
                <img className={styles.functionImg} src={simg2} alt="강점2" />
                <div className={styles.strength2}>
                  <strong>심리적 안전</strong>과<strong> 의견 제시 방식</strong>
                  은 회의 참여도에 직접적인 영향을 준다
                </div>
              </div>
              <div className={styles.function}>
                <img className={styles.functionImg} src={simg3} alt="강점3" />
                <div className={styles.strength3}>
                  회의가 <strong>비효율적</strong>일수록
                  <strong> 발언과 참여가 감소</strong>한다
                </div>
              </div>
            </div>
          </div>

          <div className={styles.thirdLine}>
            <div>
              <strong>이음</strong>은 모든 의견을 살립니다
            </div>
            <div>
              <strong>87%</strong>의 대학생이 선택한 익명 소통 방식. 비난받을
              걱정 없이 당신의 가장 날카로운 생각을 던지세요
            </div>
            <div className={styles.start} onClick={handleGoogleLogin}>
              시작하기
            </div>
          </div>

          <div id="menu4" className={styles.footer}>
            <div className={styles.logos}>
              <img className={styles.handong} src={handong} alt="한동대" />
              <img className={styles.mutsa} src={mutsa} alt="멋사" />
            </div>
            <div className={styles.member}>
              기획: 이세은 | 디자이너: 김예준 | 프론트엔드: 김진성 | 프론트엔드:
              임청명 | 백엔드: 김민제 | 백엔드: 박주아
            </div>
            <div className={styles.call}>연락처: 010-4126-7930</div>
            <div className={styles.adress}>
              주소: 경상북도 포항시 북구 흥해읍 한동로 558, 한동대학교
            </div>
            <div className={styles.copyright}>
              Copyright: © 2026 이음. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Landing;
