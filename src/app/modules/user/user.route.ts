import { Router } from 'express'
import { UserController } from './user.controller'
import { validateRequest } from '../../middleware/validateRequest'
import { UserValidation } from './user.validation'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'

const router = Router()

router.post(
  '/register-doctor',
  validateRequest(UserValidation.createDoctorValidationSchema),
  UserController.createDoctor
)

router.post(
  '/create-admin',
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(UserValidation.createAdminValidationSchema),
  UserController.createAdmin
)

router.post(
  '/create-super-admin',
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(UserValidation.createSuperAdminValidationSchema),
  UserController.createSuperAdmin
)

export const UserRoutes = router
