import status from 'http-status'
import { prisma } from '../../lib/prisma'
import { PaymentStatus, Role } from '../../../../generated/prisma/enums'
import AppError from '../../shared/AppError'
import { IUser } from '../../interface'

const getDashboardStatsData = async (user: IUser) => {
  let statsData

  switch (user.role) {
    case Role.SUPER_ADMIN:
      statsData = getSuperAdminStatsData()
      break
    case Role.ADMIN:
      statsData = getAdminStatsData()
      break
    case Role.DOCTOR:
      statsData = getDoctorStatsData(user)
      break
    case Role.PATIENT:
      statsData = getPatientStatsData(user)
      break
    default:
      throw new AppError(status.BAD_REQUEST, 'Invalid user role')
  }

  return statsData
}

const getSuperAdminStatsData = async () => {
  const [
    appointmentCount,
    doctorCount,
    patientCount,
    superAdminCount,
    adminCount,
    paymentCount,
    userCount,
    totalRevenue,
    pieChartData,
    barChartData
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.admin.count({
      where: {
        user: {
          role: Role.SUPER_ADMIN
        }
      }
    }),
    prisma.admin.count(),
    prisma.payment.count(),
    prisma.user.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID
      }
    }),
    getPieChartData(),
    getBarChartData()
  ])

  return {
    appointmentCount,
    doctorCount,
    patientCount,
    superAdminCount,
    adminCount,
    paymentCount,
    userCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    pieChartData,
    barChartData
  }
}

const getAdminStatsData = async () => {
  const [
    appointmentCount,
    doctorCount,
    patientCount,
    paymentCount,
    userCount,
    adminCount,
    totalRevenue,
    pieChartData,
    barChartData
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.payment.count(),
    prisma.user.count(),
    prisma.admin.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.PAID
      }
    }),
    getPieChartData(),
    getBarChartData()
  ])

  return {
    appointmentCount,
    doctorCount,
    patientCount,
    paymentCount,
    userCount,
    adminCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    pieChartData,
    barChartData
  }
}

const getDoctorStatsData = async (user: IUser) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email
    }
  })

  const reviewCount = await prisma.review.count({
    where: {
      doctorId: doctorData.id
    }
  })

  const patientCount = await prisma.appointment.groupBy({
    by: ['patientId'],
    _count: {
      id: true
    },
    where: {
      doctorId: doctorData.id
    }
  })

  // const formattedPatientCount = patientCount.map(({_count, patientId}) => ({
  //     patientId,
  //     count: _count.id
  // }));

  const appointmentCount = await prisma.appointment.count({
    where: {
      doctorId: doctorData.id
    }
  })

  const totalRevenue = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      appointment: {
        doctorId: doctorData.id
      },
      status: PaymentStatus.PAID
    }
  })

  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ['status'],
    _count: {
      id: true
    },
    where: {
      doctorId: doctorData.id
    }
  })

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status }) => ({
      status,
      count: _count.id
    }))

  return {
    reviewCount,
    patientCount: patientCount.length,
    appointmentCount,
    totalRevenue: totalRevenue._sum.amount || 0,
    appointmentStatusDistribution: formattedAppointmentStatusDistribution
  }
}

const getPatientStatsData = async (user: IUser) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email
    }
  })

  const appointmentCount = await prisma.appointment.count({
    where: {
      patientId: patientData.id
    }
  })

  const reviewCount = await prisma.review.count({
    where: {
      patientId: patientData.id
    }
  })

  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ['status'],
    _count: {
      id: true
    },
    where: {
      patientId: patientData.id
    }
  })

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status }) => ({
      status,
      count: _count.id
    }))

  return {
    appointmentCount,
    reviewCount,
    appointmentStatusDistribution: formattedAppointmentStatusDistribution
  }
}

const getPieChartData = async () => {
  const appointmentStatusDistribution = await prisma.appointment.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  })

  const formattedAppointmentStatusDistribution =
    appointmentStatusDistribution.map(({ _count, status }) => ({
      status,
      count: _count.id
    }))

  return formattedAppointmentStatusDistribution
}

const getBarChartData = async () => {
  interface AppointmentCountByMonth {
    month: Date
    count: bigint
  }
  const appointmentCountByMonth: AppointmentCountByMonth[] =
    await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "appointments"
        GROUP BY month
        ORDER BY month ASC;
    `

  return appointmentCountByMonth
}

export const StatsService = {
  getDashboardStatsData
}
