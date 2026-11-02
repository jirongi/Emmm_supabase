import defaultAvatar from "../asset/icon-people-blue.png";

// 프로필 사진이 없는 계정(이메일 가입 등)은 기본 아이콘을 쓴다
export function avatarSrc(url) {
  return url || defaultAvatar;
}
