import { Role } from '../../../../generated/prisma/client'
import { auth } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'

interface IRegisterPatientPayload {
  name: string
  email: string
  password: string
}

interface ILoginPatientPayload {
  email: string
  password: string
}

const registerPatient = async (payload: IRegisterPatientPayload) => {
  const { name, email, password } = payload
  const createUser = await auth.api.signUpEmail({
    body: { name, email, password, role: Role.PATIENT }
  })

  if (!createUser.user) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create new user'
    )
  }

  // add new patient

  try {
    const createPatient = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          userId: createUser.user.id,
          name: createUser.user.name,
          email: createUser.user.email
        }
      })

      return patient
    })

    return { ...createUser, patient: createPatient }
  } catch (error) {
    console.log('transaction error', error)
    await prisma.user.delete({
      where: {
        id: createUser.user.id
      }
    })
  }
}

const loginUser = async (payload: ILoginPatientPayload) => {
  const { email, password } = payload

  const getUser = await auth.api.signInEmail({
    body: {
      email,
      password
    },
    returnHeaders: true
  })

  return getUser
}

const getMe = async (userId: string) => {
  console.log(userId)
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: {
        include: {
          appointments: true
          // reviews: true
          // prescriptions: true
        }
      },
      doctor: {
        include: {
          doctorSpecialties: true,
          appointments: true
          // reviews: true,
          // prescriptions: true
        }
      },
      admin: true
    }
  })

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found')
  }
  return isUserExist
}

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  headers: Headers
) => {
  const result = await auth.api.changePassword({
    body: {
      currentPassword: oldPassword,
      newPassword,
      revokeOtherSessions: true
    },
    headers: headers
  })

  return result
}

const logout = async (headers: Headers) => {
  return auth.api.signOut({
    headers,
    asResponse: true
  })
}

const verifyEmail = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: {
      email,
      otp
    }
  })

  if (result && !result.user.emailVerified) {
    await prisma.user.update({
      where: {
        email
      },
      data: {
        emailVerified: true
      }
    })
  }

  return true
}

export const AuthServices = {
  registerPatient,
  loginUser,
  getMe,
  changePassword,
  logout,
  verifyEmail
}
