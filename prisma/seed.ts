import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

async function main() {
  const hash = await bcrypt.hash("Test1234!", 10);

  await prisma.user.create({
    data: {
      userId: "admin1",
      userNick: "관리자",
      userEmail: "admin@example.com",
      userPhone: "010-0000-0000",
      userPwd: hash,
      userJob: "ADMIN",
      role: UserRole.ADMIN,
    },
  });
}

main()
  .then(() => console.log("seed done"))
  .finally(async () => prisma.$disconnect());
