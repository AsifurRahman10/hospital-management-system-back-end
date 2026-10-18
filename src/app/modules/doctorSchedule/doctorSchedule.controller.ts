/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { DoctorScheduleService } from './doctorSchedule.service'
import { IQueryParams } from '../../interface/query.interface'

const createDoctorWiseSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body
    const user = req.user
    const doctorSchedule = await DoctorScheduleService.createDoctorWiseSchedule(
      user?.email as string,
      payload
    )
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Doctor schedule created successfully',
      data: doctorSchedule
    })
  }
)

const getDoctorWiseAllSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user
    const query = req.query
    const result = await DoctorScheduleService.getDoctorWiseAllSchedule(
      user?.email as string,
      query as IQueryParams
    )
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Doctor schedules retrieved successfully',
      data: result.data,
      meta: result.meta
    })
  }
)

const getAllDoctorSchedules = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query
    const result = await DoctorScheduleService.getAllDoctorSchedules(
      query as IQueryParams
    )
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'All doctor schedules retrieved successfully',
      data: result.data,
      meta: result.meta
    })
  }
)

const getDoctorScheduleById = catchAsync(
  async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId
    const scheduleId = req.params.scheduleId
    const doctorSchedule = await DoctorScheduleService.getDoctorScheduleById(
      doctorId as string,
      scheduleId as string
    )
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Doctor schedule retrieved successfully',
      data: doctorSchedule
    })
  }
)

const updateOwnDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body
    const user = req.user
    const updatedDoctorSchedule =
      await DoctorScheduleService.updateOwnDoctorSchedule(
        user?.email as string,
        payload
      )
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Doctor schedule updated successfully',
      data: updatedDoctorSchedule
    })
  }
)

const deleteOwnDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id
    const user = req.user
    await DoctorScheduleService.deleteOwnDoctorSchedule(
      id as string,
      user?.email as string
    )
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Doctor schedule deleted successfully'
    })
  }
)

export const DoctorScheduleController = {
  createDoctorWiseSchedule,
  getDoctorWiseAllSchedule,
  getAllDoctorSchedules,
  getDoctorScheduleById,
  updateOwnDoctorSchedule,
  deleteOwnDoctorSchedule
}
