import { NextFunction, Request, Response } from 'express'
import {
  IUpdateAdminInfoPayload,
  IUpdateAdminProfilePayload
} from './admin.service'

export const updateMyAdminProfileMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.data) {
    req.body = JSON.parse(req.body.data)
  }
  const payload: IUpdateAdminProfilePayload = req.body

  const files = req.files as {
    [fieldName: string]: Express.Multer.File[] | undefined
  }

  if (files?.profilePhoto?.[0]) {
    if (!payload.adminInfo) {
      payload.adminInfo = {} as IUpdateAdminInfoPayload
    }
    payload.adminInfo.profilePhoto = files.profilePhoto[0].path
  }

  req.body = payload

  next()
}
