// /lib/validators.ts 파일

export const reUserId = /^[a-z][a-z0-9!@#$%^&*()_-]{3,19}$/;
// 4~20, 소문자로 시작, 이후 소문자/숫자/특수(!@#$%^&*()_-) 허용

export const reUserNick = /^(?=.{2,12}$)[A-Za-z가-힣][A-Za-z0-9가-힣_-]*$/;
// 2~12, 한글/영문/숫자/_- 가능, 시작은 한글/영문만

export const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rePhone = /^[0-9-]+$/;

export const rePwdAllowed = /^[A-Za-z0-9!@#$%^&*()_-]{4,20}$/;
export const rePwdHasAlpha = /[A-Za-z]/;
export const rePwdHasDigit = /[0-9]/;

export function validateSignup(input: {
  userId: string;
  userNick: string;
  userEmail: string;
  userPhone: string;
  userPwd: string;
  userJob?: string | null;
}) {
  const errors: Record<string, string> = {};

  if (!reUserId.test(input.userId)) {
    errors.userId =
      "아이디: 4~20자, 소문자로 시작, 소문자/숫자/특수(!@#$%^&*()_-)만 가능합니다.";
  }
  if (!reUserNick.test(input.userNick)) {
    errors.userNick =
      "닉네임: 2~12자, 한글/영문으로 시작, 한글/영문/숫자/_-만 가능합니다.";
  }
  if (
    !input.userEmail ||
    input.userEmail.length > 50 ||
    !reEmail.test(input.userEmail)
  ) {
    errors.userEmail = "이메일 형식이 올바르지 않습니다. (50자 이내)";
  }
  if (!input.userPhone || !rePhone.test(input.userPhone)) {
    errors.userPhone = "전화번호는 숫자와 - 만 입력 가능합니다.";
  }
  if (
    !rePwdAllowed.test(input.userPwd) ||
    !rePwdHasAlpha.test(input.userPwd) ||
    !rePwdHasDigit.test(input.userPwd)
  ) {
    errors.userPwd =
      "비밀번호: 4~20자, 영문+숫자 포함, 특수(!@#$%^&*()_-) 사용 가능합니다.";
  }
  if (
    input.userJob != null &&
    input.userJob !== "" &&
    input.userJob.length > 20
  ) {
    errors.userJob = "직업은 20자 이내로 입력해주세요.";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
