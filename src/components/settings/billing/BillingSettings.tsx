'use client';

import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface BillingSettingsProps {
  user: User;
}

export default function BillingSettings({ user }: BillingSettingsProps) {
  const t = useTranslations('billingSettings');

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
                    {t('currentPlan.planName')}
                  </h3>
                  <Badge variant="outline" className="text-green-600">
                    {t('currentPlan.active')}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('currentPlan.planDetails')}
                </p>
              </div>
              <Button variant="outline">{t('currentPlan.changePlan')}</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  247
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('currentPlan.usage.callsThisMonth')}
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  53
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('currentPlan.usage.callsRemaining')}
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  $0.00
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
              <Button>{t('paymentMethods.addPaymentMethod')}</Button>
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
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-gray-900 dark:text-white">
                      #INV-001
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Dec 1, 2024
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-green-600">
                        {t('billingHistory.table.paid')}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      $800.00
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm">
                        {t('billingHistory.table.download')}
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-gray-900 dark:text-white">
                      #INV-002
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      Nov 1, 2024
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-green-600">
                        {t('billingHistory.table.paid')}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      $800.00
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm">
                        {t('billingHistory.table.download')}
                      </Button>
                    </td>
                  </tr>
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
