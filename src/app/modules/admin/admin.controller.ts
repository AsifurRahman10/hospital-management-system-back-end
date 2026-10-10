/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { AdminService } from './admin.service'

const getAllAdmins = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await AdminService.getAllAdmins()

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admins retrieved successfully',
      data: data
    })
  }
)

const getAdminById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    const data = await AdminService.getAdminById(id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin retrieved successfully',
      data
    })
  }
)

const updateAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    const payload = { id, ...req.body }

    const data = await AdminService.updateAdmin(payload)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin updated successfully',
      data
    })
  }
)

const deleteAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params

    await AdminService.deleteAdmin(id as string)

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin deleted successfully'
    })
  }
)

export const AdminController = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
}
