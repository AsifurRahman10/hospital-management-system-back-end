/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { ScheduleService } from './schedule.service'

const createSchedule = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body
    const data = await ScheduleService.createSchedule(payload)
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Doctors retrieved successfully',
      data: data
    })
  }
)

const getAllSchedules = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    const data = await ScheduleService.getAllSchedules(query)
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Doctors retrieved successfully',
      data: data,
      meta: data.meta
    })
  }
)

const getScheduleById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const schedule = await ScheduleService.getScheduleById(id as string)
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Schedule retrieved successfully',
    data: schedule
  })
})

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const payload = req.body
  const updatedSchedule = await ScheduleService.updateSchedule(
    id as string,
    payload
  )
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Schedule updated successfully',
    data: updatedSchedule
  })
})

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  await ScheduleService.deleteSchedule(id as string)
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Schedule deleted successfully'
  })
})

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule
}
