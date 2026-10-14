import z from 'zod'
import { Request, Response, NextFunction } from 'express'

export const validateRequest = (zodSchema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data)
    }
    const parseData = zodSchema.safeParse(req.body)
    if (!parseData.success) {
      next(parseData.error)
    }
    req.body = parseData.data
    next()
  }
}
