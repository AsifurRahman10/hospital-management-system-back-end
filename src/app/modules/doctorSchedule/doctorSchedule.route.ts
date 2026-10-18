import { Router } from 'express'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'
import { DoctorScheduleController } from './doctorSchedule.controller'

const router = Router()

router.post(
  '/create-doctor-wise-schedule',
  checkAuth(Role.DOCTOR),
  DoctorScheduleController.createDoctorWiseSchedule
)
router.get(
  '/doctor-wise-schedules',
  checkAuth(Role.DOCTOR),
  DoctorScheduleController.getDoctorWiseAllSchedule
)
router.get(
  '/',
  //   checkAuth(Role.ADMIN, Role.SUPER_ADMIN),s
  DoctorScheduleController.getAllDoctorSchedules
)
router.get(
  '/:doctorId/schedule/:scheduleId',
  //   checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorScheduleController.getDoctorScheduleById
)
router.patch(
  '/update-own-doctor-schedule',
  checkAuth(Role.DOCTOR),
  DoctorScheduleController.updateOwnDoctorSchedule
)
router.delete(
  '/delete-own-doctor-schedule/:id',
  checkAuth(Role.DOCTOR),
  DoctorScheduleController.deleteOwnDoctorSchedule
)

export const DoctorScheduleRoutes = router
