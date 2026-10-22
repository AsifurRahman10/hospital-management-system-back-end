import { Request, Response } from 'express'
import httpStatus from 'http-status'
import { PrescriptionService } from './prescription.service'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import { IUser } from '../../interface'

const givePrescription = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body
  const user = req.user
  const result = await PrescriptionService.givePrescription(
    user as IUser,
    payload
  )
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Prescription created successfully',
    data: result
  })
})

const myPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const result = await PrescriptionService.myPrescriptions(user as IUser)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Prescription fetched successfully',
    data: result
  })
})

const getAllPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getAllPrescriptions()
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Prescriptions retrieval successfully',
    data: result
  })
})

const updatePrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const prescriptionId = req.params.id
  const payload = req.body
  const result = await PrescriptionService.updatePrescription(
    user as IUser,
    prescriptionId as string,
    payload
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Prescription updated successfully',
    data: result
  })
})

const deletePrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const prescriptionId = req.params.id
  await PrescriptionService.deletePrescription(
    user as IUser,
    prescriptionId as string
  )

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Prescription deleted successfully'
  })
})

export const PrescriptionController = {
  givePrescription,
  myPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription
}
