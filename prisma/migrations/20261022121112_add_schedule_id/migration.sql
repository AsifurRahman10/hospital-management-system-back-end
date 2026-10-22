
-- 1. Add scheduleId as nullable initially
ALTER TABLE "appointments"
ADD COLUMN "scheduleId" TEXT;

-- 2. Preserve the existing appointment-schedule relationships
UPDATE "appointments" AS a
SET "scheduleId" = j."B"
FROM "_AppointmentToSchedule" AS j
WHERE j."A" = a.id;

-- 3. Verify every appointment received a scheduleId
-- This must return 0 before continuing.
SELECT COUNT(*) AS missing_schedule_count
FROM "appointments"
WHERE "scheduleId" IS NULL;

-- 4. Only continue after verifying that no rows are missing.
ALTER TABLE "appointments"
ALTER COLUMN "scheduleId" SET NOT NULL;

-- 5. Add the foreign key
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_scheduleId_fkey"
FOREIGN KEY ("scheduleId")
REFERENCES "schedules"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- 6. Remove the old join table after preserving its relationships
DROP TABLE "_AppointmentToSchedule";
