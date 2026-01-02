-- CreateTable
CREATE TABLE "User" (
    "userNo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "userNick" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "userPwd" TEXT NOT NULL,
    "userJob" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "create_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userNick_key" ON "User"("userNick");
