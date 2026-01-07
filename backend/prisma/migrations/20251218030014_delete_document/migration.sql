/*
  Warnings:

  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentReminder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentReminder" DROP CONSTRAINT "DocumentReminder_documentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DocumentReminder" DROP CONSTRAINT "DocumentReminder_userId_fkey";

-- DropTable
DROP TABLE "public"."Document";

-- DropTable
DROP TABLE "public"."DocumentReminder";
