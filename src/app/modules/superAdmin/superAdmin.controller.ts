/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { SuperAdminService } from './superAdmin.service'

const getAllSuperAdmins = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await SuperAdminService.getAllSuperAdmins()

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Super admins retrieved successfully',
      data: data
    })
  }
)

const getSuperAdminById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const data = await SuperAdminService.getSuperAdminById(id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Super admin retrieved successfully',
      data
    })
  }
)

const updateSuperAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const payload = { id, ...req.body }

    const data = await SuperAdminService.updateSuperAdmin(payload)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Super admin updated successfully',
      data
    })
  }
)

const deleteSuperAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    await SuperAdminService.deleteSuperAdmin(id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Super admin deleted successfully'
    })
  }
)

export const SuperAdminController = {
  getAllSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin
}
