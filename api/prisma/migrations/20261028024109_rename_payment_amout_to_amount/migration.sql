/*
  Warnings:

  - You are about to drop the column `amout` on the `payments` table. All the data in the column will be lost.
  - Added the required column `amount` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "amout",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL;
