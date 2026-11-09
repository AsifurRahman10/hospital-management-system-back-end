import { Gender, PaymentStatus, UserStatus } from '../../../../generated/prisma/enums'
import { prisma } from '../../lib/prisma'
import { IUser } from '../../interface'
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

const getAllDoctors = async (
  query: IQueryParams,
  includeInactiveDoctors = false
) => {
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

  const visibilityFilter = includeInactiveDoctors
    ? {}
    : {
        isDeleted: false,
        user: {
          isDeleted: false,
          status: {
            notIn: [UserStatus.BLOCK, UserStatus.DELETED]
          }
        }
      }

  const result = await queryBuilder
    .search()
    .filter()
    .where(visibilityFilter)
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
      reviews: true,
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
      id: payload.id
    }
  })

  if (!existingDoctor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Doctor not found')
  }

  if (existingDoctor.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Doctor is deleted')
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

export interface IUpdateDoctorInfoPayload {
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
}

export interface IUpdateDoctorSpecialtyPayload {
  specialtyId: string
  shouldDelete?: boolean
}

export interface IUpdateDoctorProfilePayload {
  doctorInfo?: IUpdateDoctorInfoPayload
  specialties?: IUpdateDoctorSpecialtyPayload[]
}

const updateMyProfile = async (
  user: IUser,
  payload: IUpdateDoctorProfilePayload
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email
    }
  })

  if (payload.specialties && payload.specialties.length > 0) {
    const specialtyIds = [
      ...new Set(payload.specialties.map((item) => item.specialtyId))
    ]

    const existingSpecialties = await prisma.specialty.findMany({
      where: {
        id: {
          in: specialtyIds
        },
        isDeleted: false
      },
      select: {
        id: true
      }
    })

    if (existingSpecialties.length !== specialtyIds.length) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'One or more specialties not found'
      )
    }
  }

  const updatedDoctor = await prisma.$transaction(async (tx) => {
    if (payload.doctorInfo) {
      await tx.doctor.update({
        where: {
          id: doctorData.id
        },
        data: {
          ...payload.doctorInfo
        }
      })
    }

    if (payload?.doctorInfo?.name || payload?.doctorInfo?.profilePhoto) {
      const userData = {
        name: payload.doctorInfo.name
          ? payload.doctorInfo.name
          : doctorData.name,
        image: payload.doctorInfo.profilePhoto
          ? payload.doctorInfo.profilePhoto
          : doctorData.profilePhoto
      }
      await tx.user.update({
        where: {
          id: doctorData.userId
        },
        data: {
          ...userData
        }
      })
    }

    if (
      payload.specialties &&
      Array.isArray(payload.specialties) &&
      payload.specialties.length > 0
    ) {
      for (const specialty of payload.specialties) {
        if (specialty.shouldDelete) {
          await tx.doctorSpecialty.deleteMany({
            where: {
              doctorId: doctorData.id,
              specialtyId: specialty.specialtyId
            }
          })
        } else {
          await tx.doctorSpecialty.upsert({
            where: {
              doctorId_specialtyId: {
                doctorId: doctorData.id,
                specialtyId: specialty.specialtyId
              }
            },
            update: {},
            create: {
              doctorId: doctorData.id,
              specialtyId: specialty.specialtyId
            }
          })
        }
      }
    }

    return tx.doctor.findUniqueOrThrow({
      where: {
        id: doctorData.id
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

  await prisma.user.update({
    where: { id: existingDoctor.userId },
    data: {
      isDeleted: true,
      status: UserStatus.DELETED,
      deletedAt: new Date()
    }
  })

  return deletedDoctor
}

const getBestPerformingDoctors = async (limit = 5) => {
  const targetCount = Math.max(1, limit)

  // Fetch active doctors with appointments (for earnings), reviews (for ratings & review count), and user/specialties
  const activeDoctors = await prisma.doctor.findMany({
    where: {
      isDeleted: false,
      user: {
        isDeleted: false,
        status: {
          notIn: [UserStatus.BLOCK, UserStatus.DELETED]
        }
      }
    },
    include: {
      user: true,
      doctorSpecialties: {
        include: {
          specialty: true
        }
      },
      reviews: {
        select: {
          id: true,
          rating: true
        }
      },
      appointments: {
        where: {
          paymentStatus: PaymentStatus.PAID
        },
        select: {
          id: true,
          payment: {
            select: {
              amount: true,
              status: true
            }
          }
        }
      }
    }
  })

  if (!activeDoctors.length) {
    return []
  }

  // Calculate metrics for each doctor
  const processedDoctors = activeDoctors.map((doc) => {
    const reviewCount = doc.reviews.length
    const computedAverageRating =
      reviewCount > 0
        ? doc.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
        : 0

    const averageRating =
      doc.averageRating && doc.averageRating > 0
        ? doc.averageRating
        : computedAverageRating

    const totalEarnings = doc.appointments.reduce((sum, apt) => {
      if (apt.payment && apt.payment.status === PaymentStatus.PAID) {
        return sum + (apt.payment.amount || 0)
      }
      return sum
    }, 0)

    const restDoctor = { ...doc }
    delete (restDoctor as { appointments?: unknown }).appointments
    delete (restDoctor as { reviews?: unknown }).reviews

    return {
      doctor: {
        ...restDoctor,
        averageRating: Number(averageRating.toFixed(1))
      },
      reviewCount,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      averageRating: Number(averageRating.toFixed(1)),
      appointmentCount: doc.appointments.length
    }
  })

  // Normalize scores based on max reviews and earnings in dataset
  const maxReviews = Math.max(...processedDoctors.map((d) => d.reviewCount), 0)
  const maxEarnings = Math.max(...processedDoctors.map((d) => d.totalEarnings), 0)

  // Performance requirements:
  // - average rating >= 4.0
  // - at least 1 review
  // - positive earnings (> 0)
  const scoredDoctors = processedDoctors.map((item) => {
    const normRating = item.averageRating / 5
    const normReviews = maxReviews > 0 ? item.reviewCount / maxReviews : 0
    const normEarnings = maxEarnings > 0 ? item.totalEarnings / maxEarnings : 0

    // Weighted composite score (40% rating, 30% reviews, 30% earnings)
    const score = normRating * 0.4 + normReviews * 0.3 + normEarnings * 0.3

    const meetsRequirement =
      item.averageRating >= 4.0 &&
      item.reviewCount >= 1 &&
      item.totalEarnings > 0

    return {
      ...item.doctor,
      reviewCount: item.reviewCount,
      totalEarnings: item.totalEarnings,
      appointmentCount: item.appointmentCount,
      performanceScore: Number(score.toFixed(3)),
      isBestPerforming: meetsRequirement
    }
  })

  // Separate qualifying doctors and non-qualifying doctors
  const qualifyingDoctors = scoredDoctors
    .filter((d) => d.isBestPerforming)
    .sort((a, b) => b.performanceScore - a.performanceScore)

  const nonQualifyingDoctors = scoredDoctors.filter((d) => !d.isBestPerforming)

  // Fisher-Yates shuffle helper
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // If we have enough qualifying doctors, return top targetCount
  if (qualifyingDoctors.length >= targetCount) {
    return qualifyingDoctors.slice(0, targetCount)
  }

  // If not enough doctors meet requirements, fill remaining slots with random doctors
  const selectedDoctors = [...qualifyingDoctors]
  const remainingNeeded = targetCount - selectedDoctors.length

  const shuffledRemaining = shuffleArray(nonQualifyingDoctors)
  selectedDoctors.push(...shuffledRemaining.slice(0, remainingNeeded))

  return selectedDoctors
}

export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  getBestPerformingDoctors,
  updateDoctor,
  updateMyProfile,
  deleteDoctor
}
