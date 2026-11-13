/* eslint-disable @typescript-eslint/no-explicit-any */

import ejs from 'ejs'
import status from 'http-status'
import path from 'path'

import { envConfig } from '../config'
import AppError from '../shared/AppError'

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

    const encodedAttachments = attachments?.map((attachment) => ({
      filename: attachment.filename,
      content:
        typeof attachment.content === 'string'
          ? Buffer.from(attachment.content).toString('base64')
          : attachment.content.toString('base64'),
      contentType: attachment.contentType
    }))

    const response = await fetch(envConfig.GMAIL.SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        secret: envConfig.GMAIL.SCRIPT_SECRET,
        to,
        subject,
        html,
        attachments: encodedAttachments
      }),
      signal: AbortSignal.timeout(25000)
    })

    if (!response.ok) {
      throw new Error(`Email service HTTP error: ${response.status}`)
    }

    const result = (await response.json()) as {
      success: boolean
      message: string
    }

    if (!result.success) {
      throw new Error(result.message)
    }

    console.log(`Email sent successfully to ${to}`)

    return result
  } catch (error) {
    console.error(
      'Email Sending Error:',
      error instanceof Error ? error.message : error
    )

    throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to send email')
  }
}
