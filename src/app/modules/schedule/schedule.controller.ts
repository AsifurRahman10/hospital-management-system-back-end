/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'

const createSchedule = catchAsync(
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
