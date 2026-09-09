-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('PLAN', 'END_OF_DAY');

-- DropIndex
DROP INDEX "ReminderLog_userId_date_key";

-- AlterTable
ALTER TABLE "ReminderLog" ADD COLUMN     "kind" "ReminderKind" NOT NULL DEFAULT 'PLAN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "endOfDayReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "endOfDayReminderTime" TEXT NOT NULL DEFAULT '20:00',
ADD COLUMN     "planReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "planReminderTime" TEXT NOT NULL DEFAULT '07:30';

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_userId_date_kind_key" ON "ReminderLog"("userId", "date", "kind");
