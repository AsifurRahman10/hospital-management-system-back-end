import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { Role, UserStatus } from '../../../generated/prisma/enums'
import { emailOTP } from 'better-auth/plugins'
import { sendEmail } from '../utils/email'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  emailAndPassword: {
    enabled: true
  },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: Role.PATIENT
      },
      status: {
        type: 'string',
        required: true,
        defaultValue: UserStatus.ACTIVE
      },
      needPasswordChange: {
        type: 'boolean',
        required: false,
        defaultValue: true
      },
      isDeleted: {
        type: 'boolean',
        required: false,
        defaultValue: false
      },
      deletedAt: {
        type: 'date',
        required: false,
        defaultValue: null
      }
    }
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'email-verification') {
          const user = await prisma.user.findUnique({
            where: {
              email
            }
          })

          if (user && !user.emailVerified) {
            sendEmail({
              to: email,
              subject: 'Verify your email',
              templateName: 'otp',
              templateData: {
                name: user.name,
                otp
              }
            })
          }
        }
      },
      expiresIn: 2 * 60,
      otpLength: 6
    })
  ]

  // trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000"],
  // advanced: {
  //   disableCSRFCheck: true,
  // },
})

export type AuthSession = typeof auth.$Infer.Session
