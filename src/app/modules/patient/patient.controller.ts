import { Request, Response } from 'express'
import status from 'http-status'
import { PatientService } from './patient.service'
import { IUser } from '../../interface'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser
  const payload = req.body

  const result = await PatientService.updateMyProfile(user, payload)

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'Profile updated successfully',
    data: result
  })
})

export const PatientController = {
  updateMyProfile
}
