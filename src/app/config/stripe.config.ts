import Stripe from 'stripe'
import { envConfig } from '.'

export const stripe = new Stripe(envConfig.STRIPE.STRIPE_SECRET_KEY)
