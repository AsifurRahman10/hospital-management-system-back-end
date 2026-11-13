import { Router } from 'express'
import { CronController } from './cron.controller'

const router = Router()

router.get(
  '/cancel-unpaid-appointments',
  CronController.cancelUnpaidAppointments
)

export const CronRoutes = router
