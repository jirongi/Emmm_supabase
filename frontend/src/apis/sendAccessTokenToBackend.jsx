import axios from "axios";

const sendAccessTokenToBackend = async (code) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_HOST_URL}/user/google`,
      { code },
    );

    if (response.data.accessToken) {
      const accessToken = response.data.accessToken;

      localStorage.setItem("accessToken", accessToken);

      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      console.warn("응답에 accessToken이 없습니다:", response.data);
    }

    if (response.data.user) {
      localStorage.setItem("userInfo", JSON.stringify(response.data.user));

      if (
        response.data.user.id !== undefined &&
        response.data.user.id !== null
      ) {
        localStorage.setItem("memberId", String(response.data.user.id));
      }
    } else {
      console.warn("응답에 user가 없습니다:", response.data);
    }

    return response.data;
  } catch (error) {
    console.error("Login failed with error:", error?.response?.data || error);
    throw error;
  }
};

export default sendAccessTokenToBackend;
