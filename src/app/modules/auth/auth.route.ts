import { Router } from 'express'
import { AuthController } from './auth.controller'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'

const router = Router()

router.post('/register', AuthController.registerPatient)
router.get('/login', AuthController.loginUser)
router.get('/me', checkAuth(...Object.values(Role)), AuthController.getMe)

router.post(
  '/change-password',
  checkAuth(...Object.values(Role)),
  AuthController.changePassword
)

router.post('/logout', checkAuth(...Object.values(Role)), AuthController.logout)

export const AuthRoutes = router
