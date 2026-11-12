import { Role } from '../../../../generated/prisma/enums'
import { prisma } from '../../lib/prisma'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'

const getAllSuperAdmins = async () => {
  const allSuperAdmins = await prisma.admin.findMany({
    where: {
      user: {
        role: Role.SUPER_ADMIN
      }
    },
    include: {
      user: true
    }
  })

  return allSuperAdmins
}

const getSuperAdminById = async (id: string) => {
  const superAdmin = await prisma.admin.findFirst({
    where: {
      id,
      isDeleted: false,
      user: {
        role: Role.SUPER_ADMIN
      }
    },
    include: {
      user: true
    }
  })

  if (!superAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Super admin not found')
  }

  return superAdmin
}

interface UpdateSuperAdminPayload {
  id: string
  name?: string
  profilePhoto?: string
  contactNumber?: string
}

const updateSuperAdmin = async (payload: UpdateSuperAdminPayload) => {
  const existingSuperAdmin = await prisma.admin.findFirst({
    where: {
      id: payload.id,
      isDeleted: false,
      user: {
        role: Role.SUPER_ADMIN
      }
    }
  })

  if (!existingSuperAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Super admin not found')
  }

  const { id, ...superAdminData } = payload

  const updatedSuperAdmin = await prisma.admin.update({
    where: { id },
    data: superAdminData,
    include: {
      user: true
    }
  })

  return updatedSuperAdmin
}

const deleteSuperAdmin = async (id: string) => {
  const existingSuperAdmin = await prisma.admin.findFirst({
    where: {
      id,
      isDeleted: false,
      user: {
        role: Role.SUPER_ADMIN
      }
    }
  })

  if (!existingSuperAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, 'Super admin not found')
  }

  const deletedSuperAdmin = await prisma.admin.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  })

  return deletedSuperAdmin
}

export const SuperAdminService = {
  getAllSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin
}
