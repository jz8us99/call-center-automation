import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import {
  getCustomerSubscriptions,
  getCustomerInvoices,
} from '@/lib/stripe-server';
import { PRICING_PLANS } from '@/lib/stripe';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        subscription: null,
        invoices: [],
        usage: {
          callsThisMonth: 0,
          callsRemaining: 0,
          overageCharges: 0,
        },
      });
    }

    // Get subscriptions and invoices
    const [subscriptions, invoices] = await Promise.all([
      getCustomerSubscriptions(profile.stripe_customer_id),
      getCustomerInvoices(profile.stripe_customer_id),
    ]);

    // Get active subscription
    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    // Find plan details
    let planDetails = null;
    if (activeSubscription) {
      const priceId = activeSubscription.items.data[0]?.price.id;
      planDetails = Object.values(PRICING_PLANS).find(
        plan => plan.priceId === priceId
      );
    }

    // Mock usage data - in a real app, you'd fetch this from your database
    const usage = {
      callsThisMonth: 247,
      callsRemaining: planDetails ? Math.max(0, planDetails.calls - 247) : 0,
      overageCharges: 0, // Calculate based on your business logic
    };

    return NextResponse.json({
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            status: activeSubscription.status,
            current_period_start: activeSubscription.current_period_start,
            current_period_end: activeSubscription.current_period_end,
            cancel_at_period_end: activeSubscription.cancel_at_period_end,
            plan: planDetails,
            amount: activeSubscription.items.data[0]?.price.unit_amount || 0,
            currency: activeSubscription.items.data[0]?.price.currency || 'usd',
          }
        : null,
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        created: invoice.created,
        status: invoice.status,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      })),
      usage,
    });
  } catch (error) {
    console.error('Subscription info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
