import Stripe from "stripe";
import { invariant } from "./utils";

// Only initialize Stripe if secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
    })
  : null;

/**
 * Safely validates and constructs a Stripe webhook event
 * Never touches req.body or event data until signature is verified
 */
export function validateStripeWebhook(
  rawBody: Buffer,
  signature: string | string[] | undefined,
  webhookSecret: string
): Stripe.Event {
  invariant(typeof signature === "string", "Missing or invalid stripe signature");
  invariant(stripe, "Stripe not initialized - missing STRIPE_SECRET_KEY");
  
  try {
    // This validates the signature and throws if invalid
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    return event;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook validation error";
    throw new Error(`Webhook validation failed: ${message}`);
  }
}

/**
 * Type-safe webhook event handlers
 * Only called after validation succeeds
 */
export const webhookHandlers = {
  'payment_intent.succeeded': async (event: Stripe.PaymentIntentSucceededEvent) => {
    const paymentIntent = event.data.object;
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    
    // Handle successful payment
    // Update database, send confirmation email, etc.
  },

  'customer.subscription.created': async (event: Stripe.CustomerSubscriptionCreatedEvent) => {
    const subscription = event.data.object;
    console.log(`Subscription created: ${subscription.id}`);
    
    // Handle new subscription
    // Update user subscription status in database
  },

  'customer.subscription.updated': async (event: Stripe.CustomerSubscriptionUpdatedEvent) => {
    const subscription = event.data.object;
    console.log(`Subscription updated: ${subscription.id}`);
    
    // Handle subscription changes
    // Update user subscription status, handle plan changes
  },

  'customer.subscription.deleted': async (event: Stripe.CustomerSubscriptionDeletedEvent) => {
    const subscription = event.data.object;
    console.log(`Subscription deleted: ${subscription.id}`);
    
    // Handle subscription cancellation
    // Update user access, send cancellation email
  },

  'invoice.payment_failed': async (event: Stripe.InvoicePaymentFailedEvent) => {
    const invoice = event.data.object;
    console.log(`Payment failed for invoice: ${invoice.id}`);
    
    // Handle failed payment
    // Send payment retry email, update subscription status
  },
} as const;

export type WebhookEventType = keyof typeof webhookHandlers;