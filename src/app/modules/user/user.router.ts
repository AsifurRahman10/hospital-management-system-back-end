import { Router } from 'express'
import { UserController } from './user.controller'
import { validateRequest } from '../../middleware/validateRequest'
import { UserValidation } from './user.validation'

const router = Router()

router.post(
  '/register-doctor',
  validateRequest(UserValidation.createDoctorValidationSchema),
  UserController.createDoctor
)

export const UserRoutes = router
