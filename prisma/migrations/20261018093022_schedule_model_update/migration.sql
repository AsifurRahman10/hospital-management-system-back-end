-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "_AppointmentToSchedule" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AppointmentToSchedule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AppointmentToSchedule_B_index" ON "_AppointmentToSchedule"("B");

-- AddForeignKey
ALTER TABLE "_AppointmentToSchedule" ADD CONSTRAINT "_AppointmentToSchedule_A_fkey" FOREIGN KEY ("A") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AppointmentToSchedule" ADD CONSTRAINT "_AppointmentToSchedule_B_fkey" FOREIGN KEY ("B") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
