import { Router } from 'express'
import { specialtyRoutes } from '../modules/specialty/specialty.route'
import { AuthRoutes } from '../modules/auth/auth.route'
import { UserRoutes } from '../modules/user/user.router'
import { DoctorRoutes } from '../modules/doctor/doctor.route'
import { AdminRoutes } from '../modules/admin/admin.route'
import { SuperAdminRoutes } from '../modules/superAdmin/superAdmin.route'
import { ScheduleRoutes } from '../modules/schedule/schedule.router'
import { DoctorScheduleRoutes } from '../modules/doctorSchedule/doctorSchedule.route'

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
  }
]

moduleRouter.forEach((route) => {
  router.use(route.path, route.route)
})
