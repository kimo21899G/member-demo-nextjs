"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function MembersRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="border px-3 py-2 rounded"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      title="회원목록 갱신"
    >
      {pending ? "갱신중..." : "새로고침"}
    </button>
  );
}
