/*
  Warnings:

  - You are about to drop the column `category` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "category";

-- CreateIndex
CREATE INDEX "Task_templateId_idx" ON "Task"("templateId");
