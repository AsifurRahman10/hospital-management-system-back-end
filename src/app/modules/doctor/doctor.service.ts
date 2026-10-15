import { Gender } from '../../../../generated/prisma/enums'
import { prisma } from '../../lib/prisma'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'
import { QueryBuilder } from '../../utils/queryBuilder'
import { IQueryParams } from '../../interface/query.interface'
import { Doctor, Prisma } from '../../../../generated/prisma/client'

export const doctorSearchableFields = [
  'name',
  'email',
  'qualifications',
  'designation',
  'currentWorkplace',
  'registrationNumber',
  'doctorSpecialties.specialty.title'
]

export const doctorFilterableFields = [
  'gender',
  'isDeleted',
  'appointmentFee',
  'experience',
  'registrationNumber',
  'specialties.specialtyId',
  'currentWorkplace',
  'designation',
  'qualification',
  'doctorSpecialties.specialty.title',
  'user.role'
]

export const doctorIncludeConfig: Partial<
  Record<
    keyof Prisma.DoctorInclude,
    Prisma.DoctorInclude[keyof Prisma.DoctorInclude]
  >
> = {
  user: true,
  doctorSpecialties: {
    include: {
      specialty: true
    }
  },
  appointments: {
    include: {
      patient: true,
      doctor: true
    }
  },
  doctorSchedules: {
    include: {
      schedule: true
    }
  },
  prescriptions: true,
  reviews: true
}

const getAllDoctors = async (query: IQueryParams) => {
  // const allDoctors = await prisma.doctor.findMany({
  //   include: {
  //     user: true,
  //     doctorSpecialties: {
  //       include: {
  //         specialty: true
  //       }
  //     }
  //   }
  // })
  const queryBuilder = new QueryBuilder<
    Doctor,
    Prisma.DoctorWhereInput,
    Prisma.DoctorInclude
  >(prisma.doctor, query, {
    searchableFields: doctorSearchableFields,
    filterableFields: doctorFilterableFields
  })

  const result = await queryBuilder
    .search()
    .filter()
    .where({ isDeleted: false })
    .dynamicInclude(doctorIncludeConfig, ['user', 'doctorSpecialties'])
    .paginate()
    .sort()
    .fields()
    .execute()

  return result
}

const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findFirst({
    where: {
      id,
      isDeleted: false
    },
    include: {
      user: true,
      doctorSpecialties: {
        include: {
          specialty: true
        }
      }
    }
  })

  if (!doctor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Doctor not found')
  }

  return doctor
}

interface UpdateDoctorPayload {
  id: string
  name?: string
  profilePhoto?: string
  contactNumber?: string
  address?: string
  registrationNumber?: string
  experience?: number
  gender?: Gender
  appointmentFee?: number
  qualifications?: string
  currentWorkplace?: string
  designation?: string
  specialties?: string[]
}

const updateDoctor = async (payload: UpdateDoctorPayload) => {
  const { specialties, ...doctorData } = payload

  const existingDoctor = await prisma.doctor.findFirst({
    where: {
      id: payload.id,
      isDeleted: false
    }
  })

  if (!existingDoctor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Doctor not found')
  }

  if (specialties) {
    const existingSpecialties = await prisma.specialty.findMany({
      where: {
        id: {
          in: specialties
        }
      },
      select: {
        id: true
      }
    })

    if (existingSpecialties.length !== new Set(specialties).size) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'One or more specialties not found'
      )
    }
  }

  const updatedDoctor = await prisma.$transaction(async (tx) => {
    await tx.doctor.update({
      where: { id: payload.id },
      data: doctorData
    })

    if (specialties !== undefined) {
      await tx.doctorSpecialty.deleteMany({
        where: {
          doctorId: payload.id
        }
      })

      if (specialties.length > 0) {
        await tx.doctorSpecialty.createMany({
          data: specialties.map((specialtyId) => ({
            doctorId: payload.id,
            specialtyId
          }))
        })
      }
    }

    return tx.doctor.findUniqueOrThrow({
      where: { id: payload.id },
      include: {
        user: true,
        doctorSpecialties: {
          include: {
            specialty: true
          }
        }
      }
    })
  })

  return updatedDoctor
}

const deleteDoctor = async (id: string) => {
  const existingDoctor = await prisma.doctor.findFirst({
    where: {
      id,
      isDeleted: false
    }
  })

  if (!existingDoctor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Doctor not found')
  }

  const deletedDoctor = await prisma.doctor.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  })

  return deletedDoctor
}

export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
}
