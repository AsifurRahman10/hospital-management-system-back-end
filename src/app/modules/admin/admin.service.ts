import { prisma } from '../../lib/prisma'
import { IUser } from '../../interface'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'

const getAllAdmins = async () => {
  const allAdmins = await prisma.admin.findMany({
    include: {
      user: true
    }
  })

  return allAdmins
}

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findFirst({
    where: {
      id,
      isDeleted: false
    },
    include: {
      user: true
    }
  })

  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Admin not found')
  }

  return admin
}

interface UpdateAdminPayload {
  id: string
  name?: string
  profilePhoto?: string
  contactNumber?: string
}

const updateAdmin = async (payload: UpdateAdminPayload) => {
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      id: payload.id,
      isDeleted: false
    }
  })

  if (!existingAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Admin not found')
  }

  const { id, ...adminData } = payload

  const updatedAdmin = await prisma.admin.update({
    where: { id },
    data: adminData,
    include: {
      user: true
    }
  })

  return updatedAdmin
}

export interface IUpdateAdminInfoPayload {
  name?: string
  profilePhoto?: string
  contactNumber?: string
}

export interface IUpdateAdminProfilePayload {
  adminInfo?: IUpdateAdminInfoPayload
}

const updateMyProfile = async (
  user: IUser,
  payload: IUpdateAdminProfilePayload
) => {
  const adminData = await prisma.admin.findUniqueOrThrow({
    where: {
      email: user.email
    }
  })

  const updatedAdmin = await prisma.$transaction(async (tx) => {
    if (payload.adminInfo) {
      await tx.admin.update({
        where: {
          id: adminData.id
        },
        data: {
          ...payload.adminInfo
        }
      })
    }

    if (payload?.adminInfo?.name || payload?.adminInfo?.profilePhoto) {
      const userData = {
        name: payload.adminInfo.name ? payload.adminInfo.name : adminData.name,
        image: payload.adminInfo.profilePhoto
          ? payload.adminInfo.profilePhoto
          : adminData.profilePhoto
      }
      await tx.user.update({
        where: {
          id: adminData.userId
        },
        data: {
          ...userData
        }
      })
    }

    return tx.admin.findUniqueOrThrow({
      where: {
        id: adminData.id
      },
      include: {
        user: true
      }
    })
  })

  return updatedAdmin
}

const deleteAdmin = async (id: string, userId: string) => {
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      id,
      isDeleted: false
    }
  })

  if (!existingAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Admin not found')
  }

  if (existingAdmin.id !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not allow to make this request'
    )
  }

  const deletedAdmin = await prisma.admin.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  })

  return deletedAdmin
}

export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  updateMyProfile,
  deleteAdmin
}
