import { Router } from 'express'
import { specialtyRoutes } from '../modules/specialty/specialty.route'
import { AuthRoutes } from '../modules/auth/auth.route'
import { UserRoutes } from '../modules/user/user.route'
import { DoctorRoutes } from '../modules/doctor/doctor.route'
import { AdminRoutes } from '../modules/admin/admin.route'
import { SuperAdminRoutes } from '../modules/superAdmin/superAdmin.route'
import { ScheduleRoutes } from '../modules/schedule/schedule.route'
import { DoctorScheduleRoutes } from '../modules/doctorSchedule/doctorSchedule.route'
import { AppointmentRoutes } from '../modules/appointment/appointment.route'
import { PatientRoutes } from '../modules/patient/patient.route'
import { ReviewRoutes } from '../modules/review/review.route'
import { PrescriptionRoutes } from '../modules/prescription/prescription.route'

export const router = Router()

const moduleRouter = [
  {
    path: '/specialty',
    route: specialtyRoutes
  },
  {
    path: '/auth',
    route: AuthRoutes
  },
  {
    path: '/user',
    route: UserRoutes
  },
  {
    path: '/doctor',
    route: DoctorRoutes
  },
  {
    path: '/admin',
    route: AdminRoutes
  },
  {
    path: '/super-admin',
    route: SuperAdminRoutes
  },
  {
    path: '/schedule',
    route: ScheduleRoutes
  },
  {
    path: '/doctorSchedule',
    route: DoctorScheduleRoutes
  },
  {
    path: '/appointment',
    route: AppointmentRoutes
  },
  {
    path: '/patient',
    route: PatientRoutes
  },
  {
    path: '/review',
    route: ReviewRoutes
  },
  {
    path: '/prescription',
    route: PrescriptionRoutes
  }
]

moduleRouter.forEach((route) => {
  router.use(route.path, route.route)
})
