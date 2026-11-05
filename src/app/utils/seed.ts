import {
  AppointmentStatus,
  PaymentStatus,
  Role
} from '../../../generated/prisma/enums'
import { envConfig } from '../config'
import { auth } from '../lib/auth'
import { prisma } from '../lib/prisma'
import { v7 as uuidv7 } from 'uuid'

const demoDoctorEmails = [
  'doctor.sarah@demo.hms',
  'doctor.michael@demo.hms',
  'doctor.aisha@demo.hms'
]

const demoPatientEmails = [
  'patient.alex@demo.hms',
  'patient.maria@demo.hms',
  'patient.james@demo.hms',
  'patient.nadia@demo.hms'
]

const getMonthDate = (monthOffset: number, day: number, hour: number) => {
  const date = new Date()
  date.setUTCDate(1)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCMonth(date.getUTCMonth() + monthOffset)
  date.setUTCDate(day)
  date.setUTCHours(hour, 0, 0, 0)
  return date
}

export const seedDemoAppointments = async () => {
  const doctors = await prisma.doctor.findMany({
    where: { email: { in: demoDoctorEmails } },
    orderBy: { email: 'asc' }
  })
  const patients = await prisma.patient.findMany({
    where: { email: { in: demoPatientEmails } },
    orderBy: { email: 'asc' }
  })

  if (doctors.length < 3 || patients.length < 4) {
    throw new Error(
      'Demo doctors or patients are missing. Run the full demo seed before seeding appointments.'
    )
  }

  let createdOrUpdated = 0

  for (let monthOffset = -9; monthOffset <= 0; monthOffset += 1) {
    const isCurrentMonth = monthOffset === 0
    const status = isCurrentMonth
      ? AppointmentStatus.SCHEDULED
      : AppointmentStatus.COMPLETED
    const paymentStatus = isCurrentMonth
      ? PaymentStatus.UNPAID
      : PaymentStatus.PAID

    for (let slot = 0; slot < 2; slot += 1) {
      const doctor = doctors[(monthOffset + 9 + slot) % doctors.length]
      const patient = patients[(monthOffset + 9 + slot) % patients.length]
      const day = slot === 0 ? 8 : 22
      const hour = slot === 0 ? 10 : 14
      const startDateTime = getMonthDate(monthOffset, day, hour)
      const endDateTime = new Date(startDateTime.getTime() + 45 * 60 * 1000)

      const schedule =
        (await prisma.schedule.findFirst({
          where: { startDateTime, endDateTime }
        })) ||
        (await prisma.schedule.create({
          data: { startDateTime, endDateTime }
        }))

      await prisma.doctorSchedules.upsert({
        where: {
          doctorId_scheduleId: {
            doctorId: doctor.id,
            scheduleId: schedule.id
          }
        },
        update: { isBooked: true },
        create: {
          doctorId: doctor.id,
          scheduleId: schedule.id,
          isBooked: true
        }
      })

      const appointment = await prisma.appointment.upsert({
        where: { doctorScheduleId: schedule.id },
        update: {
          patientId: patient.id,
          doctorId: doctor.id,
          scheduleId: schedule.id,
          status,
          paymentStatus,
          createdAt: startDateTime
        },
        create: {
          patientId: patient.id,
          doctorId: doctor.id,
          scheduleId: schedule.id,
          doctorScheduleId: schedule.id,
          videoCallingId: uuidv7(),
          status,
          paymentStatus,
          createdAt: startDateTime
        }
      })

      await prisma.payment.upsert({
        where: { appointmentId: appointment.id },
        update: {
          amount: doctor.appointmentFee || 0,
          status: paymentStatus
        },
        create: {
          appointmentId: appointment.id,
          amount: doctor.appointmentFee || 0,
          transactionId: uuidv7(),
          status: paymentStatus
        }
      })

      createdOrUpdated += 1
    }
  }

  console.log(
    `Seeded ${createdOrUpdated} appointments across 10 calendar months.`
  )
}

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN
      }
    })

    if (isSuperAdminExist) {
      console.log('Super admin already exists. Skipping seeding super admin.')
      return
    }

    const superAdminUser = await auth.api.signUpEmail({
      body: {
        email: envConfig.SUPER_ADMIN_EMAIL,
        password: envConfig.SUPER_ADMIN_PASSWORD,
        name: 'Super Admin',
        role: Role.SUPER_ADMIN,
        needPasswordChange: false,
        rememberMe: false
      }
    })

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: superAdminUser.user.id
        },
        data: {
          emailVerified: true
        }
      })

      await tx.admin.create({
        data: {
          userId: superAdminUser.user.id,
          name: 'Super Admin',
          email: envConfig.SUPER_ADMIN_EMAIL
        }
      })
    })

    const superAdmin = await prisma.admin.findFirst({
      where: {
        email: envConfig.SUPER_ADMIN_EMAIL
      },
      include: {
        user: true
      }
    })

    console.log('Super Admin Created ', superAdmin)
  } catch (error) {
    console.error('Error seeding super admin: ', error)
    await prisma.user.delete({
      where: {
        email: envConfig.SUPER_ADMIN_EMAIL
      }
    })
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  try {
    await seedDemoAppointments()
  } finally {
    await prisma.$disconnect()
  }
}
