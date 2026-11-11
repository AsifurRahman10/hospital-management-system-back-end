import rateLimit from 'express-rate-limit'
import status from 'http-status'

/**
 * General rate limiter for standard API routes.
 * Allows up to 100 requests per 15-minute window per IP.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Max 100 requests per windowMs
  standardHeaders: 'draft-8', // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  statusCode: status.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
})

/**
 * Stricter rate limiter for sensitive operations (e.g. auth, checkout, sensitive bookings).
 * Allows up to 20 write/attempt requests per 15-minute window per IP.
 * Skips safe GET requests (such as get-session) so legitimate UI polling is not blocked.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Max 20 attempts per windowMs
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
  statusCode: status.TOO_MANY_REQUESTS,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
})
