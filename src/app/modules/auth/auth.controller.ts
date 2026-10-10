/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import { AuthServices } from './auth.service'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'

const registerPatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await AuthServices.registerPatient(req.body)

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Patient registered successfully',
      data: data
    })
  }
)

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await AuthServices.loginUser(req.body)

    const cookies = data.headers.getSetCookie()

    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies)
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Login successful',
      data: data
    })
  }
)

export const AuthController = { registerPatient, loginUser }
