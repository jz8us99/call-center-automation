import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import { createBillingPortalSession } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please create a subscription first.' },
        { status: 400 }
      );
    }

    // Create billing portal session
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=billing`;

    const session = await createBillingPortalSession(
      profile.stripe_customer_id,
      returnUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
