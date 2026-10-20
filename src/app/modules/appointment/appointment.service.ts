import { uuidv7 } from 'zod'
import { prisma } from '../../lib/prisma'
import { QueryBuilder } from '../../utils/queryBuilder'
import {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  Role
} from '../../../../generated/prisma/client'
import { IQueryParams } from '../../interface/query.interface'
import { IUser } from '../../interface'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'
import { stripe } from '../../config/stripe.config'
import { envConfig } from '../../config'
interface IBookingAppointmentPayload {
  doctorId: string
  scheduleId: string
}

const bookingAppointment = async (
  payload: IBookingAppointmentPayload,
  email: string
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: email
    }
  })

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false
    }
  })

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId
    }
  })

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id
      }
    }
  })

  const videoCallingId = String(uuidv7())

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        doctorScheduleId: doctorSchedule.scheduleId,
        videoCallingId
      }
    })

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId
        }
      },
      data: {
        isBooked: true
      }
    })

    // update payment table

    const appointmentFee = doctorData.appointmentFee

    if (appointmentFee === null) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Doctor's appointment fee has not been configured."
      )
    }

    const transactionId = String(uuidv7())
    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: appointmentFee,
        transactionId
      }
    })

    const session = await stripe.checkout.sessions.create({
      allowed_payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: `Appointment with Dr. ${doctorData.name}`
            },
            unit_amount: appointmentFee * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        appointmentId: appointmentData.id,
        paymentId: paymentData?.id
      },

      success_url: `${envConfig.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${paymentData.id}`,

      cancel_url: `${envConfig.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`
    })
    return {
      appointmentData,
      paymentData,
      paymentUrl: session.url
    }
  })
  return result
}

export const appointmentFilterableFields = [
  'patientId',
  'doctorId',
  'status',
  'createdAt',
  'updatedAt'
]

export const appointmentSearchableFields = ['patientId', 'doctorId', 'status']

const getMyAppointments = async (query: IQueryParams, user: IUser) => {
  const userData =
    user.role === 'PATIENT'
      ? await prisma.patient.findUniqueOrThrow({
          where: { email: user.email }
        })
      : user.role === 'DOCTOR'
        ? await prisma.doctor.findUniqueOrThrow({
            where: { email: user.email }
          })
        : null

  if (!userData) {
    throw new Error('Unauthorized')
  }
  const where: Prisma.AppointmentWhereInput =
    user.role === 'PATIENT'
      ? { patientId: userData.id }
      : { doctorId: userData.id }

  const queryBuilder = new QueryBuilder<
    Appointment,
    Prisma.AppointmentWhereInput,
    Prisma.AppointmentInclude
  >(prisma.appointment, query, {
    filterableFields: appointmentFilterableFields,
    searchableFields: appointmentSearchableFields
  })

  return queryBuilder
    .where(where)
    .search()
    .filter()
    .paginate()
    .sort()
    .fields()
    .execute()
}

const changeAppointmentStatus = async (
  appointmentId: string,
  appointmentStatus: AppointmentStatus,
  user: IUser
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId
    },
    include: {
      doctor: true,
      patient: true
    }
  })

  const currentStatus = appointmentData.status
  const role = user.role

  // Admin and Super Admin can update to any status.
  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    return prisma.appointment.update({
      where: {
        id: appointmentId
      },
      data: {
        status: appointmentStatus
      }
    })
  }

  // Doctors and patients cannot update completed or cancelled appointments.
  if (
    currentStatus === AppointmentStatus.COMPLETED ||
    currentStatus === AppointmentStatus.CANCELED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Completed or cancelled appointments cannot be updated.'
    )
  }

  // Doctor permissions
  if (role === Role.DOCTOR) {
    // Verify appointment ownership.
    if (user.email !== appointmentData.doctor.email) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You can only update your own appointments.'
      )
    }

    const allowedTransitions: Partial<
      Record<AppointmentStatus, AppointmentStatus[]>
    > = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.INPROGRESS,
        AppointmentStatus.CANCELED
      ],
      [AppointmentStatus.INPROGRESS]: [AppointmentStatus.COMPLETED]
    }

    if (!allowedTransitions[currentStatus]?.includes(appointmentStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot change appointment status from ${currentStatus} to ${appointmentStatus}.`
      )
    }
  }

  // Patient permissions
  else if (role === Role.PATIENT) {
    // Verify appointment ownership.
    if (user.email !== appointmentData.patient.email) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You can only cancel your own appointments.'
      )
    }

    if (
      currentStatus !== AppointmentStatus.SCHEDULED ||
      appointmentStatus !== AppointmentStatus.CANCELED
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Patients can only cancel scheduled appointments.'
      )
    }
  } else {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to update appointment status.'
    )
  }

  return prisma.appointment.update({
    where: {
      id: appointmentId
    },
    data: {
      status: appointmentStatus
    }
  })
}

const getMySingleAppointment = async (appointmentId: string, user: IUser) => {
  const where: Prisma.AppointmentWhereInput = {
    id: appointmentId,
    ...(user.role === Role.PATIENT
      ? {
          patient: {
            email: user.email
          }
        }
      : user.role === Role.DOCTOR
        ? {
            doctor: {
              email: user.email
            }
          }
        : {})
  }

  if (
    user.role !== Role.PATIENT &&
    user.role !== Role.DOCTOR &&
    user.role !== Role.ADMIN &&
    user.role !== Role.SUPER_ADMIN
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to view this appointment.'
    )
  }

  return prisma.appointment.findFirstOrThrow({
    where,
    include: {
      patient: true,
      doctor: true
    }
  })
}

const getAllAppointments = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder<
    Appointment,
    Prisma.AppointmentWhereInput,
    Prisma.AppointmentInclude
  >(prisma.appointment, query, {
    filterableFields: appointmentFilterableFields,
    searchableFields: appointmentSearchableFields
  })

  queryBuilder.filter().sort().paginate().fields().include({
    doctor: true,
    patient: true
  })

  return queryBuilder.execute()
}

interface IBookAppointmentPayload {
  doctorId: string
  scheduleId: string
}

const bookAppointmentWithPayLater = async (
  payload: IBookAppointmentPayload,
  user: IUser
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email
    }
  })

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false
    }
  })

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId
    }
  })

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id
      }
    }
  })

  const videoCallingId = String(uuidv7())

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        doctorScheduleId: doctorSchedule.scheduleId,
        videoCallingId
      }
    })

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId
        }
      },
      data: {
        isBooked: true
      }
    })

    const transactionId = String(uuidv7())

    const appointmentFee = doctorData.appointmentFee

    if (appointmentFee === null) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Doctor's appointment fee has not been configured."
      )
    }

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: appointmentFee,
        transactionId
      }
    })

    return {
      appointment: appointmentData,
      payment: paymentData
    }
  })

  return result
}

const initiatePayment = async (appointmentId: string, user: IUser) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email
    }
  })

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      patientId: patientData.id
    },
    include: {
      doctor: true,
      payment: true
    }
  })

  if (!appointmentData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Appointment not found')
  }

  if (!appointmentData.payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Payment data not found for this appointment'
    )
  }

  if ((appointmentData.payment as { status: string }).status === 'PAID') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment already completed for this appointment'
    )
  }

  if (appointmentData.status === AppointmentStatus.CANCELED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Appointment is canceled')
  }

  if (appointmentData.doctor.appointmentFee === null) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Doctor's appointment fee has not been configured."
    )
  }

  const session = await stripe.checkout.sessions.create({
    allowed_payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'bdt',
          product_data: {
            name: `Appointment with Dr. ${appointmentData.doctor.name}`
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100
        },
        quantity: 1
      }
    ],
    metadata: {
      appointmentId: appointmentData.id,
      paymentId: appointmentData.payment?.id
    },

    success_url: `${envConfig.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,

    cancel_url: `${envConfig.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`
  })

  return {
    paymentUrl: session.url
  }
}

const cancelUnpaidAppointment = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

  const unpaidAppointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinutesAgo
      },
      paymentStatus: PaymentStatus.UNPAID
    }
  })

  const appointmentToCancel = unpaidAppointments.map(
    (appointment) => appointment.id
  )

  await prisma.$transaction(async (tx) => {
    await tx.appointment.updateMany({
      where: {
        id: {
          in: appointmentToCancel
        }
      },
      data: {
        status: AppointmentStatus.CANCELED
      }
    })

    await tx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentToCancel
        }
      }
    })

    for (const unpaidAppointment of unpaidAppointments) {
      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: unpaidAppointment.doctorId,
            scheduleId: unpaidAppointment.doctorScheduleId
          }
        },
        data: {
          isBooked: false
        }
      })
    }
  })
}

export const AppointmentService = {
  bookingAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
  cancelUnpaidAppointment
}
