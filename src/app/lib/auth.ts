import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { Role, UserStatus } from '../../../generated/prisma/enums'
import { emailOTP } from 'better-auth/plugins'
import { sendEmail } from '../utils/email'
import { envConfig } from '../config'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  baseURL: envConfig.BETTER_AUTH_URL,
  secret: envConfig.BETTER_AUTH_SECRET,
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
        } else if (type === 'forget-password') {
          const user = await prisma.user.findUnique({
            where: {
              email
            }
          })

          if (user) {
            sendEmail({
              to: email,
              subject: 'Reset your password',
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
  ],
  socialProviders: {
    google: {
      clientId: envConfig.GOOGLE_CLIENT_ID,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => {
        return {
          name: profile.name,
          emailVerified: true,
          role: Role.PATIENT,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          isDeleted: false,
          deletedAt: null
        }
      }
    }
  },
  account: {
    storeStateStrategy: 'cookie'
  },
  trustedOrigins: [envConfig.FRONTEND_URL],
  advanced: {
    useSecureCookies: envConfig.NODE_ENV === 'production',
    cookies: {
      state: {
        attributes: {
          sameSite: envConfig.NODE_ENV === 'production' ? 'none' : 'lax',
          secure: envConfig.NODE_ENV === 'production',
          httpOnly: true,
          path: '/'
        }
      },
      sessionToken: {
        attributes: {
          sameSite: envConfig.NODE_ENV === 'production' ? 'none' : 'lax',
          secure: envConfig.NODE_ENV === 'production',
          httpOnly: true,
          path: '/'
        }
      }
    }
  }
})

export type AuthSession = typeof auth.$Infer.Session
