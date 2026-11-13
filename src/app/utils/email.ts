/* eslint-disable @typescript-eslint/no-explicit-any */
import ejs from 'ejs'
import status from 'http-status'
import nodemailer from 'nodemailer'
import path from 'path'
import { envConfig } from '../config'
import AppError from '../shared/AppError'

const transporter = nodemailer.createTransport({
  host: envConfig.EMAIL_SENDER.EMAIL_SENDER_SMTP_HOST,
  secure: true,
  auth: {
    user: envConfig.EMAIL_SENDER.EMAIL_SENDER_SMTP_USER,
    pass: envConfig.EMAIL_SENDER.EMAIL_SENDER_SMTP_PASS
  },
  port: Number(envConfig.EMAIL_SENDER.EMAIL_SENDER_SMTP_PORT)
})

interface SendEmailOptions {
  to: string
  subject: string
  templateName: string
  templateData: Record<string, any>
  attachments?: {
    filename: string
    content: Buffer | string
    contentType: string
  }[]
}

export const sendEmail = async ({
  subject,
  templateData,
  templateName,
  to,
  attachments
}: SendEmailOptions) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`
    )

    const html = await ejs.renderFile(templatePath, templateData)

    const info = await transporter.sendMail({
      from: envConfig.EMAIL_SENDER.EMAIL_SENDER_SMTP_FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    })

    console.log(`Email sent to ${to} : ${info.messageId}`)
  } catch (error: any) {
    console.log('Email Sending Error', error.message)
    throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to send email')
  }
}
