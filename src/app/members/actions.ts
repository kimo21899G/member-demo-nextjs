"use server";

import { prisma } from "@/lib/db/prisma";
import { validateSignup } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

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
      values?: SignupValues; // ✅ 비밀번호 제외 값만 유지용으로 반환
    };

export async function checkUserId(userId: string) {
  const id = (userId ?? "").trim();
  // 형식 검증은 서버에서도 1차로 해주는 편이 안전
  if (id.length < 4 || id.length > 20)
    return { ok: false, msg: "아이디 길이가 올바르지 않습니다." };

  const exists = await prisma.user.findUnique({ where: { userId: id } });
  return exists
    ? { ok: false, msg: "이미 등록된 아이디입니다." }
    : { ok: true, msg: "등록 가능한 아이디입니다." };
}

export async function checkUserNick(userNick: string) {
  const nick = (userNick ?? "").trim();
  if (nick.length < 2 || nick.length > 12)
    return { ok: false, msg: "닉네임 길이가 올바르지 않습니다." };

  const exists = await prisma.user.findUnique({ where: { userNick: nick } });
  return exists
    ? { ok: false, msg: "이미 등록된 닉네임입니다." }
    : { ok: true, msg: "등록 가능한 닉네임입니다." };
}

export async function signupAction(
  _prev: SignupState | null,
  formData: FormData
): Promise<SignupState> {
  const userId = String(formData.get("userId") ?? "").trim();
  const userNick = String(formData.get("userNick") ?? "").trim();
  const userEmail = String(formData.get("userEmail") ?? "").trim();
  const userPhone = String(formData.get("userPhone") ?? "").trim();
  const userJob = String(formData.get("userJob") ?? "").trim();

  const userPwd = String(formData.get("userPwd") ?? "");
  const userPwd2 = String(formData.get("userPwd2") ?? "");

  // 중복확인 상태
  const idCheckedOk = String(formData.get("idCheckedOk") ?? "") === "true";
  const idCheckedValue = String(formData.get("idCheckedValue") ?? "");
  const nickCheckedOk = String(formData.get("nickCheckedOk") ?? "") === "true";
  const nickCheckedValue = String(formData.get("nickCheckedValue") ?? "");

  const values: SignupValues = {
    userId,
    userNick,
    userEmail,
    userPhone,
    userJob,
  };

  // 서버 검증(기존 규칙)
  const v = validateSignup({
    userId,
    userNick,
    userEmail,
    userPhone,
    userPwd,
    userJob: userJob || null,
  });
  const errors: Record<string, string> = { ...(v.errors ?? {}) };

  // ✅ 비밀번호 재입력 검증
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

  // ✅ 중복확인 강제(값 변경 방지)
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

  // 최종 중복 체크(레이스/우회 방지)
  const [idExists, nickExists] = await Promise.all([
    prisma.user.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { userNick } }),
  ]);
  if (idExists)
    return {
      ok: false,
      msg: "이미 등록된 아이디입니다.",
      fieldErrors: { userId: "중복" },
      values,
    };
  if (nickExists)
    return {
      ok: false,
      msg: "이미 등록된 닉네임입니다.",
      fieldErrors: { userNick: "중복" },
      values,
    };

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

  // ✅ 성공 시 자동 이동
  redirect("/members");
}

import {
  reUserNick,
  reEmail,
  rePhone,
  rePwdAllowed,
  rePwdHasAlpha,
  rePwdHasDigit,
} from "@/lib/validators";

export async function checkUserNickForUpdate(userNo: number, userNick: string) {
  const nick = (userNick ?? "").trim();

  if (!reUserNick.test(nick)) {
    return { ok: false as const, msg: "닉네임 규칙이 올바르지 않습니다." };
  }

  const exists = await prisma.user.findUnique({ where: { userNick: nick } });
  if (exists && exists.userNo !== userNo) {
    return { ok: false as const, msg: "이미 등록된 닉네임입니다." };
  }

  return { ok: true as const, msg: "등록 가능한 닉네임입니다." };
}

export type UpdateState =
  | { ok: true; msg: string }
  | { ok: false; msg: string; fieldErrors?: Record<string, string> };

export async function updateUserAction(
  _prev: UpdateState | null,
  formData: FormData
): Promise<UpdateState> {
  const userNo = Number(formData.get("userNo"));
  if (!Number.isFinite(userNo) || userNo <= 0) {
    return { ok: false, msg: "잘못된 요청입니다." };
  }

  const userNick = String(formData.get("userNick") ?? "").trim();
  const userEmail = String(formData.get("userEmail") ?? "").trim();
  const userPhone = String(formData.get("userPhone") ?? "").trim();
  const userJobRaw = String(formData.get("userJob") ?? "").trim();
  const userJob = userJobRaw === "" ? null : userJobRaw;

  const userPwd = String(formData.get("userPwd") ?? ""); // optional

  // 원래 닉네임(변경 감지용)
  const originalNick = String(formData.get("originalNick") ?? "");

  // 닉네임 중복확인 상태
  const nickCheckedOk = String(formData.get("nickCheckedOk") ?? "") === "true";
  const nickCheckedValue = String(formData.get("nickCheckedValue") ?? "");

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

  // 서버 최종 중복 체크(우회 방지)
  const exists = await prisma.user.findUnique({ where: { userNick } });
  if (exists && exists.userNo !== userNo) {
    return {
      ok: false,
      msg: "이미 등록된 닉네임입니다.",
      fieldErrors: { userNick: "중복" },
    };
  }

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

  redirect("/members");
}

export async function deleteUserAction(formData: FormData) {
  const userNo = Number(formData.get("userNo"));
  if (!Number.isFinite(userNo) || userNo <= 0) return;

  await prisma.user.delete({ where: { userNo } });

  // 목록으로 새로고침
  redirect("/members");
}
