import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckoutSession,
  createStripeCustomer,
} from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, planName } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Create a test customer for demo purposes
    const customer = await createStripeCustomer(
      'test@example.com',
      'Test Customer',
      {
        user_id: 'test-user-123',
        business_id: 'test-business-123',
      }
    );

    // Create checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/test-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`;

    const session = await createCheckoutSession(
      customer.id,
      priceId,
      successUrl,
      cancelUrl,
      {
        user_id: 'test-user-123',
        plan_name: planName,
      }
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Test checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
