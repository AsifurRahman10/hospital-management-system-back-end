import { IUser } from '../../interface'
import { prisma } from '../../lib/prisma'
import AppError from '../../shared/AppError'
import httpStatus from 'http-status'
import PDFDocument from 'pdfkit'

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
      schedules: {
        include: {
          doctorSchedules: true
        }
      }
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
        appointmentDate: appointmentData.schedules[0].startDateTime,
        instructions: payload.instructions,
        followUpDate,
        doctorEmail: doctorData.email,
        patientEmail: appointmentData.patient.email,
        prescriptionId: result.id,
        createdAt: new Date()
      })

      const fileName = `Prescription-${Date.now()}.pdf`
      const uploadedFile = await uploadImageToCloudinary(pdfBuffer, fileName)
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
            specialization: doctor.specialties
              .map((s: any) => s.title)
              .join(', '),
            appointmentDate: new Date(
              appointmentData.schedules[0].startDateTime
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

export const generatePrescriptionPDF = async (
  prescriptionData: PrescriptionData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk) => {
        chunks.push(chunk)
      })

      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      doc.on('error', (error) => {
        reject(error)
      })

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('PRESCRIPTION', {
        align: 'center'
      })

      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica').text('PH Healthcare Services', {
        align: 'center'
      })
      doc.text('Your Health, Our Priority', { align: 'center' })

      doc.moveDown(1)

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

      doc.moveDown(1)

      // Doctor Information
      doc.fontSize(11).font('Helvetica-Bold').text('Doctor Information')
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${prescriptionData.doctorName}`)
        .text(`Email: ${prescriptionData.doctorEmail}`)

      doc.moveDown(0.8)

      // Patient Information
      doc.fontSize(11).font('Helvetica-Bold').text('Patient Information')
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${prescriptionData.patientName}`)
        .text(`Email: ${prescriptionData.patientEmail}`)

      doc.moveDown(0.8)

      // Appointment & Prescription Details
      doc.fontSize(11).font('Helvetica-Bold').text('Prescription Details')
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Prescription ID: ${prescriptionData.prescriptionId}`)
        .text(
          `Appointment Date: ${new Date(prescriptionData.appointmentDate).toLocaleDateString()}`
        )
        .text(
          `Issued Date: ${new Date(prescriptionData.createdAt).toLocaleDateString()}`
        )

      if (prescriptionData.followUpDate) {
        doc.text(
          `Follow-up Date: ${new Date(prescriptionData.followUpDate).toLocaleDateString()}`
        )
      }

      doc.moveDown(1)

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

      doc.moveDown(1)

      // Instructions/Medications
      doc.fontSize(11).font('Helvetica-Bold').text('Instructions')
      doc.fontSize(10).font('Helvetica')

      // Wrap text for long instructions
      doc.text(prescriptionData.instructions, {
        align: 'left',
        width: 445
      })

      doc.moveDown(1)

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

      doc.moveDown(1)

      // Footer
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          'This is an electronically generated prescription. Please follow all instructions provided by your doctor.',
          {
            align: 'center'
          }
        )

      doc.text(`For more information, visit: ${envVars.FRONTEND_URL}`, {
        align: 'center'
      })

      // End the document
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
