import type { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'
import { fromNodeHeaders } from 'better-auth/node'
import { Role, UserStatus } from '../../../generated/prisma/enums'
import { auth } from '../lib/auth'

const checkAuth = (...allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the Better Auth session
      const sessionData = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
      })

      if (!sessionData) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const user = sessionData.user

      // Check whether the account is blocked or deleted
      if (user.status !== UserStatus.ACTIVE || user.isDeleted) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Your account is inactive or unavailable'
        })
      }

      // Check allowed roles, if specified
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user.role as Role)
      ) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'You do not have permission to access this resource'
        })
      }

      // Make the authenticated session available to downstream middleware and controllers
      req.user = {
        id: user.id,
        role: user.role,
        email: user.email
      }
      req.session = sessionData.session

      next()
    } catch (error) {
      next(error)
    }
  }
}

export default checkAuth
