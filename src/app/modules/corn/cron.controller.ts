import { Request, Response } from 'express'
import catchAsync from '../../shared/catchAsync'
import httpStatus from 'http-status'
import { envConfig } from '../../config'
import { AppointmentService } from '../appointment/appointment.service'

const cancelUnpaidAppointments = catchAsync(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization

    if (authHeader !== `Bearer ${envConfig.CRON_SECRET}`) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized cron request'
      })
    }

    console.log('Running cron job to cancel unpaid appointments')

    await AppointmentService.cancelUnpaidAppointment()

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Unpaid appointments processed successfully'
    })
  }
)

export const CronController = {
  cancelUnpaidAppointments
}
