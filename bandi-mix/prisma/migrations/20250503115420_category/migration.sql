/*
  Warnings:

  - Added the required column `categoryId` to the `AdminPosts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

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
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deadline" DATETIME NOT NULL,
    CONSTRAINT "AdminPosts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdminPosts" ("content", "createdAt", "deadline", "id", "imageurl", "isPremium", "slug", "tippmixPicture", "title", "updatedAt") SELECT "content", "createdAt", "deadline", "id", "imageurl", "isPremium", "slug", "tippmixPicture", "title", "updatedAt" FROM "AdminPosts";
DROP TABLE "AdminPosts";
ALTER TABLE "new_AdminPosts" RENAME TO "AdminPosts";
CREATE UNIQUE INDEX "AdminPosts_slug_key" ON "AdminPosts"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
