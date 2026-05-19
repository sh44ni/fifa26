-- CreateTable
CREATE TABLE "DrawMethodVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voterName" TEXT NOT NULL,
    "optionId" INTEGER NOT NULL,
    "optionName" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "liveDisplayActive" BOOLEAN NOT NULL DEFAULT false,
    "votingToken" TEXT NOT NULL,
    "payoutVotingOpen" BOOLEAN NOT NULL DEFAULT true,
    "drawVotingOpen" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_AppSettings" ("id", "liveDisplayActive", "votingToken") SELECT "id", "liveDisplayActive", "votingToken" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_votingToken_key" ON "AppSettings"("votingToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
