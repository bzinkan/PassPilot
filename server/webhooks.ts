import type { Express, Request, Response } from "express";
import express from "express";
import { validateStripeWebhook, webhookHandlers, WebhookEventType } from "./stripe";
import { invariant } from "./utils";
import { ok, err } from "./utils";

/**
 * Secure Stripe webhook handler that validates signatures before processing
 * 
 * Key security principles:
 * 1. Never touch req.body until signature is verified
 * 2. Use raw body parser for webhook validation
 * 3. Validate webhook secret exists
 * 4. Type-safe event handling after validation
 */
export function setupWebhookRoutes(app: Express): void {
  // Webhook route with raw body parser for signature validation
  app.post("/api/webhooks/stripe", async (req: Request, res: Response): Promise<void> => {
    try {
      // Get webhook secret from environment
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn("Stripe webhook endpoint called but STRIPE_WEBHOOK_SECRET not configured");
        res.status(400).json(err("Webhook not configured"));
        return;
      }

      // Extract signature from headers - don't touch body yet!
      const signature = req.headers["stripe-signature"];
      invariant(typeof signature === "string", "Missing stripe signature");

      // Validate webhook signature before accessing any data
      // This throws if signature is invalid or body is tampered with
      const event = validateStripeWebhook(
        req.body as Buffer, // Raw body from bodyParser.raw
        signature,
        webhookSecret
      );

      // Now event is verified and safe to use
      console.log(`Processing verified webhook: ${event.type}`);

      // Route to appropriate handler based on event type
      const handler = webhookHandlers[event.type as WebhookEventType];
      if (handler) {
        await handler(event as any); // Type assertion is safe after validation
        res.status(200).json(ok({ message: "Webhook processed successfully" }));
      } else {
        // Unknown event type - log but don't fail
        console.log(`Unhandled webhook event type: ${event.type}`);
        res.status(200).json(ok({ message: "Event type not handled" }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown webhook error";
      console.error("Webhook processing failed:", message);
      
      // Return 400 for validation errors (Stripe will retry)
      res.status(400).json(err(message));
    }
  });
}

/**
 * Configure Express app for webhook security
 * 
 * Important: Webhook routes need raw body parser, but other routes need JSON parser
 * This must be set up carefully to avoid conflicts
 */
export function configureWebhookMiddleware(app: Express): void {
  // Raw body parser specifically for Stripe webhooks
  // This preserves the raw body needed for signature validation
  app.use('/api/webhooks/stripe', express.raw({ 
    type: 'application/json',
    limit: '10mb' // Generous limit for webhook payloads
  }));
}