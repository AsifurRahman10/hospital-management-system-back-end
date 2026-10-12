import { Router } from 'express'
import { AuthController } from './auth.controller'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'

const router = Router()

router.post('/register', AuthController.registerPatient)
router.get('/login', AuthController.loginUser)
router.get('/me', checkAuth(...Object.values(Role)), AuthController.getMe)

export const AuthRoutes = router
