import { prisma } from '../../lib/prisma'
import { IUser } from '../../interface'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'
import { Role, UserStatus } from '../../../../generated/prisma/enums'

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

export interface IChangeUserStatusPayload {
  userId: string
  userStatus: UserStatus
}
const changeUserStatus = async (
  user: IUser,
  payload: IChangeUserStatusPayload
) => {
  const isAdminExists = await prisma.admin.findUniqueOrThrow({
    where: {
      email: user.email
    },
    include: {
      user: true
    }
  })

  const { userId, userStatus } = payload

  const userToChangeStatus = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    }
  })

  const selfStatusChange = isAdminExists.userId === userId

  if (selfStatusChange) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot change your own status'
    )
  }

  if (
    isAdminExists.user.role === Role.ADMIN &&
    userToChangeStatus.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot change the status of super admin. Only super admin can change the status of another super admin'
    )
  }

  if (
    isAdminExists.user.role === Role.ADMIN &&
    userToChangeStatus.role === Role.ADMIN
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot change the status of another admin. Only super admin can change the status of another admin'
    )
  }

  if (userStatus === UserStatus.DELETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot set user status to deleted. To delete a user, you have to use role specific delete api. For example, to delete an doctor user, you have to use delete doctor api which will set the user status to deleted and also set isDeleted to true and also delete the user session and account'
    )
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      status: userStatus
    }
  })

  return updatedUser
}

export interface IChangeUserRolePayload {
  userId: string
  role: Role
}

const changeUserRole = async (user: IUser, payload: IChangeUserRolePayload) => {
  const isSuperAdminExists = await prisma.admin.findFirstOrThrow({
    where: {
      email: user.email,
      user: {
        role: Role.SUPER_ADMIN
      }
    },
    include: {
      user: true
    }
  })

  const { userId, role } = payload

  const userToChangeRole = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    }
  })

  const selfRoleChange = isSuperAdminExists.userId === userId

  if (selfRoleChange) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot change your own role'
    )
  }

  if (
    userToChangeRole.role === Role.DOCTOR ||
    userToChangeRole.role === Role.PATIENT
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You cannot change the role of doctor or patient user. If you want to change the role of doctor or patient user, you have to delete the user and recreate with new role'
    )
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      role
    }
  })

  return updatedUser
}

export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  updateMyProfile,
  deleteAdmin,
  changeUserStatus,
  changeUserRole
}
