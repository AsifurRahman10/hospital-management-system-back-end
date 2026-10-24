/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import status from 'http-status'
import z from 'zod'
import { envConfig } from '../config'
import { Prisma } from '../../../generated/prisma/client'
import AppError from '../shared/AppError'
import { deleteImageFromCloudinary } from '../config/cloudinary.config'
import { deleteUploadedFilesFromGlobalErrorHandler } from '../utils/deleteUploadedFilesFromGlobalErrorHandler'
import {
  handlePrismaClientKnownRequestError,
  handlePrismaClientUnknownError,
  handlePrismaClientValidationError,
  handlerPrismaClientInitializationError,
  handlerPrismaClientRustPanicError
} from '../shared/handlePrismaError'
interface TErrorSource {
  path: string
  message: string
}

interface TErrorResponse {
  success: false
  message: string
  errorSource?: TErrorSource[]
  stack?: string
}

const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (envConfig.NODE_ENV === 'development') {
    console.error(err)
  }

  await deleteUploadedFilesFromGlobalErrorHandler(req)
  let statusCode: number = status.INTERNAL_SERVER_ERROR
  let message = 'Internal Server Error'
  let errorSources: TErrorSource[] = []
  let stack: string | undefined = undefined

  // Custom application errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(err)
    statusCode = simplifiedError.statusCode as number
    message = simplifiedError.message
    errorSources = [...simplifiedError.errorSources]
    stack = err.stack
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaClientUnknownError(err)
    statusCode = simplifiedError.statusCode as number
    message = simplifiedError.message
    errorSources = [...simplifiedError.errorSources]
    stack = err.stack
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(err)
    statusCode = simplifiedError.statusCode as number
    message = simplifiedError.message
    errorSources = [...simplifiedError.errorSources]
    stack = err.stack
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    const simplifiedError = handlerPrismaClientRustPanicError()
    statusCode = simplifiedError.statusCode as number
    message = simplifiedError.message
    errorSources = [...simplifiedError.errorSources]
    stack = err.stack
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    const simplifiedError = handlerPrismaClientInitializationError(err)
    statusCode = simplifiedError.statusCode as number
    message = simplifiedError.message
    errorSources = [...simplifiedError.errorSources]
    stack = err.stack
  } else if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Zod validation errors
  else if (err instanceof z.ZodError) {
    statusCode = status.BAD_REQUEST
    message = 'Validation failed'

    errorSources = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  }

  // Unexpected errors
  else if (err instanceof Error) {
    message = 'Internal Server Error'
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    ...(errorSources.length > 0 && { errorSources }),
    ...(envConfig.NODE_ENV === 'development' &&
      err instanceof Error && {
        stack: err.stack
      })
  }

  res.status(statusCode).json(errorResponse)
}

export default globalErrorHandler
