# Stripe Local Development Setup Guide

## Quick Setup Commands

### 1. Login to Stripe CLI
```bash
stripe login
```
This will open your browser to authenticate.

### 2. Start Webhook Forwarding
```bash
stripe listen --forward-to http://localhost:19080/api/stripe/webhook
```

**IMPORTANT**: After running this command, you'll see output like:
```
Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

Copy that `whsec_...` value and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 3. Create Test Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/test/products

Create these products with monthly prices:

1. **Starter Plan**
   - Price: $90/month
   - Product ID: Save the price ID (starts with `price_`)

2. **Basic Plan**
   - Price: $250/month
   - Product ID: Save the price ID

3. **Pro Plan**
   - Price: $800/month
   - Product ID: Save the price ID

### 4. Update Your Price IDs

Update `src/lib/stripe.ts` with the actual price IDs:

```typescript
export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    priceId: 'price_ACTUAL_STARTER_ID', // Replace this
    // ...
  },
  basic: {
    name: 'Basic',
    priceId: 'price_ACTUAL_BASIC_ID', // Replace this
    // ...
  },
  pro: {
    name: 'Pro',
    priceId: 'price_ACTUAL_PRO_ID', // Replace this
    // ...
  }
}
```

## Testing Your Setup

### Test Card Numbers
Use these test card numbers in Stripe Checkout:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

### Test Webhook Events
While `stripe listen` is running, you can trigger test events:

```bash
# Test a successful payment
stripe trigger payment_intent.succeeded

# Test a subscription creation
stripe trigger customer.subscription.created

# Test an invoice payment
stripe trigger invoice.payment_succeeded
```

## Troubleshooting

### "Access blocked" error
- Make sure you're using test keys (start with `pk_test_` and `sk_test_`)
- Ensure your redirect URLs are correct

### Webhook not receiving events
- Make sure `stripe listen` is running
- Check that the webhook secret in `.env` matches the one from CLI
- Ensure your dev server is running on port 19080

### Cannot create checkout session
- Verify price IDs exist in your Stripe dashboard
- Check that API keys are correctly set in `.env`
- Restart your dev server after changing `.env`

## Complete Environment Variables

Your `.env` file should have:

```env
# From Stripe Dashboard API Keys section
STRIPE_SECRET_KEY=sk_test_51O...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51O...

# From Stripe CLI when running 'stripe listen'
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Development Workflow

1. Start your dev server:
   ```bash
   yarn dev
   ```

2. In another terminal, start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to http://localhost:19080/api/stripe/webhook
   ```

3. Keep both running while developing

4. Test the flow:
   - Go to http://localhost:19080/pricing
   - Click "Get Started" on any plan
   - Complete checkout with test card 4242 4242 4242 4242
   - Check webhook events in the terminal
   - View subscription in http://localhost:19080/settings?tab=billing