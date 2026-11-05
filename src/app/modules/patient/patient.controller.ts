import { Request, Response } from 'express'
import status from 'http-status'
import { PatientService } from './patient.service'
import { IUser } from '../../interface'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'

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

const getAllPatients = catchAsync(async (req: Request, res: Response) => {
  const data = await PatientService.getAllPatients(req.query)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Patients retrieved successfully',
    data
  })
})

const updatePatientStatus = catchAsync(async (req: Request, res: Response) => {
  const data = await PatientService.updatePatientStatus(
    req.params.id as string,
    req.body.status
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Patient status updated successfully',
    data
  })
})

const deletePatient = catchAsync(async (req: Request, res: Response) => {
  await PatientService.deletePatient(req.params.id as string)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Patient deleted successfully'
  })
})

export const PatientController = {
  updateMyProfile,
  getAllPatients,
  updatePatientStatus,
  deletePatient
}
