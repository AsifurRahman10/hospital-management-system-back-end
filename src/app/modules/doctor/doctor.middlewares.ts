import { NextFunction, Request, Response } from 'express'
import {
  IUpdateDoctorInfoPayload,
  IUpdateDoctorProfilePayload
} from './doctor.service'

export const updateMyDoctorProfileMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.data) {
    req.body = JSON.parse(req.body.data)
  }
  const payload: IUpdateDoctorProfilePayload = req.body

  const files = req.files as {
    [fieldName: string]: Express.Multer.File[] | undefined
  }

  if (files?.profilePhoto?.[0]) {
    if (!payload.doctorInfo) {
      payload.doctorInfo = {} as IUpdateDoctorInfoPayload
    }
    payload.doctorInfo.profilePhoto = files.profilePhoto[0].path
  }

  req.body = payload

  next()
}
