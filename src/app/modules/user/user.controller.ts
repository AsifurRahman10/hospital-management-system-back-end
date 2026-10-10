/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import { UserService } from './user.service'
import httpStatus from 'http-status'

const createDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await UserService.createDoctor(req.body)

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Doctor created successfully',
      data: data
    })
  }
)

export const UserController = {
  createDoctor
}
