/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express'
import { envConfig } from '../config'
import status from 'http-status'

const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (envConfig.NODE_ENV == 'development') {
    console.error(`Error: ${err.message}\nStack: ${err.stack}`)
  }

  const statusCode = status.INTERNAL_SERVER_ERROR
  const message = err.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message: message,
    error: err.message
  })
}

export default globalErrorHandler
