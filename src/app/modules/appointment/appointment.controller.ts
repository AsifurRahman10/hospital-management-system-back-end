import { Request, Response } from 'express'
import status from 'http-status'
import { AppointmentService } from './appointment.service'
import sendResponse from '../../shared/sendResponse'
import catchAsync from '../../shared/catchAsync'
import { IUser } from '../../interface'

const bookAppointment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body
  const user = req.user
  const appointment = await AppointmentService.bookingAppointment(
    payload,
    user?.email as string
  )
  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: 'Appointment booked successfully',
    data: appointment
  })
})

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user
  const query = req.query
  const appointments = await AppointmentService.getMyAppointments(
    query,
    user as IUser
  )
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'Appointments retrieved successfully',
    data: appointments
  })
})

const changeAppointmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.id
    const payload = req.body
    const user = req.user

    const updatedAppointment = await AppointmentService.changeAppointmentStatus(
      appointmentId as string,
      payload,
      user as IUser
    )
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'Appointment status updated successfully',
      data: updatedAppointment
    })
  }
)

const getMySingleAppointment = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.id
    const user = req.user

    const appointment = await AppointmentService.getMySingleAppointment(
      appointmentId as string,
      user as IUser
    )
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: 'Appointment retrieved successfully',
      data: appointment
    })
  }
)

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query
  const appointments = await AppointmentService.getAllAppointments(query)
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'All appointments retrieved successfully',
    data: appointments
  })
})

const bookAppointmentWithPayLater = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body
    const user = req.user
    const appointment = await AppointmentService.bookAppointmentWithPayLater(
      payload,
      user as IUser
    )
    sendResponse(res, {
      success: true,
      statusCode: status.CREATED,
      message: 'Appointment booked successfully with Pay Later option',
      data: appointment
    })
  }
)

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = req.params.id
  const user = req.user
  const paymentInfo = await AppointmentService.initiatePayment(
    appointmentId as string,
    user as IUser
  )

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: 'Payment initiated successfully',
    data: paymentInfo
  })
})

export const AppointmentController = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment
}
