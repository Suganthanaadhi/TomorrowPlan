-- Move any existing IN_PROGRESS tasks back to PENDING before the value is removed
UPDATE "Task" SET status = 'PENDING' WHERE status = 'IN_PROGRESS';

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('PENDING', 'COMPLETED');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
