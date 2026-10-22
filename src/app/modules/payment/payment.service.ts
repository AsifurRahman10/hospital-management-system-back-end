/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'
import { prisma } from '../../lib/prisma'
import { PaymentStatus } from '../../../../generated/prisma/enums'
import PDFDocument from 'pdfkit'
import { uploadFileToCloudinary } from '../../config/cloudinary.config'
import { sendEmail } from '../../utils/email'

const handleStripeWebHookEvent = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id
    }
  })
  if (existingPayment) {
    console.log(`payment ${event.id} is already being processed, skipping`)
    return {
      message: `payment ${event.id} is already being processed, skipping`
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any

      const appointmentId = session.metadata?.appointmentId
      const paymentId = session.metadata?.paymentId

      if (!appointmentId || !paymentId) {
        console.error('⚠️ Missing metadata in webhook event')
        return { message: 'Missing metadata' }
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          doctor: true,
          schedule: true,
          payment: true
        }
      })

      if (!appointment) {
        console.error(
          `⚠️ Appointment ${appointmentId} not found. Payment may be for expired appointment.`
        )
        return { message: 'Appointment not found' }
      }

      const appointmentSchedule = await prisma.schedule.findUnique({
        where: { id: appointment.doctorScheduleId },
        select: { startDateTime: true }
      })

      let pdfBuffer: Buffer | null = null

      const result = await prisma.$transaction(async (tx) => {
        const updatedAppointment = await tx.appointment.update({
          where: {
            id: appointmentId
          },
          data: {
            paymentStatus:
              session.payment_status === 'paid'
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID
          }
        })

        let invoiceUrl = null

        if (session.payment_status === 'paid' && appointmentSchedule) {
          try {
            pdfBuffer = await generateInvoicePdf({
              invoiceId: appointment.payment?.id || paymentId,
              patientName: appointment.patient.name,
              patientEmail: appointment.patient.email,
              doctorName: appointment.doctor.name,
              appointmentDate: appointmentSchedule.startDateTime.toISOString(),
              amount: appointment.payment?.amount || 0,
              transactionId: appointment.payment?.transactionId || '',
              paymentDate: new Date().toISOString()
            })

            // Upload PDF to Cloudinary
            const cloudinaryResponse = await uploadFileToCloudinary(
              pdfBuffer,
              `ph-healthcare/invoices/invoice-${paymentId}-${Date.now()}.pdf`
            )

            invoiceUrl = cloudinaryResponse?.secure_url

            console.log(
              `✅ Invoice PDF generated and uploaded for payment ${paymentId}`
            )
          } catch (pdfError) {
            console.error(
              '❌ Error generating/uploading invoice PDF:',
              pdfError
            )
          }
        } else if (session.payment_status === 'paid') {
          console.error(
            `❌ Schedule ${appointment.doctorScheduleId} not found; skipping invoice PDF generation.`
          )
        }

        const updatedPayment = await tx.payment.update({
          where: {
            id: paymentId
          },
          data: {
            status:
              session.payment_status === 'paid'
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            paymentGatewayData: session,
            invoiceUrl: invoiceUrl, // Store invoice URL
            stripeEventId: event.id // Store event ID for idempotency
          }
        })

        return { updatedAppointment, updatedPayment, invoiceUrl }
      })

      if (session.payment_status === 'paid' && result.invoiceUrl) {
        try {
          await sendEmail({
            to: appointment.patient.email,
            subject: `Payment Confirmation & Invoice - Appointment with ${appointment.doctor.name}`,
            templateName: 'invoice',
            templateData: {
              patientName: appointment.patient.name,
              invoiceId: appointment.payment?.id || paymentId,
              transactionId: appointment.payment?.transactionId || '',
              paymentDate: new Date().toLocaleDateString(),
              doctorName: appointment.doctor.name,
              appointmentDate:
                appointmentSchedule?.startDateTime.toLocaleDateString() ??
                'N/A',
              amount: appointment.payment?.amount || 0,
              invoiceUrl: result.invoiceUrl
            },
            attachments: [
              {
                filename: `Invoice-${paymentId}.pdf`,
                content: pdfBuffer || Buffer.from(''),
                contentType: 'application/pdf'
              }
            ]
          })

          console.log(`✅ Invoice email sent to ${appointment.patient.email}`)
        } catch (emailError) {
          console.error('❌ Error sending invoice email:', emailError)
        }
      }

      console.log(
        `✅ Payment ${session.payment_status} for appointment ${appointmentId}`
      )
      break
    }
    case 'checkout.session.expired': {
      const session = event.data.object

      console.log(
        `Checkout session ${session.id} expired. Marking associated payment as failed.`
      )
      break
    }
    case 'payment_intent.payment_failed': {
      const session = event.data.object

      console.log(
        `Payment intent ${session.id} failed. Marking associated payment as failed.`
      )
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return { message: `Webhook Event ${event.id} processed successfully` }
}

interface InvoiceData {
  invoiceId: string
  patientName: string
  patientEmail: string
  doctorName: string
  appointmentDate: string
  amount: number
  transactionId: string
  paymentDate: string
}

const generateInvoicePdf = async (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Invoice ${data.invoiceId}`,
          Author: 'PH Healthcare Services',
          Subject: 'Appointment Payment Invoice'
        }
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // A4 dimensions in PDF points
      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 48
      const contentWidth = pageWidth - margin * 2

      // Modern healthcare palette
      const colors = {
        primary: '#155EEF',
        dark: '#172B4D',
        text: '#344054',
        muted: '#667085',
        border: '#E4E7EC',
        background: '#F8FAFC',
        white: '#FFFFFF',
        success: '#067647',
        successBg: '#ECFDF3',
        lightBlue: '#EFF6FF'
      }

      const formatDate = (value: string | Date): string => {
        const date = new Date(value)

        if (Number.isNaN(date.getTime())) {
          return 'N/A'
        }

        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }

      const formatAmount = (value: number): string =>
        `BDT ${Number(value || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`

      const drawLabel = (
        label: string,
        value: string,
        x: number,
        y: number,
        width: number
      ) => {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(colors.muted)
          .text(label, x, y)

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(colors.dark)
          .text(value || 'N/A', x, y + 17, {
            width,
            lineBreak: false,
            ellipsis: true
          })
      }

      // White page background
      doc.rect(0, 0, pageWidth, pageHeight).fill(colors.white)

      // ==========================================
      // 1. HEADER
      // ==========================================

      doc.rect(0, 0, pageWidth, 166).fill(colors.primary)

      doc
        .font('Helvetica-Bold')
        .fontSize(19)
        .fillColor(colors.white)
        .text('PH Healthcare', margin, 35)

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#DCE8FF')
        .text('YOUR HEALTH, OUR PRIORITY', margin, 61)

      // Invoice heading on the right
      doc
        .font('Helvetica-Bold')
        .fontSize(27)
        .fillColor(colors.white)
        .text('INVOICE', margin, 96, {
          width: contentWidth,
          align: 'right'
        })

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#E0E7FF')
        .text('APPOINTMENT PAYMENT RECEIPT', margin, 131, {
          width: contentWidth,
          align: 'right'
        })

      // ==========================================
      // 2. INVOICE META & PAYMENT STATUS
      // ==========================================

      let y = 192

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text('INVOICE NUMBER', margin, y)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text(String(data.invoiceId), margin, y + 17, {
          width: 260
        })

      // Payment status badge
      const badgeX = pageWidth - margin - 136

      doc.roundedRect(badgeX, y - 4, 136, 27, 13).fill(colors.successBg)

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(colors.success)
        .text('✓  PAYMENT SUCCESSFUL', badgeX, y + 5, {
          width: 136,
          align: 'center'
        })

      // Divider
      y = 240

      doc
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .lineWidth(1)
        .strokeColor(colors.border)
        .stroke()

      // ==========================================
      // 3. PATIENT & DOCTOR INFORMATION
      // ==========================================

      y = 262

      const cardGap = 16
      const cardWidth = (contentWidth - cardGap) / 2
      const cardHeight = 130
      const rightX = margin + cardWidth + cardGap

      // Patient card
      doc
        .roundedRect(margin, y, cardWidth, cardHeight, 10)
        .fill(colors.background)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text('Patient Information', margin + 16, y + 16)

      drawLabel(
        'PATIENT NAME',
        data.patientName,
        margin + 16,
        y + 43,
        cardWidth - 32
      )

      drawLabel(
        'EMAIL ADDRESS',
        data.patientEmail,
        margin + 16,
        y + 84,
        cardWidth - 32
      )

      // Doctor card
      doc
        .roundedRect(rightX, y, cardWidth, cardHeight, 10)
        .fill(colors.background)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text('Doctor Information', rightX + 16, y + 16)

      drawLabel(
        'DOCTOR NAME',
        `Dr. ${data.doctorName}`,
        rightX + 16,
        y + 43,
        cardWidth - 32
      )

      drawLabel(
        'APPOINTMENT DATE',
        formatDate(data.appointmentDate),
        rightX + 16,
        y + 84,
        cardWidth - 32
      )

      // ==========================================
      // 4. PAYMENT DETAILS
      // ==========================================

      y = 420

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(colors.dark)
        .text('Payment Details', margin, y)

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text(`Payment date: ${formatDate(data.paymentDate)}`, margin, y + 23)

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text(
          `Transaction ID: ${data.transactionId || 'N/A'}`,
          margin,
          y + 40,
          {
            width: contentWidth,
            ellipsis: true
          }
        )

      // ==========================================
      // 5. ITEM TABLE
      // ==========================================

      const tableY = 493
      const descriptionX = margin + 16
      const amountWidth = 145
      const amountX = pageWidth - margin - amountWidth - 16

      // Table header
      doc
        .roundedRect(margin, tableY, contentWidth, 36, 6)
        .fill(colors.lightBlue)

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(colors.primary)
        .text('DESCRIPTION', descriptionX, tableY + 13)

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(colors.primary)
        .text('AMOUNT', amountX, tableY + 13, {
          width: amountWidth,
          align: 'right'
        })

      // Consultation row
      const rowY = tableY + 36

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(colors.text)
        .text('Doctor Consultation Fee', descriptionX, rowY + 20)

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(colors.text)
        .text(formatAmount(data.amount), amountX, rowY + 20, {
          width: amountWidth,
          align: 'right'
        })

      doc
        .moveTo(margin, rowY + 49)
        .lineTo(pageWidth - margin, rowY + 49)
        .lineWidth(1)
        .strokeColor(colors.border)
        .stroke()

      // ==========================================
      // 6. TOTAL AMOUNT
      // ==========================================

      const totalY = rowY + 67
      const totalBoxHeight = 78

      doc
        .roundedRect(margin, totalY, contentWidth, totalBoxHeight, 10)
        .fill(colors.background)

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(colors.dark)
        .text('Total Amount Paid', margin + 18, totalY + 20)

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(colors.muted)
        .text('Paid in full', margin + 18, totalY + 41)

      doc
        .font('Helvetica-Bold')
        .fontSize(19)
        .fillColor(colors.primary)
        .text(formatAmount(data.amount), margin + 18, totalY + 29, {
          width: contentWidth - 36,
          align: 'right'
        })

      // ==========================================
      // 7. FOOTER
      // ==========================================

      const footerY = 760

      doc
        .moveTo(margin, footerY)
        .lineTo(pageWidth - margin, footerY)
        .lineWidth(1)
        .strokeColor(colors.border)
        .stroke()

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(colors.dark)
        .text('Thank you for choosing PH Healthcare', margin, footerY + 20, {
          width: contentWidth,
          align: 'center'
        })

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.muted)
        .text(
          'This is an electronically generated invoice. No signature is required.',
          margin,
          footerY + 39,
          {
            width: contentWidth,
            align: 'center'
          }
        )

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(colors.muted)
        .text(
          'Support: support@ph-healthcare.com  |  Secure payment via Stripe',
          margin,
          footerY + 54,
          {
            width: contentWidth,
            align: 'center'
          }
        )

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export default generateInvoicePdf

export const PaymentService = {
  handleStripeWebHookEvent
}
