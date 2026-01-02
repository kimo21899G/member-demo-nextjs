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

  if (!Number.isFinite(userNo) || userNo <= 0) notFound();

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
