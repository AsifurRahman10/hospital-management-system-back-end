/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'
import { prisma } from '../../lib/prisma'
import { PaymentStatus } from '../../../../generated/prisma/enums'
import PDFDocument from 'pdfkit'

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
          schedules: true,
          payment: true
        }
      })

      if (!appointment) {
        console.error(
          `⚠️ Appointment ${appointmentId} not found. Payment may be for expired appointment.`
        )
        return { message: 'Appointment not found' }
      }
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

        if (session.payment_status === 'paid') {
          try {
            pdfBuffer = await generateInvoicePdf({
              invoiceId: appointment.payment?.id || paymentId,
              patientName: appointment.patient.name,
              patientEmail: appointment.patient.email,
              doctorName: appointment.doctor.name,
              appointmentDate:
                appointment.schedules[0].startDateTime.toString(),
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
            // Continue with payment update even if PDF generation fails
          }
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

      // Send invoice email to patient (outside transaction to avoid blocking payment update)
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
              appointmentDate: new Date(
                appointment.schedules[0].startDateTime
              ).toLocaleDateString(),
              amount: appointment.payment?.amount || 0,
              invoiceUrl: result.invoiceUrl
            },
            attachments: [
              {
                filename: `Invoice-${paymentId}.pdf`,
                content: pdfBuffer || Buffer.from(''), // Attach PDF if generated, else empty buffer
                contentType: 'application/pdf'
              }
            ]
          })

          console.log(`✅ Invoice email sent to ${appointment.patient.email}`)
        } catch (emailError) {
          console.error('❌ Error sending invoice email:', emailError)
          // Log but don't fail the payment if email fails
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

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', {
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

      // Invoice Details - Left Column
      doc.fontSize(11).font('Helvetica-Bold').text('Invoice Information')
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice ID: ${data.invoiceId}`)
        .text(
          `Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}`
        )
        .text(`Transaction ID: ${data.transactionId}`)

      doc.moveDown(0.8)

      // Patient Information
      doc.fontSize(11).font('Helvetica-Bold').text('Patient Information')
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Name: ${data.patientName}`)
        .text(`Email: ${data.patientEmail}`)

      doc.moveDown(0.8)

      // Doctor Information
      doc.fontSize(11).font('Helvetica-Bold').text('Doctor Information')
      doc.fontSize(10).font('Helvetica').text(`Name: ${data.doctorName}`)

      doc.moveDown(0.8)

      // Appointment Details
      doc.fontSize(11).font('Helvetica-Bold').text('Appointment Details')
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `Appointment Date: ${new Date(data.appointmentDate).toLocaleDateString()}`
        )

      doc.moveDown(1)

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

      doc.moveDown(1)

      // Amount Table
      const tableTop = doc.y
      const col1X = 50
      const col2X = 450

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Payment Summary', col1X, tableTop)

      doc.moveDown(0.8)

      // Table Header
      const headerY = doc.y
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Description', col1X, headerY)
      doc.text('Amount', col2X, headerY, { align: 'right' })

      // Separator line
      doc
        .moveTo(col1X, doc.y)
        .lineTo(col2X + 80, doc.y)
        .stroke()

      doc.moveDown(0.5)

      // Amount Row
      const amountY = doc.y
      doc.fontSize(10).font('Helvetica')
      doc.text('Consultation Fee', col1X, amountY)
      doc.text(`${data.amount.toFixed(2)} BDT`, col2X, amountY, {
        align: 'right'
      })

      doc.moveDown(0.8)

      // Total Row
      const totalY = doc.y
      doc.fontSize(11).font('Helvetica-Bold')
      doc.text('Total Amount', col1X, totalY)
      doc.text(`${data.amount.toFixed(2)} BDT`, col2X, totalY, {
        align: 'right'
      })

      // Separator line
      doc
        .moveTo(col1X, doc.y)
        .lineTo(col2X + 80, doc.y)
        .stroke()

      doc.moveDown(1.5)

      // Footer
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Thank you for choosing PH Healthcare. This is an electronically generated invoice.',
          {
            align: 'center'
          }
        )

      doc.text(
        'If you have any questions, please contact us at support@ph-healthcare.com',
        {
          align: 'center'
        }
      )

      doc.text('Payment processed securely through Stripe', {
        align: 'center'
      })

      // End the document
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export const PaymentService = {
  handleStripeWebHookEvent
}
