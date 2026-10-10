import z from 'zod'
import { Request, Response, NextFunction } from 'express'

export const validateRequest = (zodSchema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parseData = zodSchema.safeParse(req.body)
    if (!parseData.success) {
      next(parseData.error)
    }
    console.log(parseData)
    req.body = parseData.data
    next()
  }
}
