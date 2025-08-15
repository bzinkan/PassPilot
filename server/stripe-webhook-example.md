# Secure Stripe Webhook Implementation

This document explains the secure webhook implementation that validates signatures before processing any data.

## Security Principles

### 1. **Never Touch Request Body Until Verified**
```typescript
// ❌ DANGEROUS - accessing body before validation
app.post('/webhook', (req, res) => {
  const event = req.body; // NEVER do this!
  // Process event...
});

// ✅ SECURE - validate first
app.post('/webhook', (req, res) => {
  const sig = req.headers["stripe-signature"];
  invariant(typeof sig === "string", "Missing stripe signature");
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${(e as Error).message}`);
  }
  
  // Now event is verified and safe to use
  processEvent(event);
});
```

### 2. **Use Raw Body Parser for Webhooks**
```typescript
// Webhook routes need raw body for signature validation
app.use('/api/webhooks/stripe', express.raw({ 
  type: 'application/json',
  limit: '10mb'
}));

// Other routes use JSON parser
app.use(express.json());
```

### 3. **Validate Environment Configuration**
```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("Webhook endpoint called but STRIPE_WEBHOOK_SECRET not configured");
  return res.status(400).json(err("Webhook not configured"));
}
```

## Implementation Files

### Core Security (`server/stripe.ts`)
- `validateStripeWebhook()`: Signature validation before data access
- `webhookHandlers`: Type-safe event processing after validation
- Stripe client initialization with null safety

### Webhook Routes (`server/webhooks.ts`)
- Secure webhook endpoint with raw body parsing
- Signature validation before any data access
- Type-safe routing to appropriate handlers

### Payment Routes (`server/payments.ts`)
- Payment intent creation with validation
- Subscription management (when user storage is implemented)
- Customer portal access (requires user.stripeCustomerId)

### Middleware Configuration (`server/index.ts`)
- Raw body parser specifically for webhook routes
- JSON parser for other API routes
- Proper middleware ordering

## Event Handlers

The system includes handlers for common Stripe events:

```typescript
const webhookHandlers = {
  'payment_intent.succeeded': async (event) => {
    // Payment completed successfully
    // Update order status, send confirmation email
  },
  
  'customer.subscription.created': async (event) => {
    // New subscription started
    // Grant user access, send welcome email
  },
  
  'customer.subscription.updated': async (event) => {
    // Subscription changed (plan, status, etc.)
    // Update user access level
  },
  
  'customer.subscription.deleted': async (event) => {
    // Subscription cancelled
    // Revoke access, send cancellation email
  },
  
  'invoice.payment_failed': async (event) => {
    // Payment failed for subscription
    // Send retry notification, pause access
  }
};
```

## Environment Variables

Required for production:
```bash
STRIPE_SECRET_KEY=sk_test_... # From Stripe Dashboard > API Keys
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe Dashboard > Webhooks > Endpoint
```

## Testing Webhooks

1. **Stripe CLI**: Use `stripe listen` for local development
2. **Webhook Endpoint**: Configure in Stripe Dashboard
3. **Test Events**: Use Stripe Dashboard to send test events

## Error Handling

The implementation includes comprehensive error handling:

- **Signature Validation**: Returns 400 for invalid signatures
- **Missing Configuration**: Graceful degradation when secrets missing
- **Unknown Events**: Logs unhandled events but doesn't fail
- **Processing Errors**: Catches and logs handler exceptions

## Security Benefits

1. **Prevents Replay Attacks**: Signature validation includes timestamp
2. **Blocks Malicious Requests**: Only genuine Stripe events processed
3. **Data Integrity**: Raw body preserved for signature verification
4. **Type Safety**: Events typed after validation succeeds

This implementation ensures webhook security while maintaining clean, maintainable code.