import express, { Application, Request, Response } from 'express'
import { router } from './app/router'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './app/lib/auth'
import globalErrorHandler from './app/middleware/globalErrorHandler'
import notFound from './app/middleware/notFound'
import cors from 'cors'
import { envConfig } from './app/config'
import qs from 'qs'
import { PaymentController } from './app/modules/payment/payment.controller'
import cron from 'node-cron'
import { AppointmentService } from './app/modules/appointment/appointment.service'
import {
  authRateLimiter,
  globalRateLimiter
} from './app/middleware/rateLimiter'

const app: Application = express()

app.set('trust proxy', 1)
app.set('query parser', (str: string) => qs.parse(str))

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhookEvent
)

app.use(
  cors({
    origin: [
      ...envConfig.ALLOWED_FRONTEND_ORIGINS,
      envConfig.BETTER_AUTH_URL,
      'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }))

app.all('/api/auth/*splat', authRateLimiter, toNodeHandler(auth))

cron.schedule('*/25 * * * *', async () => {
  try {
    console.log(`Running cron job to cancel unpaid appointments`)
    await AppointmentService.cancelUnpaidAppointment()
  } catch (error) {
    console.log(error)
  }
})

// Middleware to parse JSON bodies
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!')
})

app.use('/api/v1', globalRateLimiter, router)

app.use(globalErrorHandler)
app.use(notFound)

export default app
