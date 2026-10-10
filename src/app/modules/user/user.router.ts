import { Router } from 'express'
import { UserController } from './user.controller'

const router = Router()

router.post('/register-doctor', UserController.createDoctor)

export const UserRoutes = router
