/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  deleteImageFromCloudinary,
  uploadFileToCloudinary
} from '../../config/cloudinary.config'
import { IUser } from '../../interface'
import { prisma } from '../../lib/prisma'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'
import PDFDocument from 'pdfkit'
import { sendEmail } from '../../utils/email'
import { envConfig } from '../../config'
import { Role } from '../../../../generated/prisma/enums'

export interface ICreatePrescriptionPayload {
  appointmentId: string
  followUpDate: Date
  instructions: string
}

export interface IUpdatePrescriptionPayload {
  followUpDate?: Date
  instructions?: string
}

const givePrescription = async (
  user: IUser,
  payload: ICreatePrescriptionPayload
) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user?.email
    }
  })

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: payload.appointmentId
    },
    include: {
      patient: true,
      doctor: {
        include: {
          doctorSpecialties: true
        }
      },
      schedule: true
    }
  })
  if (appointmentData.doctorId !== doctorData.id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You can only give prescription for your own appointments'
    )
  }

  const isAlreadyPrescribed = await prisma.prescription.findFirst({
    where: {
      appointmentId: payload.appointmentId
    }
  })

  if (isAlreadyPrescribed) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You have already given prescription for this appointment. You can update the prescription instead.'
    )
  }

  const followUpDate = new Date(payload.followUpDate)

  const result = await prisma.$transaction(
    async (tx) => {
      const result = await tx.prescription.create({
        data: {
          ...payload,
          followUpDate,
          doctorId: appointmentData.doctorId,
          patientId: appointmentData.patientId
        }
      })

      const pdfBuffer = await generatePrescriptionPDF({
        doctorName: doctorData.name,
        patientName: appointmentData.patient.name,
        appointmentDate: appointmentData.schedule.startDateTime,
        instructions: payload.instructions,
        followUpDate,
        doctorEmail: doctorData.email,
        patientEmail: appointmentData.patient.email,
        prescriptionId: result.id,
        createdAt: new Date()
      })

      const fileName = `Prescription-${Date.now()}.pdf`
      const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName)
      const pdfUrl = uploadedFile.secure_url

      const updatedPrescription = await tx.prescription.update({
        where: {
          id: result.id
        },
        data: {
          pdfUrl
        }
      })

      try {
        const patient = appointmentData.patient
        const doctor = appointmentData.doctor

        await sendEmail({
          to: patient.email,
          subject: `You have received a new prescription from Dr. ${doctor.name}`,
          templateName: 'prescription',
          templateData: {
            doctorName: doctor.name,
            patientName: patient.name,
            specialization: doctor.doctorSpecialties
              .map((s: any) => s.title)
              .join(', '),
            appointmentDate: new Date(
              appointmentData.schedule.startDateTime
            ).toLocaleString(),
            issuedDate: new Date().toLocaleDateString(),
            prescriptionId: result.id,
            instructions: payload.instructions,
            followUpDate: followUpDate.toLocaleDateString(),
            pdfUrl: pdfUrl
          },
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        })
      } catch (error) {
        console.log('Failed To send email notification for prescription', error)
      }

      return updatedPrescription
    },
    {
      maxWait: 15000,
      timeout: 20000
    }
  )

  return result
}

interface PrescriptionData {
  doctorName: string
  doctorEmail: string
  patientName: string
  patientEmail: string
  followUpDate: Date
  instructions: string
  prescriptionId: string
  appointmentDate: Date
  createdAt: Date
}

const generatePrescriptionPDF = async (
  prescriptionData: PrescriptionData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Prescription ${prescriptionData.prescriptionId}`,
          Author: 'PH Healthcare Services',
          Subject: 'Medical Prescription'
        }
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 48
      const contentWidth = pageWidth - margin * 2

      const colors = {
        primary: '#155EEF',
        dark: '#172B4D',
        text: '#344054',
        muted: '#667085',
        border: '#E4E7EC',
        background: '#F8FAFC',
        white: '#FFFFFF',
        lightBlue: '#EFF6FF',
        success: '#067647',
        successBg: '#ECFDF3'
      }

      const formatDate = (value: string | Date | null | undefined): string => {
        if (!value) return 'Not specified'

        const date = new Date(value)

        if (Number.isNaN(date.getTime())) {
          return 'Not specified'
        }

        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }

      const drawLabel = (
        label: string,
        value: string | null | undefined,
        x: number,
        y: number,
        width: number
      ) => {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(colors.muted)
          .text(label.toUpperCase(), x, y)

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(colors.dark)
          .text(value || 'Not provided', x, y + 15, {
            width,
            lineBreak: false,
            ellipsis: true
          })
      }

      const drawDivider = (y: number) => {
        doc
          .moveTo(margin, y)
          .lineTo(pageWidth - margin, y)
          .lineWidth(1)
          .strokeColor(colors.border)
          .stroke()
      }

      // ==========================================
      // 1. PAGE BACKGROUND & HEADER
      // ==========================================

      doc.rect(0, 0, pageWidth, pageHeight).fill(colors.white)

      doc.rect(0, 0, pageWidth, 155).fill(colors.primary)

      doc
        .font('Helvetica-Bold')
        .fontSize(19)
        .fillColor(colors.white)
        .text('PH Healthcare', margin, 32)

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#DCE8FF')
        .text('YOUR HEALTH, OUR PRIORITY', margin, 57)

      doc
        .font('Helvetica-Bold')
        .fontSize(25)
        .fillColor(colors.white)
        .text('PRESCRIPTION', margin, 88, {
          width: contentWidth,
          align: 'right'
        })

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#E0E7FF')
        .text('MEDICAL PRESCRIPTION DOCUMENT', margin, 120, {
          width: contentWidth,
          align: 'right'
        })

      // ==========================================
      // 2. PRESCRIPTION METADATA
      // ==========================================

      let y = 180

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.muted)
        .text('PRESCRIPTION ID', margin, y)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text(String(prescriptionData.prescriptionId), margin, y + 16, {
          width: 300
        })

      doc
        .roundedRect(pageWidth - margin - 115, y - 5, 115, 25, 12)
        .fill(colors.successBg)

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(colors.success)
        .text('✓  ISSUED', pageWidth - margin - 115, y + 4, {
          width: 115,
          align: 'center'
        })

      y = 218
      drawDivider(y)

      // ==========================================
      // 3. DOCTOR & PATIENT CARDS
      // ==========================================

      y = 237

      const gap = 14
      const cardWidth = (contentWidth - gap) / 2
      const cardHeight = 124
      const rightX = margin + cardWidth + gap

      // Doctor card
      doc
        .roundedRect(margin, y, cardWidth, cardHeight, 10)
        .fill(colors.background)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text('Doctor Information', margin + 14, y + 14)

      drawLabel(
        'Doctor Name',
        `Dr. ${prescriptionData.doctorName}`,
        margin + 14,
        y + 40,
        cardWidth - 28
      )

      drawLabel(
        'Email Address',
        prescriptionData.doctorEmail,
        margin + 14,
        y + 80,
        cardWidth - 28
      )

      // Patient card
      doc
        .roundedRect(rightX, y, cardWidth, cardHeight, 10)
        .fill(colors.background)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text('Patient Information', rightX + 14, y + 14)

      drawLabel(
        'Patient Name',
        prescriptionData.patientName,
        rightX + 14,
        y + 40,
        cardWidth - 28
      )

      drawLabel(
        'Email Address',
        prescriptionData.patientEmail,
        rightX + 14,
        y + 80,
        cardWidth - 28
      )

      // ==========================================
      // 4. APPOINTMENT DETAILS
      // ==========================================

      y = 389

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(colors.dark)
        .text('Prescription Details', margin, y)

      const detailsY = y + 30
      const detailsGap = 16
      const detailsWidth = (contentWidth - detailsGap) / 2

      drawLabel(
        'Appointment Date',
        formatDate(prescriptionData.appointmentDate),
        margin,
        detailsY,
        detailsWidth
      )

      drawLabel(
        'Date Issued',
        formatDate(prescriptionData.createdAt),
        margin + detailsWidth + detailsGap,
        detailsY,
        detailsWidth
      )

      drawLabel(
        'Follow-up Date',
        formatDate(prescriptionData.followUpDate),
        margin,
        detailsY + 44,
        detailsWidth
      )

      y = detailsY + 83
      drawDivider(y)

      // ==========================================
      // 5. INSTRUCTIONS
      // ==========================================

      y += 20

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(colors.dark)
        .text('Doctor’s Instructions', margin, y)

      y += 28

      const instructions = String(
        prescriptionData.instructions || 'No instructions provided.'
      )

      const instructionPadding = 16
      const instructionWidth = contentWidth - instructionPadding * 2
      const instructionText = instructions

      const instructionTextHeight = doc
        .font('Helvetica')
        .fontSize(10)
        .heightOfString(instructionText, {
          width: instructionWidth,
          lineGap: 4
        })

      const boxHeight = Math.max(
        66,
        instructionTextHeight + instructionPadding * 2 + 8
      )

      // Highlighted instruction box
      doc
        .roundedRect(margin, y, contentWidth, boxHeight, 9)
        .fill(colors.lightBlue)

      doc.roundedRect(margin, y, 4, boxHeight, 2).fill(colors.primary)

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(colors.text)
        .text(instructionText, margin + instructionPadding, y + 17, {
          width: instructionWidth,
          lineGap: 4
        })

      y += boxHeight + 24

      // ==========================================
      // 6. IMPORTANT REMINDER
      // ==========================================

      const reminderHeight = 69

      // Keep the reminder with its heading when moving to a new page.
      if (y + reminderHeight > 750) {
        doc.addPage({ size: 'A4', margin: 0 })
        doc.rect(0, 0, pageWidth, pageHeight).fill(colors.white)
        y = 55
      }

      doc
        .roundedRect(margin, y, contentWidth, reminderHeight, 9)
        .fill(colors.background)

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(colors.dark)
        .text('Important Reminder', margin + 15, y + 13)

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text(
          'Follow your healthcare provider’s directions. Contact your doctor or pharmacist if you have questions about your treatment.',
          margin + 15,
          y + 31,
          {
            width: contentWidth - 30,
            lineGap: 3
          }
        )

      // ==========================================
      // 7. FOOTER
      // ==========================================

      const footerY = pageHeight - 66

      drawDivider(footerY)

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(colors.dark)
        .text('PH Healthcare Services', margin, footerY + 14, {
          width: contentWidth,
          align: 'center'
        })

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.muted)
        .text(
          'Electronically generated medical document. No signature required.',
          margin,
          footerY + 29,
          {
            width: contentWidth,
            align: 'center'
          }
        )

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.primary)
        .text(envConfig.FRONTEND_URL, margin, footerY + 43, {
          width: contentWidth,
          align: 'center',
          link: envConfig.FRONTEND_URL
        })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

const myPrescriptions = async (user: IUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user?.email
    }
  })

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found')
  }

  if (isUserExists.role === Role.DOCTOR) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        doctor: {
          email: user?.email
        }
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true
      }
    })
    return prescriptions
  }

  if (isUserExists.role === Role.PATIENT) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patient: {
          email: user?.email
        }
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true
      }
    })
    return prescriptions
  }
}

const getAllPrescriptions = async () => {
  const result = await prisma.prescription.findMany({
    include: {
      patient: true,
      doctor: true,
      appointment: true
    }
  })

  return result
}

const updatePrescription = async (
  user: IUser,
  prescriptionId: string,
  payload: any
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user?.email
    }
  })

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found')
  }

  // Fetch current prescription data
  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id: prescriptionId
    },
    include: {
      doctor: true,
      patient: true,
      appointment: {
        include: {
          schedule: true
        }
      }
    }
  })

  // Verify the user is the doctor for this prescription
  if (!(user?.email === prescriptionData.doctor.email)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This is not your prescription!')
  }

  // Prepare updated data
  const updatedInstructions =
    payload.instructions || prescriptionData.instructions
  const updatedFollowUpDate = payload.followUpDate
    ? new Date(payload.followUpDate)
    : prescriptionData.followUpDate

  // Step 1: Generate new PDF with updated data
  const pdfBuffer = await generatePrescriptionPDF({
    doctorName: prescriptionData.doctor.name,
    doctorEmail: prescriptionData.doctor.email,
    patientName: prescriptionData.patient.name,
    patientEmail: prescriptionData.patient.email,
    appointmentDate: prescriptionData.appointment.schedule.startDateTime,
    instructions: updatedInstructions,
    followUpDate: updatedFollowUpDate,
    prescriptionId: prescriptionData.id,
    createdAt: prescriptionData.createdAt
  })

  // Step 2: Upload new PDF to Cloudinary
  const fileName = `prescription-updated-${Date.now()}.pdf`
  const uploadedFile = await uploadFileToCloudinary(pdfBuffer, fileName)
  const newPdfUrl = uploadedFile.secure_url

  // Step 3: Delete old PDF from Cloudinary if it exists
  if (prescriptionData.pdfUrl) {
    try {
      await deleteImageFromCloudinary(prescriptionData.pdfUrl)
    } catch (deleteError) {
      // Log but don't fail
      console.error('Failed to delete old PDF from Cloudinary:', deleteError)
    }
  }

  // Step 4: Update prescription in database
  const result = await prisma.prescription.update({
    where: {
      id: prescriptionId
    },
    data: {
      instructions: updatedInstructions,
      followUpDate: updatedFollowUpDate,
      pdfUrl: newPdfUrl
    },
    include: {
      patient: true,
      doctor: true,
      appointment: {
        include: {
          schedule: true
        }
      }
    }
  })

  // Step 5: Send updated prescription email to patient
  try {
    await sendEmail({
      to: result.patient.email,
      subject: `Your Prescription has been Updated by ${result.doctor.name}`,
      templateName: 'prescription',
      templateData: {
        patientName: result.patient.name,
        doctorName: result.doctor.name,
        specialization: 'Healthcare Provider',
        prescriptionId: result.id,
        appointmentDate: new Date(
          result.appointment.schedule.startDateTime
        ).toLocaleString(),
        issuedDate: new Date(result.createdAt).toLocaleDateString(),
        followUpDate: new Date(result.followUpDate).toLocaleDateString(),
        instructions: result.instructions,
        pdfUrl: newPdfUrl
      },
      attachments: [
        {
          filename: `Prescription-${result.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })
  } catch (emailError) {
    // Log email error but don't fail the prescription update
    console.error('Failed to send updated prescription email:', emailError)
  }

  return result
}

const deletePrescription = async (
  user: IUser,
  prescriptionId: string
): Promise<void> => {
  // Verify user exists
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: user?.email
    }
  })

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found')
  }

  // Fetch prescription data
  const prescriptionData = await prisma.prescription.findUniqueOrThrow({
    where: {
      id: prescriptionId
    },
    include: {
      doctor: true
    }
  })

  // Verify the user is the doctor for this prescription
  if (!(user?.email === prescriptionData.doctor.email)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This is not your prescription!')
  }

  // Delete PDF from Cloudinary if it exists
  if (prescriptionData.pdfUrl) {
    try {
      await deleteImageFromCloudinary(prescriptionData.pdfUrl)
    } catch (deleteError) {
      // Log but don't fail - still delete from database
      console.error('Failed to delete PDF from Cloudinary:', deleteError)
    }
  }

  // Delete prescription from database
  await prisma.prescription.delete({
    where: {
      id: prescriptionId
    }
  })
}

export const PrescriptionService = {
  givePrescription,
  myPrescriptions,
  getAllPrescriptions,
  updatePrescription,
  deletePrescription
}
