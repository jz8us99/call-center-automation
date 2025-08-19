import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe instance for client-side operations
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      stripePromise = loadStripe(key);
    } else {
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

// Stripe configuration for server-side operations
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
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

// Outreach Campaigns Pricing Plans
export const OUTREACH_PRICING_PLANS = {
  starter: {
    name: 'Starter',
    calls: 30,
    price: 250.0,
    priceId: 'price_outreach_starter', // Starter outreach plan price ID
    overage: 8.5,
    features: [
      '30 outbound calls per month',
      'Lead qualification & scoring',
      'Basic campaign analytics',
      'Email integration',
      'Standard support',
    ],
  },
  basic: {
    name: 'Basic',
    calls: 100,
    price: 500.0,
    priceId: 'price_outreach_basic', // Basic outreach plan price ID
    overage: 5.0,
    popular: true,
    features: [
      '100 outbound calls per month',
      'Advanced lead scoring',
      'Campaign performance tracking',
      'CRM integrations',
      'A/B testing capabilities',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro',
    calls: 300,
    price: 1200.0,
    priceId: 'price_outreach_pro', // Pro outreach plan price ID
    overage: 4.0,
    features: [
      '300 outbound calls per month',
      'AI-powered personalization',
      'Multi-channel campaigns',
      'Advanced analytics & reporting',
      'Custom workflows',
      'Dedicated account manager',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    calls: 'unlimited',
    price: 'custom',
    priceId: 'price_outreach_enterprise_custom',
    features: [
      'Unlimited outbound calls',
      'Custom AI model training',
      'White-label solutions',
      'Advanced compliance features',
      'Dedicated infrastructure',
      'SLA guarantees',
      '24/7 enterprise support',
    ],
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
export type OutreachPlanType = keyof typeof OUTREACH_PRICING_PLANS;
