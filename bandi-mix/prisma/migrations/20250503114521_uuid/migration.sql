/*
  Warnings:

  - The primary key for the `AdminPosts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Comment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `freeTipsStatistic` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminPosts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "imageurl" TEXT NOT NULL,
    "tippmixPicture" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deadline" DATETIME NOT NULL
);
INSERT INTO "new_AdminPosts" ("content", "createdAt", "deadline", "id", "imageurl", "isPremium", "slug", "tippmixPicture", "title", "updatedAt") SELECT "content", "createdAt", "deadline", "id", "imageurl", "isPremium", "slug", "tippmixPicture", "title", "updatedAt" FROM "AdminPosts";
DROP TABLE "AdminPosts";
ALTER TABLE "new_AdminPosts" RENAME TO "AdminPosts";
CREATE UNIQUE INDEX "AdminPosts_slug_key" ON "AdminPosts"("slug");
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AdminPosts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "hidden", "id", "postId", "updatedAt", "userId") SELECT "content", "createdAt", "hidden", "id", "postId", "updatedAt", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "validUntil" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("id", "userId", "validUntil") SELECT "id", "userId", "validUntil" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE TABLE "new_freeTipsStatistic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numberOfTipps" INTEGER NOT NULL DEFAULT 0,
    "goodTippNumber" INTEGER NOT NULL DEFAULT 0,
    "badTippNumber" INTEGER NOT NULL DEFAULT 0,
    "AllBet" INTEGER NOT NULL DEFAULT 0,
    "WinMoney" INTEGER NOT NULL DEFAULT 0,
    "LostMoney" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_freeTipsStatistic" ("AllBet", "LostMoney", "WinMoney", "badTippNumber", "createdAt", "goodTippNumber", "id", "numberOfTipps", "updatedAt") SELECT "AllBet", "LostMoney", "WinMoney", "badTippNumber", "createdAt", "goodTippNumber", "id", "numberOfTipps", "updatedAt" FROM "freeTipsStatistic";
DROP TABLE "freeTipsStatistic";
ALTER TABLE "new_freeTipsStatistic" RENAME TO "freeTipsStatistic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
