/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import { AuthServices } from './auth.service'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../../lib/auth'
import { envConfig } from '../../config'

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
      fromNodeHeaders(req.headers),
      req.user?.id as string
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

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body

  await AuthServices.forgetPassword(email)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset email sent successfully'
  })
})

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body

  await AuthServices.resetPassword(email, otp, newPassword)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully'
  })
})

const getGoogleErrorRedirect = (redirectPath: string) => {
  const redirectUrl = new URL(redirectPath, envConfig.FRONTEND_URL)
  redirectUrl.searchParams.set('authError', 'google_login_failed')
  return redirectUrl.toString()
}

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || '/dashboard'
  const frontendUrl = new URL(envConfig.FRONTEND_URL)

  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid redirect path'
    })
    return
  }

  const callbackURL = new URL(
    '/api/v1/auth/google/success',
    envConfig.BETTER_AUTH_URL
  )
  callbackURL.searchParams.set('redirect', redirectPath)

  const errorCallbackURL = new URL(
    '/api/v1/auth/google/error',
    envConfig.BETTER_AUTH_URL
  )
  errorCallbackURL.searchParams.set('redirect', redirectPath)

  let data: globalThis.Response
  try {
    data = await auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL: callbackURL.toString(),
        errorCallbackURL: errorCallbackURL.toString()
      },
      headers: fromNodeHeaders(req.headers),
      asResponse: true
    })
  } catch {
    res.redirect(getGoogleErrorRedirect(redirectPath))
    return
  }

  const location = data.headers.get('location')
  if (!location) {
    throw new Error('Google authorization URL was not returned')
  }

  const cookies = data.headers.getSetCookie()
  cookies.forEach((cookie) => {
    res.append('Set-Cookie', cookie)
  })
  res.redirect(location)
})

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || '/dashboard'
  const frontendUrl = new URL(envConfig.FRONTEND_URL)

  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid redirect path'
    })
    return
  }

  await AuthServices.completeGoogleLogin(fromNodeHeaders(req.headers))
  res.redirect(new URL(redirectPath, frontendUrl).toString())
})

const googleLoginError = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || '/dashboard'

  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid redirect path'
    })
    return
  }

  res.redirect(getGoogleErrorRedirect(redirectPath))
})

export const AuthController = {
  registerPatient,
  loginUser,
  getMe,
  changePassword,
  logout,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  googleLoginError
}
