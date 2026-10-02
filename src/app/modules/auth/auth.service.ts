import { Role } from '../../../../generated/prisma/client'
import { auth } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

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
    throw new Error('Failed to create new user')
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
    }
  })

  return getUser
}

export const AuthServices = { registerPatient, loginUser }
