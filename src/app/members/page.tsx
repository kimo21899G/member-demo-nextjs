import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { deleteUserAction } from "./actions";
import ConfirmSubmit from "@/app/components/ConfirmSubmit";
import MembersRefresh from "@/app/components/MembersRefresh";

export default async function Page() {
  const users = await prisma.user.findMany({
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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">회원목록</h1>
        <div className="flex gap-2 items-center">
          <MembersRefresh /> {/* ✅ 추가 */}
          <Link className="border px-3 py-2 rounded" href="/members/signup">
            회원추가
          </Link>
        </div>
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">No</th>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Nick</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Job</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userNo} className="border-b">
                <td className="p-2">{u.userNo}</td>
                <td className="p-2">{u.userId}</td>
                <td className="p-2">{u.userNick}</td>
                <td className="p-2">{u.userEmail}</td>
                <td className="p-2">{u.userPhone}</td>
                <td className="p-2">{u.userJob ?? "-"}</td>
                <td className="p-2">
                  {u.create_at.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    {/* ✅ 수정: confirm 후 이동 */}
                    <Link
                      href={`/members/${u.userNo}/edit`}
                      className="underline"
                    >
                      수정
                    </Link>

                    {/* ✅ 삭제: confirm 후 submit */}
                    <form action={deleteUserAction}>
                      <input type="hidden" name="userNo" value={u.userNo} />
                      <ConfirmSubmit
                        message="삭제하시겠습니까?"
                        className="underline text-red-600"
                      >
                        삭제
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="p-4" colSpan={8}>
                  등록된 회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
