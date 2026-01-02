/*
아래는 회원정보를 수정하는 /appmembers/[id]/edit/page.tsx 파일 임
회원번호 db필드는 userNo 인데 나는 [id] 로 일단 받고 
const { id } = await params;
const userNo = Number(id); << 이렇게 타입변환을 했는데 올바른 방법은?
*/

import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export const runtime = "nodejs";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userNo = Number(id);

  if (!Number.isInteger(userNo) || userNo <= 0) notFound();

  const user = await prisma.user.findUnique({
    where: { userNo },
    select: {
      userNo: true,
      userId: true,
      userNick: true,
      userEmail: true,
      userPhone: true,
      userJob: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">회원 수정</h1>
      <EditForm user={user} />
    </div>
  );
}
