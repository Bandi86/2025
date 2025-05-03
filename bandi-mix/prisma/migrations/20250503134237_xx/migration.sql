/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `categoryId` on the `AdminPosts` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `AdminPosts` table. All the data in the column will be lost.
  - You are about to drop the column `isPremium` on the `AdminPosts` table. All the data in the column will be lost.
  - You are about to drop the column `tippmixPicture` on the `AdminPosts` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "FreeTipps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 10000,
    "prize" INTEGER NOT NULL DEFAULT 0,
    "odds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PremiumTipps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "prize" INTEGER NOT NULL DEFAULT 0,
    "odds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminPosts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageurl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AdminPosts" ("content", "createdAt", "id", "imageurl", "slug", "title", "updatedAt") SELECT "content", "createdAt", "id", "imageurl", "slug", "title", "updatedAt" FROM "AdminPosts";
DROP TABLE "AdminPosts";
ALTER TABLE "new_AdminPosts" RENAME TO "AdminPosts";
CREATE UNIQUE INDEX "AdminPosts_slug_key" ON "AdminPosts"("slug");
CREATE TABLE "new_Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "freeTippId" TEXT,
    "premiumTippId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AdminPosts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_freeTippId_fkey" FOREIGN KEY ("freeTippId") REFERENCES "FreeTipps" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_premiumTippId_fkey" FOREIGN KEY ("premiumTippId") REFERENCES "PremiumTipps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Comment" ("content", "createdAt", "hidden", "id", "postId", "updatedAt", "userId") SELECT "content", "createdAt", "hidden", "id", "postId", "updatedAt", "userId" FROM "Comment";
DROP TABLE "Comment";
ALTER TABLE "new_Comment" RENAME TO "Comment";
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "validUntil" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("id", "userId", "validUntil") SELECT "id", "userId", "validUntil" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("avatar", "email", "id", "isAdmin", "isBanned", "isPaid", "password", "username") SELECT "avatar", "email", "id", "isAdmin", "isBanned", "isPaid", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FreeTipps_slug_key" ON "FreeTipps"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PremiumTipps_slug_key" ON "PremiumTipps"("slug");
