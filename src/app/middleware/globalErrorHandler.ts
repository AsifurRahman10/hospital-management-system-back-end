/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import status from 'http-status'
import z from 'zod'
import { envConfig } from '../config'
import { Prisma } from '../../../generated/prisma/client'
import AppError from '../shared/AppError'
import { deleteImageFromCloudinary } from '../config/cloudinary.config'
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

  if (req.file) {
    await deleteImageFromCloudinary(req.file.path)
  }

  if (req.files && Array.isArray(req.files)) {
    const urls = req.files.map((file: Express.Multer.File) => file.path)
    await Promise.all(urls.map((url) => deleteImageFromCloudinary(url)))
  }
  let statusCode: number = status.INTERNAL_SERVER_ERROR
  let message = 'Internal Server Error'
  let errorSource: TErrorSource[] = []

  // Custom application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Zod validation errors
  else if (err instanceof z.ZodError) {
    statusCode = status.BAD_REQUEST
    message = 'Validation failed'

    errorSource = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  }

  // Prisma known request errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        statusCode = status.CONFLICT
        message = 'A record with this value already exists'

        const target = err.meta?.target
        const fields = Array.isArray(target)
          ? target.join(', ')
          : typeof target === 'string'
            ? target
            : undefined

        if (fields) {
          errorSource = [
            {
              path: fields,
              message: 'This value must be unique'
            }
          ]
        }
        break
      }

      case 'P2025':
        statusCode = status.NOT_FOUND
        message = 'Requested record not found'
        break

      case 'P2003':
        statusCode = status.CONFLICT
        message = 'Related record constraint failed'
        break

      default:
        message = 'Database operation failed'
        break
    }
  }

  // Unexpected errors
  else if (err instanceof Error) {
    message = 'Internal Server Error'
  }

  const errorResponse: TErrorResponse = {
    success: false,
    message,
    ...(errorSource.length > 0 && { errorSource }),
    ...(envConfig.NODE_ENV === 'development' &&
      err instanceof Error && {
        stack: err.stack
      })
  }

  res.status(statusCode).json(errorResponse)
}

export default globalErrorHandler
