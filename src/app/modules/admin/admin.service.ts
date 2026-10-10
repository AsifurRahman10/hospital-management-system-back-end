import { prisma } from '../../lib/prisma'
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

const deleteAdmin = async (id: string) => {
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      id,
      isDeleted: false
    }
  })

  if (!existingAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Admin not found')
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
  deleteAdmin
}
