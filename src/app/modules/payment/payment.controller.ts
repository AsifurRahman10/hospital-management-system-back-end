/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import catchAsync from '../../shared/catchAsync'
import sendResponse from '../../shared/sendResponse'
import httpStatus from 'http-status'
import { envConfig } from '../../config'
import { stripe } from '../../config/stripe.config'
import { PaymentService } from './payment.service'

const handleStripeWebhookEvent = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = envConfig.STRIPE.STRIPE_WEBHOOK_SECRET

    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret')
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: 'Missing Stripe signature or webhook secret' })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
    } catch (error: any) {
      console.error('Error processing Stripe webhook:', error)
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: 'Error processing Stripe webhook' })
    }

    try {
      const result = await PaymentService.handleStripeWebHookEvent(event)

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Stripe webhook event processed successfully',
        data: result
      })
    } catch (error) {
      console.error('Error handling Stripe webhook event:', error)
      sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Error handling Stripe webhook event'
      })
    }
  }
)

export const PaymentController = {
  handleStripeWebhookEvent
}
