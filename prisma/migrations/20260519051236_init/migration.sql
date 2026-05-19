-- CreateTable
CREATE TABLE "Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voterName" TEXT NOT NULL,
    "optionId" INTEGER NOT NULL,
    "optionName" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "liveDisplayActive" BOOLEAN NOT NULL DEFAULT false,
    "votingToken" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_votingToken_key" ON "AppSettings"("votingToken");
