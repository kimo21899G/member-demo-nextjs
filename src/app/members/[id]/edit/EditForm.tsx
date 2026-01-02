"use client";

import Link from "next/link";
import ConfirmSubmit from "@/app/components/ConfirmSubmit";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  checkUserNickForUpdate,
  updateUserAction,
  type UpdateState,
} from "@/app/members/actions";

const initialState: UpdateState | null = null;

export default function EditForm({
  user,
}: {
  user: {
    userNo: number;
    userId: string;
    userNick: string;
    userEmail: string;
    userPhone: string;
    userJob: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateUserAction,
    initialState
  );

  const [userNick, setUserNick] = useState(user.userNick);
  const [nickCheck, setNickCheck] = useState<{
    ok: boolean;
    msg: string;
    value: string;
  } | null>(null);

  const [checking, startTransition] = useTransition();

  // 닉네임 변경 시 중복확인 무효화
  const onChangeNick = (v: string) => {
    setUserNick(v);
    setNickCheck(null);
  };

  const hidden = useMemo(() => {
    return {
      nickCheckedOk: String(nickCheck?.ok === true),
      nickCheckedValue: nickCheck?.value ?? "",
    };
  }, [nickCheck]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const msg = state ? state.msg : "";

  const nickChanged = userNick.trim() !== user.userNick;

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      <input type="hidden" name="userNo" value={user.userNo} />
      <input type="hidden" name="originalNick" value={user.userNick} />

      {/* 중복확인 상태 전달 */}
      <input type="hidden" name="nickCheckedOk" value={hidden.nickCheckedOk} />
      <input
        type="hidden"
        name="nickCheckedValue"
        value={hidden.nickCheckedValue}
      />

      <div>
        <label className="block text-sm font-medium">회원번호</label>
        <input
          className="border px-3 py-2 rounded w-full bg-gray-50"
          value={user.userNo}
          readOnly
        />
      </div>

      <div>
        <label className="block text-sm font-medium">아이디(수정불가)</label>
        <input
          className="border px-3 py-2 rounded w-full bg-gray-50"
          value={user.userId}
          readOnly
        />
      </div>

      <div>
        <label className="block text-sm font-medium">닉네임</label>
        <div className="flex gap-2">
          <input
            name="userNick"
            value={userNick}
            onChange={(e) => onChangeNick(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            type="button"
            className="border px-3 py-2 rounded whitespace-nowrap"
            disabled={checking || !nickChanged}
            onClick={() =>
              startTransition(async () => {
                const r = await checkUserNickForUpdate(user.userNo, userNick);
                setNickCheck({ ...r, value: userNick.trim() });
              })
            }
            title={nickChanged ? "중복확인" : "변경된 닉네임이 없습니다"}
          >
            중복확인
          </button>
        </div>

        {nickChanged && (
          <p className="text-xs mt-1 opacity-70">
            ※ 닉네임 변경 시 중복확인이 필요합니다.
          </p>
        )}
        {nickCheck?.msg && <p className="text-sm mt-1">{nickCheck.msg}</p>}
        {fieldErrors.userNick && (
          <p className="text-sm text-red-600">{fieldErrors.userNick}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">이메일</label>
        <input
          name="userEmail"
          defaultValue={user.userEmail}
          className="border px-3 py-2 rounded w-full"
        />
        {fieldErrors.userEmail && (
          <p className="text-sm text-red-600">{fieldErrors.userEmail}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">전화번호</label>
        <input
          name="userPhone"
          defaultValue={user.userPhone}
          className="border px-3 py-2 rounded w-full"
        />
        {fieldErrors.userPhone && (
          <p className="text-sm text-red-600">{fieldErrors.userPhone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">
          비밀번호(변경 시 입력)
        </label>
        <input
          name="userPwd"
          type="password"
          className="border px-3 py-2 rounded w-full"
          placeholder="미입력 시 기존 유지"
        />
        {fieldErrors.userPwd && (
          <p className="text-sm text-red-600">{fieldErrors.userPwd}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">직업(선택)</label>
        <input
          name="userJob"
          defaultValue={user.userJob ?? ""}
          className="border px-3 py-2 rounded w-full"
        />
        {fieldErrors.userJob && (
          <p className="text-sm text-red-600">{fieldErrors.userJob}</p>
        )}
      </div>

      <div className="flex gap-2">
        <ConfirmSubmit
          message="수정사항을 저장하시겠습니까?"
          className="bg-black text-white px-4 py-2 rounded flex-1 disabled:opacity-40"
        >
          {pending ? "저장중..." : "저장"}
        </ConfirmSubmit>

        <Link
          href="/members"
          className="border px-4 py-2 rounded flex-1 text-center"
        >
          목록
        </Link>
      </div>

      {msg && (
        <p
          className={`text-sm mt-2 ${
            state?.ok ? "text-green-700" : "text-red-700"
          }`}
        >
          {msg}
        </p>
      )}
    </form>
  );
}
