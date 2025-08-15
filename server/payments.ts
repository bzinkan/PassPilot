import type { Express } from "express";
import { stripe } from "./stripe";
import { isAuthenticated } from "./replitAuth";
// import { storage } from "./storage"; // Will be used when storage methods are added
import { ok, err } from "./utils";
import { invariant } from "./utils";

/**
 * Secure payment routes that validate Stripe integration before use
 */
export function setupPaymentRoutes(app: Express): void {
  // Create payment intent for one-time payments
  app.post("/api/payments/create-intent", isAuthenticated, async (req, res): Promise<void> => {
    try {
      invariant(stripe, "Stripe not configured - missing STRIPE_SECRET_KEY");
      
      const { amount, currency = "usd" } = req.body;
      invariant(typeof amount === "number" && amount > 0, "Valid amount required");
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          userId: req.user?.claims?.sub ?? "",
        },
      });

      res.json(ok({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment creation failed";
      console.error("Payment intent creation failed:", message);
      res.status(500).json(err(message));
    }
  });

  // Create subscription for recurring payments
  app.post("/api/payments/create-subscription", isAuthenticated, async (req, res): Promise<void> => {
    try {
      invariant(stripe, "Stripe not configured - missing STRIPE_SECRET_KEY");
      
      const userId = req.user?.claims?.sub;
      invariant(userId, "User ID required");
      
      // TODO: Get user from storage when method is available
      // const user = await storage.getUser(userId);
      // invariant(user?.email, "User email required for subscription");
      
      // For now, use placeholder email - replace with actual user data
      const userEmail = "user@example.com"; // TODO: Get from actual user

      // TODO: Check if user already has a customer ID from storage
      // let customerId = user.stripeCustomerId;
      
      // Create new Stripe customer (TODO: cache this in user record)
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
      
      const customerId = customer.id;

      const { priceId } = req.body;
      invariant(typeof priceId === "string", "Price ID required");

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as any;
      invariant(invoice && typeof invoice === 'object', "Invoice not found");
      
      const paymentIntent = invoice.payment_intent as any;
      invariant(paymentIntent && typeof paymentIntent === 'object', "Payment intent not found");

      res.json(ok({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Subscription creation failed";
      console.error("Subscription creation failed:", message);
      res.status(500).json(err(message));
    }
  });

  // Get customer portal URL for subscription management
  app.post("/api/payments/customer-portal", isAuthenticated, async (req, res): Promise<void> => {
    try {
      invariant(stripe, "Stripe not configured - missing STRIPE_SECRET_KEY");
      
      const userId = req.user?.claims?.sub;
      invariant(userId, "User ID required");
      
      // TODO: Get user from storage when method is available
      // const user = await storage.getUser(userId);
      // invariant(user?.stripeCustomerId, "Customer not found");
      
      // For now, return error since we need actual customer ID
      throw new Error("Customer portal requires user with Stripe customer ID");

      const { return_url } = req.body;
      const returnUrl = typeof return_url === "string" ? return_url : `${req.protocol}://${req.hostname}`;

      // TODO: Use actual customer ID from user record
      // const session = await stripe.billingPortal.sessions.create({
      //   customer: user.stripeCustomerId,
      //   return_url: returnUrl,
      // });
      
      throw new Error("Customer portal not implemented - need user.stripeCustomerId");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Portal creation failed";
      console.error("Customer portal creation failed:", message);
      res.status(500).json(err(message));
    }
  });
}