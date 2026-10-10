import { Specialty } from '../../../../generated/prisma/client'
import { Gender, Role } from '../../../../generated/prisma/enums'
import { auth } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'

interface ICreateDoctorPayload {
  password: string
  doctor: {
    name: string
    email: string
    profilePhoto?: string
    contactNumber?: string
    address?: string
    registrationNumber?: string
    experience?: number
    gender: Gender
    appointmentFee?: number
    qualifications?: string
    currentWorkplace?: string
    designation?: string
  }
  specialties?: string[]
}

interface ICreateAdminPayload {
  password: string
  admin: {
    name: string
    email: string
    profilePhoto?: string
    contactNumber?: string
  }
}

interface ICreateSuperAdminPayload {
  password: string
  superAdmin: {
    name: string
    email: string
    profilePhoto?: string
    contactNumber?: string
  }
}

const createDoctor = async (payload: ICreateDoctorPayload) => {
  const specialties: Specialty[] = []

  for (const item of payload.specialties || []) {
    const specialty = await prisma.specialty.findUnique({
      where: {
        id: item
      }
    })

    if (!specialty) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `Specialty with id ${item} not found`
      )
    }

    specialties.push(specialty)
  }
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.doctor.email
    }
  })

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      `User with email ${payload.doctor.email} already exists`
    )
  }

  const user = await auth.api.signUpEmail({
    body: {
      email: payload.doctor.email,
      password: payload.password,
      role: Role.DOCTOR,
      name: payload.doctor.name,
      needPasswordChange: true
    }
  })

  try {
    const doctorData = await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.create({
        data: {
          userId: user.user.id,
          ...payload.doctor
        }
      })

      const doctorSpecialtiesData = specialties.map((specialty) => ({
        doctorId: doctor.id,
        specialtyId: specialty.id
      }))

      await tx.doctorSpecialty.createMany({
        data: doctorSpecialtiesData
      })
      const doctorDataFiltered = await tx.doctor.findUnique({
        where: {
          id: doctor.id
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          address: true,
          registrationNumber: true,
          experience: true,
          gender: true,
          appointmentFee: true,
          qualifications: true,
          currentWorkplace: true,
          designation: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              name: true
            }
          },
          doctorSpecialties: {
            select: {
              specialty: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      })

      return doctorDataFiltered
    })
    return doctorData
  } catch (error) {
    console.log(error)
    await prisma.user.delete({
      where: {
        id: user.user.id
      }
    })
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create doctor'
    )
  }
}

const createAdmin = async (payload: ICreateAdminPayload) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.admin.email
    }
  })

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      `User with email ${payload.admin.email} already exists`
    )
  }

  const user = await auth.api.signUpEmail({
    body: {
      email: payload.admin.email,
      password: payload.password,
      role: Role.ADMIN,
      name: payload.admin.name,
      needPasswordChange: true
    }
  })

  try {
    const adminData = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          userId: user.user.id,
          ...payload.admin
        }
      })

      const adminDataFiltered = await tx.admin.findUnique({
        where: {
          id: admin.id
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              name: true
            }
          }
        }
      })

      return adminDataFiltered
    })
    return adminData
  } catch (error) {
    console.log(error)
    await prisma.user.delete({
      where: {
        id: user.user.id
      }
    })
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create admin'
    )
  }
}

const createSuperAdmin = async (payload: ICreateSuperAdminPayload) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.superAdmin.email
    }
  })

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      `User with email ${payload.superAdmin.email} already exists`
    )
  }

  const user = await auth.api.signUpEmail({
    body: {
      email: payload.superAdmin.email,
      password: payload.password,
      role: Role.SUPER_ADMIN,
      name: payload.superAdmin.name,
      needPasswordChange: true
    }
  })

  try {
    const superAdminData = await prisma.$transaction(async (tx) => {
      const superAdmin = await tx.superAdmin.create({
        data: {
          userId: user.user.id,
          ...payload.superAdmin
        }
      })

      const superAdminDataFiltered = await tx.superAdmin.findUnique({
        where: {
          id: superAdmin.id
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              name: true
            }
          }
        }
      })

      return superAdminDataFiltered
    })
    return superAdminData
  } catch (error) {
    console.log(error)
    await prisma.user.delete({
      where: {
        id: user.user.id
      }
    })
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create super admin'
    )
  }
}

export const UserService = {
  createDoctor,
  createAdmin,
  createSuperAdmin
}
