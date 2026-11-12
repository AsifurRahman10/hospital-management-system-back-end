/* eslint-disable @typescript-eslint/no-explicit-any */

import { Resend } from 'resend'
import ejs from 'ejs'
import status from 'http-status'
import path from 'path'

import { envConfig } from '../config'
import AppError from '../shared/AppError'

const resend = new Resend(envConfig.EMAIL_SENDER.RESEND_API_KEY)

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

    const { data, error } = await resend.emails.send({
      from: envConfig.EMAIL_SENDER.RESEND_EMAIL_SENDER_FROM,
      to,
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    })

    if (error) {
      console.error('Resend Error:', error)
      throw new Error(error.message)
    }

    console.log(`Email sent to ${to}: ${data?.id}`)

    return data
  } catch (error) {
    console.error(
      'Email Sending Error:',
      error instanceof Error ? error.message : error
    )

    throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to send email')
  }
}
