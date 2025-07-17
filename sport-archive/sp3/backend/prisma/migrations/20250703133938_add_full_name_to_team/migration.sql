/*
  Warnings:

  - You are about to drop the column `odds1` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the column `odds2` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the column `oddsX` on the `markets` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `teams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "markets" DROP COLUMN "odds1",
DROP COLUMN "odds2",
DROP COLUMN "oddsX";

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "fullName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "odds" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "odds" ADD CONSTRAINT "odds_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
