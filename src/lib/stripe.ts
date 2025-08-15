import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe instance for client-side operations
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Stripe configuration for server-side operations
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};

// Product/Price configuration - these should match your Stripe Dashboard
export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    calls: 30,
    price: 90.0,
    priceId: 'price_1RwDVhFmAwEGKkrv3C1Ir7mc', // Starter plan price ID
    overage: 4.25,
    features: [
      '30 calls per month',
      'Lead screening & qualification',
      'Basic insights dashboard',
      '24/7 expert agents on standby',
    ],
  },
  basic: {
    name: 'Basic',
    calls: 90,
    price: 250.0,
    priceId: 'price_1RwDVxFmAwEGKkrvVAPfbpNa', // Basic plan price ID
    overage: 4.0,
    features: [
      '90 calls per month',
      'Lead screening & qualification',
      'Rich business insights',
      '24/7 expert agents on standby',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro',
    calls: 300,
    price: 800.0,
    priceId: 'price_1RwDWNFmAwEGKkrvfinOVvYo', // Pro plan price ID
    overage: 3.75,
    popular: true,
    features: [
      '300 calls per month',
      'Advanced lead screening',
      'Comprehensive analytics',
      '24/7 expert agents on standby',
      'Priority support',
      'Custom integrations',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    calls: 'unlimited',
    price: 'custom',
    priceId: 'price_enterprise_custom', // Replace with actual Stripe Price ID
    features: [
      'Unlimited calls',
      'Custom AI training',
      'Dedicated account manager',
      'White-label options',
      'Custom integrations',
      'SLA guarantees',
    ],
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
