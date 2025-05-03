/*
  Warnings:

  - Added the required column `slug` to the `AdminPosts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminPosts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
INSERT INTO "new_AdminPosts" ("content", "createdAt", "deadline", "id", "imageurl", "isPremium", "tippmixPicture", "title", "updatedAt") SELECT "content", "createdAt", "deadline", "id", "imageurl", "isPremium", "tippmixPicture", "title", "updatedAt" FROM "AdminPosts";
DROP TABLE "AdminPosts";
ALTER TABLE "new_AdminPosts" RENAME TO "AdminPosts";
CREATE UNIQUE INDEX "AdminPosts_slug_key" ON "AdminPosts"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
