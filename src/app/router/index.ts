import { Router } from 'express'
import { specialtyRoutes } from '../modules/specialty/specialty.route'
import { AuthRoutes } from '../modules/auth/auth.route'
import { UserRoutes } from '../modules/user/user.router'
import { DoctorRoutes } from '../modules/doctor/doctor.route'

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
  }
]

moduleRouter.forEach((route) => {
  router.use(route.path, route.route)
})
