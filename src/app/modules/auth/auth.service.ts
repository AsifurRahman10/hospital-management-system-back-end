import { Role, UserStatus } from '../../../../generated/prisma/client'
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
  headers: Headers,
  userId: string
) => {
  const googleAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'google'
    }
  })

  if (googleAccount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Google accounts cannot change their password. Continue using Google to sign in.'
    )
  }

  const result = await auth.api.changePassword({
    body: {
      currentPassword: oldPassword,
      newPassword,
      revokeOtherSessions: true
    },
    headers: headers
  })

  await prisma.user.updateMany({
    where: {
      id: userId,
      needPasswordChange: true
    },
    data: {
      needPasswordChange: false
    }
  })

  return result
}

const completeGoogleLogin = async (headers: Headers) => {
  const sessionData = await auth.api.getSession({ headers })

  if (!sessionData) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google authentication failed')
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionData.user.id },
    include: { accounts: true }
  })

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User account was not found')
  }

  const googleAccount = user.accounts.some(
    (account) => account.providerId === 'google'
  )

  if (!googleAccount || user.role !== Role.PATIENT) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Only patient accounts can sign in with Google'
    )
  }

  const patient = await prisma.patient.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: user.name,
      email: user.email,
      profilePhoto: user.image
    },
    update: {
      name: user.name,
      email: user.email,
      profilePhoto: user.image
    }
  })

  return { user, patient }
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

const forgetPassword = async (email: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email
    }
  })

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found')
  }
  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is not verified')
  }

  return auth.api.requestPasswordResetEmailOTP({
    body: {
      email
    }
  })
}

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email
    }
  })
  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found')
  }
  if (!isUserExist.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is not verified')
  }
  if (isUserExist.isDeleted || isUserExist.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User is deleted')
  }

  const googleAccount = await prisma.account.findFirst({
    where: {
      userId: isUserExist.id,
      providerId: 'google'
    }
  })

  if (googleAccount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Google accounts cannot reset their password. Continue using Google to sign in.'
    )
  }

  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password: newPassword
    }
  })

  if (isUserExist.needPasswordChange) {
    await prisma.user.update({
      where: {
        email
      },
      data: {
        needPasswordChange: false
      }
    })
  }

  await prisma.session.deleteMany({
    where: {
      userId: isUserExist.id
    }
  })
}

export const AuthServices = {
  registerPatient,
  loginUser,
  getMe,
  changePassword,
  completeGoogleLogin,
  logout,
  verifyEmail,
  forgetPassword,
  resetPassword
}
