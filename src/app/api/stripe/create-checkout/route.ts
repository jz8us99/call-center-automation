import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import {
  createCheckoutSession,
  createStripeCustomer,
} from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const body = await request.json();
    const { priceId, planName } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Get user profile and check if they already have a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('stripe_customer_id, business_name, business_email')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      try {
        const customer = await createStripeCustomer(
          user.email || profile?.business_email || '',
          profile?.business_name || user.user_metadata?.full_name,
          {
            user_id: user.id,
            business_id: profile?.id || '',
          }
        );
        customerId = customer.id;

        // Update business profile with Stripe customer ID
        if (profile) {
          await supabase
            .from('business_profiles')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        );
      }
    }

    // Create checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=billing&canceled=true`;

    const session = await createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      {
        user_id: user.id,
        plan_name: planName,
      }
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
