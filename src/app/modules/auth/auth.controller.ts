/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import { AuthServices } from './auth.service'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { fromNodeHeaders } from 'better-auth/node'

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

const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.user)
    const data = await AuthServices.getMe(req.user?.id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Login successful',
      data: data
    })
  }
)

const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body

    await AuthServices.changePassword(
      oldPassword,
      newPassword,
      fromNodeHeaders(req.headers)
    )

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Password changed successfully'
    })
  }
)

const logout = catchAsync(async (req: Request, res: Response) => {
  const response = await AuthServices.logout(fromNodeHeaders(req.headers))

  response.headers.getSetCookie().forEach((cookie) => {
    res.append('Set-Cookie', cookie)
  })

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged out successfully',
    data: null
  })
})

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body

  await AuthServices.verifyEmail(email, otp)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email verified successfully'
  })
})

export const AuthController = {
  registerPatient,
  loginUser,
  getMe,
  changePassword,
  logout,
  verifyEmail
}
