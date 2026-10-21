/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { DoctorService } from './doctor.service'
import { IUser } from '../../interface'

const getAllDoctors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    const data = await DoctorService.getAllDoctors(query)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Doctors retrieved successfully',
      data: data
    })
  }
)

const getDoctorById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const data = await DoctorService.getDoctorById(id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Doctor retrieved successfully',
      data
    })
  }
)

const updateDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const payload = { id, ...req.body }

    const data = await DoctorService.updateDoctor(payload)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Doctor updated successfully',
      data
    })
  }
)

const deleteDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    await DoctorService.deleteDoctor(id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Doctor deleted successfully'
    })
  }
)

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUser
  const payload = req.body

  const result = await DoctorService.updateMyProfile(user, payload)

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: result
  })
})

export const DoctorController = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  updateMyProfile
}
