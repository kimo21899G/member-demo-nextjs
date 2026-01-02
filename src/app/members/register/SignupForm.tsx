"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  checkUserId,
  checkUserNick,
  signupAction,
  type SignupState,
} from "@/app/members/actions";

const initialState: SignupState | null = null;

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signupAction, // 어떤 Server Action 인가 지정
    initialState // 어떤 상태값인가 지정
  );

  // ✅ 유지할 값들은 state로 관리
  const [userId, setUserId] = useState("");
  const [userNick, setUserNick] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userJob, setUserJob] = useState("");

  // ✅ 비밀번호는 “유지하지 않고”, 실패 시만 비우기(리셋)용 key
  const [pwdKey, setPwdKey] = useState(0);

  const [idCheck, setIdCheck] = useState<{
    ok: boolean;
    msg: string;
    value: string;
  } | null>(null);
  const [nickCheck, setNickCheck] = useState<{
    ok: boolean;
    msg: string;
    value: string;
  } | null>(null);

  const [isChecking, startTransition] = useTransition();

  // 입력값 바뀌면 중복확인 무효화
  const onChangeUserId = (v: string) => {
    setUserId(v);
    setIdCheck(null);
  };
  const onChangeUserNick = (v: string) => {
    setUserNick(v);
    setNickCheck(null);
  };

  // ✅ 실패 시: 비밀번호/재입력만 리셋 + (필요 시) values로 복구
  useEffect(() => {
    if (!state || state.ok) return;

    // 비밀번호/확인 입력은 항상 빈값 정책
    setPwdKey((k) => k + 1);

    // 혹시 값이 리셋되는 환경(리마운트 등) 대비: 서버가 준 values로 복구
    if (state.values) {
      setUserId(state.values.userId ?? "");
      setUserNick(state.values.userNick ?? "");
      setUserEmail(state.values.userEmail ?? "");
      setUserPhone(state.values.userPhone ?? "");
      setUserJob(state.values.userJob ?? "");
    }
  }, [state]);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const msg = state ? state.msg : "";

  // hidden: 중복확인 상태 전달
  const hidden = useMemo(() => {
    return {
      idCheckedOk: String(idCheck?.ok === true),
      idCheckedValue: idCheck?.value ?? "",
      nickCheckedOk: String(nickCheck?.ok === true),
      nickCheckedValue: nickCheck?.value ?? "",
    };
  }, [idCheck, nickCheck]);

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium">아이디</label>
        <div className="flex gap-2">
          <input
            name="userId"
            value={userId}
            onChange={(e) => onChangeUserId(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const r = await checkUserId(userId);
                setIdCheck({ ...r, value: userId });
              })
            }
            className="border px-3 py-2 rounded whitespace-nowrap"
            disabled={isChecking}
          >
            중복확인
          </button>
        </div>
        <p className="text-sm mt-1">{idCheck?.msg}</p>
        {fieldErrors.userId && (
          <p className="text-sm text-red-600">{fieldErrors.userId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">닉네임</label>
        <div className="flex gap-2">
          <input
            name="userNick"
            value={userNick}
            onChange={(e) => onChangeUserNick(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const r = await checkUserNick(userNick);
                setNickCheck({ ...r, value: userNick });
              })
            }
            className="border px-3 py-2 rounded whitespace-nowrap"
            disabled={isChecking}
          >
            중복확인
          </button>
        </div>
        <p className="text-sm mt-1">{nickCheck?.msg}</p>
        {fieldErrors.userNick && (
          <p className="text-sm text-red-600">{fieldErrors.userNick}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">이메일</label>
        <input
          name="userEmail"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
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
          value={userPhone}
          onChange={(e) => setUserPhone(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="010-1234-5678"
        />
        {fieldErrors.userPhone && (
          <p className="text-sm text-red-600">{fieldErrors.userPhone}</p>
        )}
      </div>

      {/* ✅ 비밀번호/재입력: 실패 시 key 변경으로만 리셋(값 유지 안 함) */}
      <div key={pwdKey} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">비밀번호</label>
          <input
            name="userPwd"
            type="password"
            className="border px-3 py-2 rounded w-full"
            autoComplete="new-password"
          />
          {fieldErrors.userPwd && (
            <p className="text-sm text-red-600">{fieldErrors.userPwd}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">비밀번호 재입력</label>
          <input
            name="userPwd2"
            type="password"
            className="border px-3 py-2 rounded w-full"
            autoComplete="new-password"
          />
          {fieldErrors.userPwd2 && (
            <p className="text-sm text-red-600">{fieldErrors.userPwd2}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">직업(선택)</label>
        <input
          name="userJob"
          value={userJob}
          onChange={(e) => setUserJob(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        {fieldErrors.userJob && (
          <p className="text-sm text-red-600">{fieldErrors.userJob}</p>
        )}
      </div>

      {/* hidden: 중복확인 상태 */}
      <input type="hidden" name="idCheckedOk" value={hidden.idCheckedOk} />
      <input
        type="hidden"
        name="idCheckedValue"
        value={hidden.idCheckedValue}
      />
      <input type="hidden" name="nickCheckedOk" value={hidden.nickCheckedOk} />
      <input
        type="hidden"
        name="nickCheckedValue"
        value={hidden.nickCheckedValue}
      />

      <div className="flex gap-2">
        <button
          className="bg-black text-white px-4 py-2 rounded flex-1"
          disabled={pending}
        >
          {pending ? "처리중..." : "회원가입"}
        </button>

        <Link
          href="/members"
          className="border px-4 py-2 rounded flex-1 text-center"
        >
          회원목록
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
