import dotenv from 'dotenv'
import AppError from '../shared/AppError'
import httpStatus from 'http-status'
dotenv.config()

interface TEnvVars {
  PORT: string
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  NODE_ENV?: string
  EMAIL_SENDER: {
    EMAIL_SENDER_SMTP_USER: string
    EMAIL_SENDER_SMTP_PASS: string
    EMAIL_SENDER_SMTP_HOST: string
    EMAIL_SENDER_SMTP_PORT: string
    EMAIL_SENDER_SMTP_FROM: string
  }
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_CALLBACK_URL: string
  FRONTEND_URL: string
}

const envVars = (): TEnvVars => {
  const requiredEnvVars = [
    'PORT',
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'NODE_ENV',
    'EMAIL_SENDER_SMTP_USER',
    'EMAIL_SENDER_SMTP_PASS',
    'EMAIL_SENDER_SMTP_HOST',
    'EMAIL_SENDER_SMTP_PORT',
    'EMAIL_SENDER_SMTP_FROM',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'FRONTEND_URL'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Missing required environment variable: ${envVar}`
      )
    }
  }

  return {
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    NODE_ENV: process.env.NODE_ENV as string,
    EMAIL_SENDER: {
      EMAIL_SENDER_SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER as string,
      EMAIL_SENDER_SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS as string,
      EMAIL_SENDER_SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST as string,
      EMAIL_SENDER_SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT as string,
      EMAIL_SENDER_SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM as string
    },
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string
  }
}

export const envConfig = envVars()
