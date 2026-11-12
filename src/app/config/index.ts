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
    RESEND_API_KEY: string
    RESEND_EMAIL_SENDER_FROM: string
  }
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_CALLBACK_URL: string
  FRONTEND_URL: string
  ALLOWED_FRONTEND_ORIGINS: string[]
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
  }
  STRIPE: {
    STRIPE_SECRET_KEY: string
    STRIPE_WEBHOOK_SECRET: string
  }
  SUPER_ADMIN_EMAIL: string
  SUPER_ADMIN_PASSWORD: string
}

const envVars = (): TEnvVars => {
  const requiredEnvVars = [
    'PORT',
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'NODE_ENV',
    'RESEND_API_KEY',
    'RESEND_EMAIL_SENDER_FROM',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'FRONTEND_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_PASSWORD'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Missing required environment variable: ${envVar}`
      )
    }
  }

  const extraOrigins = (process.env.ALLOWED_FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const allowedFrontendOrigins = Array.from(
    new Set(
      [
        process.env.FRONTEND_URL as string,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        ...extraOrigins
      ].flatMap((url) => {
        try {
          return [new URL(url).origin]
        } catch {
          return []
        }
      })
    )
  )

  return {
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    NODE_ENV: process.env.NODE_ENV as string,
    EMAIL_SENDER: {
      RESEND_API_KEY: process.env.RESEND_API_KEY as string,
      RESEND_EMAIL_SENDER_FROM: process.env.RESEND_EMAIL_SENDER_FROM as string
    },
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    ALLOWED_FRONTEND_ORIGINS: allowedFrontendOrigins,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string
    },
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string
  }
}

export const envConfig = envVars()
