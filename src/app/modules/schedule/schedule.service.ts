import { addHours, addMinutes, format } from 'date-fns'
import { prisma } from '../../lib/prisma'
import { IQueryParams } from '../../interface/query.interface'
import { QueryBuilder } from '../../utils/queryBuilder'
import { Prisma, Schedule } from '../../../../generated/prisma/client'

export interface ICreateSchedulePayload {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

const createSchedule = async (payload: ICreateSchedulePayload) => {
  const { startDate, endDate, startTime, endTime } = payload

  const interval = 30
  const currentDate = new Date(startDate)
  const lastDate = new Date(endDate)

  const allSlots: { startDateTime: Date; endDateTime: Date }[] = []

  while (currentDate <= lastDate) {
    const dayStr = format(currentDate, 'yyyy-MM-dd')
    const startHour = Number(startTime.split(':')[0])
    const startMin = Number(startTime.split(':')[1])
    const endHour = Number(endTime.split(':')[0])
    const endMin = Number(endTime.split(':')[1])

    let slotStart = addMinutes(addHours(new Date(dayStr), startHour), startMin)
    const dayEnd = addMinutes(addHours(new Date(dayStr), endHour), endMin)

    while (slotStart < dayEnd) {
      const slotEnd = addMinutes(slotStart, interval)
      allSlots.push({
        startDateTime: slotStart,
        endDateTime: slotEnd
      })
      slotStart = slotEnd
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  if (allSlots.length === 0) {
    return []
  }

  // Batch query to find already existing schedules
  const existingSchedules = await prisma.schedule.findMany({
    where: {
      OR: allSlots.map((slot) => ({
        startDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime
      }))
    }
  })

  const existingSet = new Set(
    existingSchedules.map(
      (s) => `${s.startDateTime.getTime()}_${s.endDateTime.getTime()}`
    )
  )

  const newSlots = allSlots.filter(
    (slot) =>
      !existingSet.has(
        `${slot.startDateTime.getTime()}_${slot.endDateTime.getTime()}`
      )
  )

  if (newSlots.length > 0) {
    await prisma.schedule.createMany({
      data: newSlots
    })
  }

  const result = await prisma.schedule.findMany({
    where: {
      OR: allSlots.map((slot) => ({
        startDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime
      }))
    },
    orderBy: {
      startDateTime: 'asc'
    }
  })

  return result
}

export const scheduleFilterableFields = ['id', 'startDateTime', 'endDateTime']

export const scheduleSearchableFields = ['id', 'startDateTime', 'endDateTime']

export const scheduleIncludeConfig: Partial<
  Record<
    keyof Prisma.ScheduleInclude,
    Prisma.ScheduleInclude[keyof Prisma.ScheduleInclude]
  >
> = {
  appointments: {
    include: {
      doctor: true,
      patient: true,
      //   payment: true,
      //   prescription: true,
      review: true
    }
  },
  doctorSchedules: true
}

const getAllSchedules = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Schedule,
    Prisma.ScheduleWhereInput,
    Prisma.ScheduleInclude
  >(prisma.schedule, query, {
    searchableFields: scheduleSearchableFields,
    filterableFields: scheduleFilterableFields
  })

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .dynamicInclude(scheduleIncludeConfig)
    .sort()
    .fields()
    .execute()

  return result
}

const getScheduleById = async (id: string) => {
  const schedule = await prisma.schedule.findUnique({
    where: {
      id: id
    }
  })
  return schedule
}

export interface IUpdateSchedulePayload {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

const updateSchedule = async (id: string, payload: IUpdateSchedulePayload) => {
  const { startDate, endDate, startTime, endTime } = payload
  const startDateTime = new Date(
    addMinutes(
      addHours(
        `${format(new Date(startDate), 'yyyy-MM-dd')}`,
        Number(startTime.split(':')[0])
      ),
      Number(startTime.split(':')[1])
    )
  )

  const endDateTime = new Date(
    addMinutes(
      addHours(
        `${format(new Date(endDate), 'yyyy-MM-dd')}`,
        Number(endTime.split(':')[0])
      ),
      Number(endTime.split(':')[1])
    )
  )

  const updatedSchedule = await prisma.schedule.update({
    where: {
      id: id
    },
    data: {
      startDateTime: startDateTime,
      endDateTime: endDateTime
    }
  })

  return updatedSchedule
}

const deleteSchedule = async (id: string) => {
  await prisma.schedule.delete({
    where: {
      id: id
    }
  })
  return true
}

export const ScheduleService = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule
}
