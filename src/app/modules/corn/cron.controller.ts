import { Request, Response } from 'express'
import httpStatus from 'http-status'

import { envConfig } from '../../config'
import { AppointmentService } from '../appointment/appointment.service'

const cancelUnpaidAppointments = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader !== `Bearer ${envConfig.CRON_SECRET}`) {
      return res.sendStatus(httpStatus.UNAUTHORIZED)
    }

    console.log('[CRON] Running unpaid appointment cancellation')

    await AppointmentService.cancelUnpaidAppointment()

    console.log('[CRON] Unpaid appointments processed successfully')

    return res.sendStatus(httpStatus.NO_CONTENT)
  } catch (error) {
    console.error('[CRON] Appointment cancellation failed:', error)

    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send('Cron execution failed')
  }
}

export const CronController = {
  cancelUnpaidAppointments
}
