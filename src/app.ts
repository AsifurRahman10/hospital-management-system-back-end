import express, { Application, Request, Response } from 'express'
import { router } from './app/router'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './app/lib/auth'
import globalErrorHandler from './app/middleware/globalErrorHandler'
import notFound from './app/middleware/notFound'
import cors from 'cors'
import { envConfig } from './app/config'
import qs from 'qs'

const app: Application = express()

app.set('query parser', (str: string) => qs.parse(str))

app.use(
  cors({
    origin: [
      envConfig.FRONTEND_URL,
      envConfig.BETTER_AUTH_URL,
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }))

app.all('/api/auth/*splat', toNodeHandler(auth))

// Middleware to parse JSON bodies
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript + Express!')
})

app.use('/api/v1', router)

app.use(globalErrorHandler)
app.use(notFound)

export default app
