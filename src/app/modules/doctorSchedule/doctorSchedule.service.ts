import { DoctorSchedules, Prisma } from '../../../../generated/prisma/client'
import { IQueryParams } from '../../interface/query.interface'
import { prisma } from '../../lib/prisma'
import { QueryBuilder } from '../../utils/queryBuilder'

export interface ICreateDoctorSchedulePayload {
  scheduleIds: string[]
}

const createDoctorWiseSchedule = async (
  userEmail: string,
  payload: ICreateDoctorSchedulePayload
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: userEmail
    }
  })

  const doctorScheduleData = payload.scheduleIds.map((scheduleId) => ({
    doctorId: doctorData.id,
    scheduleId
  }))

  await prisma.doctorSchedules.createMany({
    data: doctorScheduleData
  })

  const result = await prisma.doctorSchedules.findMany({
    where: {
      doctorId: doctorData.id,
      scheduleId: {
        in: payload.scheduleIds
      }
    },
    include: {
      schedule: true
    }
  })

  return result
}

export const doctorScheduleSearchableFields = ['id', 'doctorId', 'scheduleId']

export const doctorScheduleFilterableFields = [
  'id',
  'doctorId',
  'scheduleId',
  'createdAt',
  'updatedAt',
  'isBooked',
  'schedule.startDateTime',
  'schedule.endDateTime'
]

export const doctorScheduleIncludeConfig: Partial<
  Record<
    keyof Prisma.DoctorSchedulesInclude,
    Prisma.DoctorSchedulesInclude[keyof Prisma.DoctorSchedulesInclude]
  >
> = {
  doctor: {
    include: {
      user: true,
      appointments: true,
      doctorSpecialties: true
    }
  },
  schedule: true
}

const getDoctorWiseAllSchedule = async (email: string, query: IQueryParams) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: email
    }
  })
  const queryBuilder = new QueryBuilder<
    DoctorSchedules,
    Prisma.DoctorSchedulesWhereInput,
    Prisma.DoctorSchedulesInclude
  >(
    prisma.doctorSchedules,
    {
      doctorId: doctorData.id,
      ...query
    },
    {
      filterableFields: doctorScheduleFilterableFields,
      searchableFields: doctorScheduleSearchableFields
    }
  )
  const doctorSchedules = await queryBuilder
    .search()
    .filter()
    .paginate()
    .include({
      schedule: true,
      doctor: {
        include: {
          user: true
        }
      }
    })
    .sort()
    .fields()
    .dynamicInclude(doctorScheduleIncludeConfig)
    .execute()
  return doctorSchedules
}

const getAllDoctorSchedules = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    DoctorSchedules,
    Prisma.DoctorSchedulesWhereInput,
    Prisma.DoctorSchedulesInclude
  >(prisma.doctorSchedules, query, {
    filterableFields: doctorScheduleFilterableFields,
    searchableFields: doctorScheduleSearchableFields
  })

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(doctorScheduleIncludeConfig)
    .sort()
    .execute()

  return result
}

const getDoctorScheduleById = async (doctorId: string, scheduleId: string) => {
  const doctorSchedule = await prisma.doctorSchedules.findUnique({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorId,
        scheduleId: scheduleId
      }
    },
    include: {
      schedule: true,
      doctor: true
    }
  })
  return doctorSchedule
}

export interface IUpdateDoctorSchedulePayload {
  scheduleIds: {
    shouldDelete: boolean
    id: string
  }[]
}

const updateOwnDoctorSchedule = async (
  email: string,
  payload: IUpdateDoctorSchedulePayload
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: email
    }
  })

  const deleteIds = payload.scheduleIds
    .filter((schedule) => schedule.shouldDelete)
    .map((schedule) => schedule.id)
  const createIds = payload.scheduleIds
    .filter((schedule) => !schedule.shouldDelete)
    .map((schedule) => schedule.id)

  const result = await prisma.$transaction(async (tx) => {
    await tx.doctorSchedules.deleteMany({
      where: {
        isBooked: false,
        doctorId: doctorData.id,
        scheduleId: {
          in: deleteIds
        }
      }
    })

    const doctorScheduleData = createIds.map((scheduleId) => ({
      doctorId: doctorData.id,
      scheduleId
    }))

    const result = await tx.doctorSchedules.createMany({
      data: doctorScheduleData
    })

    return result
  })

  return result
}

const deleteOwnDoctorSchedule = async (id: string, email: string) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: email
    }
  })

  await prisma.doctorSchedules.deleteMany({
    where: {
      isBooked: false,
      doctorId: doctorData.id,
      scheduleId: id
    }
  })
}

export const DoctorScheduleService = {
  createDoctorWiseSchedule,
  getDoctorWiseAllSchedule,
  getAllDoctorSchedules,
  getDoctorScheduleById,
  updateOwnDoctorSchedule,
  deleteOwnDoctorSchedule
}
