/*
  Warnings:

  - You are about to drop the column `taskType` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_userId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "taskType";

-- DropTable
DROP TABLE "public"."Document";
