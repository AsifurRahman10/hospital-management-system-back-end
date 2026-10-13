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
router.post('/verify-email', AuthController.verifyEmail)
router.post('/forget-password', AuthController.forgetPassword)
router.post('/reset-password', AuthController.resetPassword)

router.get('/login/google', AuthController.googleLogin)
router.get('/google/success', AuthController.googleLoginSuccess)
router.get('/google/error', AuthController.googleLoginError)

export const AuthRoutes = router
