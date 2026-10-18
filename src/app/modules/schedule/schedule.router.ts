import { Router } from 'express'
import { validateRequest } from '../../middleware/validateRequest'

const router = Router()

router.post('/', DoctorController.getAllDoctors)

export const scheduleRoutes = router
