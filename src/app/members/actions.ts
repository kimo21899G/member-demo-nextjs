"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

// ✅ validators는 한 번에 상단 import로 정리
import {
  validateSignup,
  reUserId,
  reUserNick,
  reEmail,
  rePhone,
  rePwdAllowed,
  rePwdHasAlpha,
  rePwdHasDigit,
} from "@/lib/validators";

// ✅ P2002(유니크 충돌) 처리를 위해 Prisma 에러 타입 사용
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

/* =========================================================
 * 공용 타입
 * ======================================================= */

export type SignupValues = {
  userId: string;
  userNick: string;
  userEmail: string;
  userPhone: string;
  userJob: string; // "" 허용(선택 입력)
};

export type SignupState =
  | { ok: true; msg: string }
  | {
      ok: false;
      msg: string;
      fieldErrors?: Record<string, string>;
      values?: SignupValues; // ✅ 비밀번호 제외 값만 유지용
    };

export type UpdateState =
  | { ok: true; msg: string }
  | { ok: false; msg: string; fieldErrors?: Record<string, string> };

/* =========================================================
 * 공용 헬퍼
 * ======================================================= */

function trimStr(v: unknown) {
  return String(v ?? "").trim();
}

function isP2002UniqueError(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

function getUniqueTargets(e: unknown): string[] {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return [];
  const target = (e.meta as any)?.target;
  if (!target) return [];
  return Array.isArray(target) ? target.map(String) : [String(target)];
}

/** P2002 발생 시 어떤 필드가 중복인지 추정해서 fieldErrors로 변환 */
function mapP2002ToFieldErrors(e: unknown) {
  const targets = getUniqueTargets(e);
  const fe: Record<string, string> = {};

  // Prisma가 target에 모델 필드명을 주는 경우가 많음
  if (targets.includes("userId")) fe.userId = "이미 등록된 아이디입니다.";
  if (targets.includes("userNick")) fe.userNick = "이미 등록된 닉네임입니다.";

  // target이 비어있거나 예상과 다르면 generic 처리
  return fe;
}

/* =========================================================
 * 1) 회원가입: 중복확인 버튼
 * - 체크리스트 #2: 가입 검증과 동일한 정규식 적용
 * ======================================================= */

export async function checkUserId(userId: string) {
  const id = trimStr(userId);

  // ✅ 가입 validateSignup과 같은 규칙 사용
  if (!reUserId.test(id)) {
    return { ok: false, msg: "아이디 규칙이 올바르지 않습니다." };
  }

  const exists = await prisma.user.findUnique({ where: { userId: id } });
  return exists
    ? { ok: false, msg: "이미 등록된 아이디입니다." }
    : { ok: true, msg: "등록 가능한 아이디입니다." };
}

export async function checkUserNick(userNick: string) {
  const nick = trimStr(userNick);

  // ✅ 가입 validateSignup과 같은 규칙 사용
  if (!reUserNick.test(nick)) {
    return { ok: false, msg: "닉네임 규칙이 올바르지 않습니다." };
  }

  const exists = await prisma.user.findUnique({ where: { userNick: nick } });
  return exists
    ? { ok: false, msg: "이미 등록된 닉네임입니다." }
    : { ok: true, msg: "등록 가능한 닉네임입니다." };
}

/* =========================================================
 * 2) 회원가입 액션
 * - 체크리스트 #3: hidden 값 비교 시 trim 통일
 * - 체크리스트 #4: create 시 P2002 처리
 * ======================================================= */

export async function signupAction(
  _prev: SignupState | null,
  formData: FormData
): Promise<SignupState> {
  const userId = trimStr(formData.get("userId"));
  const userNick = trimStr(formData.get("userNick"));
  const userEmail = trimStr(formData.get("userEmail"));
  const userPhone = trimStr(formData.get("userPhone"));
  const userJob = trimStr(formData.get("userJob"));

  const userPwd = String(formData.get("userPwd") ?? "");
  const userPwd2 = String(formData.get("userPwd2") ?? "");

  // 중복확인 상태 (hidden)
  const idCheckedOk = String(formData.get("idCheckedOk") ?? "") === "true";
  const idCheckedValue = trimStr(formData.get("idCheckedValue")); // ✅ trim 통일
  const nickCheckedOk = String(formData.get("nickCheckedOk") ?? "") === "true";
  const nickCheckedValue = trimStr(formData.get("nickCheckedValue")); // ✅ trim 통일

  const values: SignupValues = {
    userId,
    userNick,
    userEmail,
    userPhone,
    userJob,
  };

  // 1) 서버 검증(규칙)
  const v = validateSignup({
    userId,
    userNick,
    userEmail,
    userPhone,
    userPwd,
    userJob: userJob || null,
  });

  const errors: Record<string, string> = { ...(v.errors ?? {}) };

  // 2) 비밀번호 재입력 확인
  if (userPwd !== userPwd2) {
    errors.userPwd2 = "비밀번호가 일치하지 않습니다.";
  }

  if (Object.keys(errors).length) {
    return {
      ok: false,
      msg: "입력값을 확인해주세요.",
      fieldErrors: errors,
      values,
    };
  }

  // 3) 중복확인 강제 + 값 변경 방지
  if (!idCheckedOk || idCheckedValue !== userId) {
    return {
      ok: false,
      msg: "아이디 중복확인을 다시 진행해주세요.",
      fieldErrors: { userId: "중복확인 필요" },
      values,
    };
  }

  if (!nickCheckedOk || nickCheckedValue !== userNick) {
    return {
      ok: false,
      msg: "닉네임 중복확인을 다시 진행해주세요.",
      fieldErrors: { userNick: "중복확인 필요" },
      values,
    };
  }

  // 4) 최종 중복 체크(우회/레이스 방지) — (여전히 중요)
  const [idExists, nickExists] = await Promise.all([
    prisma.user.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { userNick } }),
  ]);
  if (idExists) {
    return {
      ok: false,
      msg: "이미 등록된 아이디입니다.",
      fieldErrors: { userId: "중복" },
      values,
    };
  }
  if (nickExists) {
    return {
      ok: false,
      msg: "이미 등록된 닉네임입니다.",
      fieldErrors: { userNick: "중복" },
      values,
    };
  }

  // 5) 저장(P2002 처리 포함)
  try {
    const hash = await bcrypt.hash(userPwd, 10);

    await prisma.user.create({
      data: {
        userId,
        userNick,
        userEmail,
        userPhone,
        userPwd: hash,
        userJob: userJob === "" ? null : userJob,
      },
    });
  } catch (e) {
    // ✅ 체크리스트 #4: 유니크 충돌(P2002) 처리
    if (isP2002UniqueError(e)) {
      const fe = mapP2002ToFieldErrors(e);
      const msg =
        fe.userId || fe.userNick
          ? "이미 등록된 값이 있습니다."
          : "중복된 값이 존재합니다. 입력값을 확인해주세요.";
      return { ok: false, msg, fieldErrors: fe, values };
    }
    throw e;
  }

  // 성공 시 이동
  redirect("/members");
}

/* =========================================================
 * 3) 수정: 닉네임 중복확인(자기 자신 제외)
 * - 체크리스트 #2: 정규식 동일 적용
 * ======================================================= */

export async function checkUserNickForUpdate(userNo: number, userNick: string) {
  const nick = trimStr(userNick);

  // ✅ 가입/수정 동일 규칙
  if (!reUserNick.test(nick)) {
    return { ok: false as const, msg: "닉네임 규칙이 올바르지 않습니다." };
  }

  const exists = await prisma.user.findUnique({ where: { userNick: nick } });
  if (exists && exists.userNo !== userNo) {
    return { ok: false as const, msg: "이미 등록된 닉네임입니다." };
  }

  return { ok: true as const, msg: "등록 가능한 닉네임입니다." };
}

/* =========================================================
 * 4) 수정 액션
 * - 체크리스트 #3: nickCheckedValue trim 통일
 * - 체크리스트 #4: update 시 P2002 처리
 * ======================================================= */

export async function updateUserAction(
  _prev: UpdateState | null,
  formData: FormData
): Promise<UpdateState> {
  const userNo = Number(formData.get("userNo"));
  if (!Number.isFinite(userNo) || userNo <= 0) {
    return { ok: false, msg: "잘못된 요청입니다." };
  }

  const userNick = trimStr(formData.get("userNick"));
  const userEmail = trimStr(formData.get("userEmail"));
  const userPhone = trimStr(formData.get("userPhone"));
  const userJobRaw = trimStr(formData.get("userJob"));
  const userJob = userJobRaw === "" ? null : userJobRaw;

  const userPwd = String(formData.get("userPwd") ?? ""); // optional

  // 원래 닉네임(변경 감지용)
  const originalNick = trimStr(formData.get("originalNick"));

  // 닉네임 중복확인 상태
  const nickCheckedOk = String(formData.get("nickCheckedOk") ?? "") === "true";
  const nickCheckedValue = trimStr(formData.get("nickCheckedValue")); // ✅ trim 통일

  const errors: Record<string, string> = {};

  // 필수
  if (!userNick) errors.userNick = "닉네임은 필수입니다.";
  if (!userEmail) errors.userEmail = "이메일은 필수입니다.";
  if (!userPhone) errors.userPhone = "전화번호는 필수입니다.";

  // 형식
  if (userNick && !reUserNick.test(userNick)) {
    errors.userNick = "닉네임 규칙이 올바르지 않습니다.";
  }
  if (userEmail && (userEmail.length > 50 || !reEmail.test(userEmail))) {
    errors.userEmail = "이메일 형식이 올바르지 않거나 50자를 초과했습니다.";
  }
  if (
    userPhone &&
    (!rePhone.test(userPhone) ||
      userPhone.startsWith("-") ||
      userPhone.endsWith("-") ||
      userPhone.includes("--"))
  ) {
    errors.userPhone = "전화번호는 숫자와 '-'만 입력 가능합니다.";
  }

  // 비번(입력 시에만 변경)
  if (userPwd) {
    if (
      !rePwdAllowed.test(userPwd) ||
      !rePwdHasAlpha.test(userPwd) ||
      !rePwdHasDigit.test(userPwd)
    ) {
      errors.userPwd =
        "비밀번호 규칙이 올바르지 않습니다. (4~20, 영문+숫자 포함, 특수 허용)";
    }
  }

  // 직업(선택)
  if (userJob && userJob.length > 20) {
    errors.userJob = "직업은 20자 이내로 입력해주세요.";
  }

  // ✅ 닉네임이 바뀐 경우만 중복확인 강제
  if (userNick !== originalNick) {
    if (!nickCheckedOk || nickCheckedValue !== userNick) {
      errors.userNick =
        errors.userNick ?? "닉네임 중복확인을 다시 진행해주세요.";
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, msg: "입력값을 확인해주세요.", fieldErrors: errors };
  }

  // 최종 중복 체크(우회 방지)
  const exists = await prisma.user.findUnique({ where: { userNick } });
  if (exists && exists.userNo !== userNo) {
    return {
      ok: false,
      msg: "이미 등록된 닉네임입니다.",
      fieldErrors: { userNick: "중복" },
    };
  }

  // update (P2002 처리 포함)
  try {
    await prisma.user.update({
      where: { userNo },
      data: {
        userNick,
        userEmail,
        userPhone,
        userJob,
        ...(userPwd ? { userPwd: await bcrypt.hash(userPwd, 10) } : {}),
      },
    });
  } catch (e) {
    if (isP2002UniqueError(e)) {
      const fe = mapP2002ToFieldErrors(e);
      const msg = fe.userNick
        ? "이미 등록된 닉네임입니다."
        : "중복된 값이 존재합니다. 입력값을 확인해주세요.";
      return { ok: false, msg, fieldErrors: fe };
    }
    throw e;
  }

  redirect("/members");
}

/* =========================================================
 * 5) 삭제 액션
 * ======================================================= */

export async function deleteUserAction(formData: FormData) {
  const userNo = Number(formData.get("userNo"));
  if (!Number.isFinite(userNo) || userNo <= 0) return;

  await prisma.user.delete({ where: { userNo } });

  revalidatePath("/members");
  redirect("/members");
}

/* =========================================================
 * 6) 회원조회(검색)
 * ======================================================= */
export async function listMembersAction(query?: string) {
  const q = (query ?? "").trim();

  return prisma.user.findMany({
    /*where: q
      ? {
          // ✅ query=아이디 검색 (부분검색)
          userId: { contains: q },
          // 정확히 일치 검색을 원하면 아래로 변경:
          // userId: { equals: q },
        }
      : undefined,*/
    where: {
      OR: [
        { userId: { contains: q } },
        { userNick: { contains: q } },
        { userEmail: { contains: q } },
      ],
    },
    orderBy: { userNo: "desc" },
    select: {
      userNo: true,
      userId: true,
      userNick: true,
      userEmail: true,
      userPhone: true,
      userJob: true,
      create_at: true,
    },
  });
}
