'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { getStripe, PRICING_PLANS, type PlanType } from '@/lib/stripe';
import { toast } from 'sonner';
import { getCurrentUserToken } from '@/lib/get-jwt-token';

interface BillingSettingsProps {
  user: User;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  plan: (typeof PRICING_PLANS)[PlanType] | null;
  amount: number;
  currency: string;
  current_period_end: number;
}

interface UsageInfo {
  callsThisMonth: number;
  callsRemaining: number;
  overageCharges: number;
}

interface Invoice {
  id: string;
  number: string;
  amount_paid: number;
  currency: string;
  created: number;
  status: string;
  hosted_invoice_url: string;
}

export default function BillingSettings({ user }: BillingSettingsProps) {
  const t = useTranslations('billingSettings');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [usage, setUsage] = useState<UsageInfo>({
    callsThisMonth: 0,
    callsRemaining: 0,
    overageCharges: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState('');

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const token = await getCurrentUserToken();

      const response = await fetch('/api/stripe/subscription', {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
        setUsage(data.usage);
        setInvoices(data.invoices);
      } else {
        console.error('Failed to load subscription info:', data.error);
        toast.error('Failed to load subscription info');
      }
    } catch (error) {
      console.error('Error loading subscription info:', error);
      toast.error('Error loading subscription info');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    try {
      setLoadingAction('change-plan');

      if (subscription) {
        // Open billing portal for existing customers
        const token = await getCurrentUserToken();
        const response = await fetch('/api/stripe/billing-portal', {
          method: 'POST',
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });
        const data = await response.json();

        if (response.ok && data.url) {
          window.location.href = data.url;
        } else {
          toast.error('Failed to open billing portal');
        }
      } else {
        // Redirect to pricing page for new customers
        window.location.href = '/pricing';
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setLoadingAction('');
    }
  };

  const handleManagePaymentMethods = async () => {
    try {
      setLoadingAction('payment-methods');

      const token = await getCurrentUserToken();
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to open payment management');
      }
    } catch (error) {
      console.error('Error opening payment management:', error);
      toast.error('Failed to open payment management');
    } finally {
      setLoadingAction('');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Current Plan Section */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t('currentPlan.title')}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('currentPlan.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {subscription?.plan?.name || 'No Active Plan'}
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      subscription?.status === 'active'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }
                  >
                    {subscription?.status || 'Inactive'}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {subscription ? (
                    <>
                      {subscription.plan?.calls} calls per month • $
                      {subscription.plan?.overage}/call overage
                      {subscription.current_period_end && (
                        <>
                          {' '}
                          • Renews {formatDate(subscription.current_period_end)}
                        </>
                      )}
                    </>
                  ) : (
                    'No active subscription'
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleChangePlan}
                disabled={loadingAction === 'change-plan'}
              >
                {loadingAction === 'change-plan' ? 'Loading...' : 'Change Plan'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.callsThisMonth}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('currentPlan.usage.callsThisMonth')}
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.callsRemaining}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('currentPlan.usage.callsRemaining')}
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${usage.overageCharges.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('currentPlan.usage.overageCharges')}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Methods Section */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {t('paymentMethods.title')}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('paymentMethods.description')}
                </p>
              </div>
              <Button
                onClick={handleManagePaymentMethods}
                disabled={loadingAction === 'payment-methods'}
              >
                {loadingAction === 'payment-methods'
                  ? 'Loading...'
                  : t('paymentMethods.addPaymentMethod')}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    •••• •••• •••• 4242
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('paymentMethods.expires')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600">
                  {t('paymentMethods.default')}
                </Badge>
                <Button variant="outline" size="sm">
                  {t('paymentMethods.remove')}
                </Button>
              </div>
            </div>

            <div className="p-8 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p>{t('paymentMethods.addPrompt')}</p>
            </div>
          </div>
        </Card>

        {/* Billing History Section */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {t('billingHistory.title')}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('billingHistory.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      {t('billingHistory.table.invoice')}
                    </th>
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      {t('billingHistory.table.date')}
                    </th>
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      {t('billingHistory.table.status')}
                    </th>
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      {t('billingHistory.table.amount')}
                    </th>
                    <th className="text-right py-3 font-medium text-gray-900 dark:text-white">
                      {t('billingHistory.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    invoices.map(invoice => (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 text-gray-900 dark:text-white">
                          {invoice.number || invoice.id.slice(-8)}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(invoice.created)}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={
                              invoice.status === 'paid'
                                ? 'text-green-600'
                                : invoice.status === 'open'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-gray-900 dark:text-white">
                          {formatAmount(invoice.amount_paid, invoice.currency)}
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(invoice.hosted_invoice_url, '_blank')
                            }
                            disabled={!invoice.hosted_invoice_url}
                          >
                            {t('billingHistory.table.download')}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Usage Analytics Section */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t('usageAnalytics.title')}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('usageAnalytics.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                <p>{t('usageAnalytics.chartPlaceholder')}</p>
                <p className="text-sm">{t('usageAnalytics.comingSoon')}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
