import { NextFunction, Request, RequestHandler, Response } from 'express'

const catchAsync = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'something went wrong',
        error: error.message
      })
    }
  }
}

export default catchAsync
