/*
  Warnings:

  - You are about to drop the `super_admin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "super_admin" DROP CONSTRAINT "super_admin_userId_fkey";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "stripeEventId" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "super_admin";
