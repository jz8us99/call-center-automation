'use client';

import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BillingSettingsProps {
  user: User;
}

export default function BillingSettings({ user }: BillingSettingsProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Current Plan Section */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Current Plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your current subscription and usage information.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Pro Plan
                  </h3>
                  <Badge variant="outline" className="text-green-600">
                    Active
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  300 calls per month • $800.00/month
                </p>
              </div>
              <Button variant="outline">Change Plan</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  247
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Calls this month
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  53
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Calls remaining
                </div>
              </div>
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  $0.00
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Overage charges
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
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Methods
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your payment methods and billing information.
                </p>
              </div>
              <Button>Add Payment Method</Button>
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
                    Expires 12/2025
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600">
                  Default
                </Badge>
                <Button variant="outline" size="sm">
                  Remove
                </Button>
              </div>
            </div>

            <div className="p-8 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p>Add a payment method to manage your subscription</p>
            </div>
          </div>
        </Card>

        {/* Billing History Section */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Billing History
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Download your previous invoices and receipts.
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
                      Invoice
                    </th>
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                      Amount
                    </th>
                    <th className="text-right py-3 font-medium text-gray-900 dark:text-white">
                      Actions
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
                        Paid
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      $800.00
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm">
                        Download
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
                        Paid
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      $800.00
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm">
                        Download
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Usage Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed breakdown of your monthly usage.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                <p>Usage analytics chart will be displayed here</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
