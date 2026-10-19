import type { AuthSession } from '../lib/auth'

declare module 'express' {
  interface Request {
    user?: Pick<AuthSession['user'], 'id' | 'role' | 'email'>
    session?: AuthSession['session']
  }
}

export interface IUser {
  email: string
  role: string
  id: string
}
