'use client';

import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface PreferencesSettingsProps {
  user: User;
}

export default function PreferencesSettings({
  user: _user,
}: PreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Dark Mode Settings */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Moon className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Appearance
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Customize the appearance of the application
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <Label
                  htmlFor="dark-mode"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  Dark Mode
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={checked =>
                  setTheme(checked ? 'dark' : 'light')
                }
                className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>
        </Card>

        {/* Language Settings */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Globe className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Language & Region
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Choose your preferred language and regional settings
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label
                htmlFor="language-select"
                className="text-xs font-medium text-gray-900 dark:text-white"
              >
                Interface Language
              </Label>
              <select
                id="language-select"
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                defaultValue="en"
              >
                <option value="en">English</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Changes will take effect after refreshing the page
              </p>
            </div>

            <div>
              <Label
                htmlFor="timezone-select"
                className="text-xs font-medium text-gray-900 dark:text-white"
              >
                Timezone
              </Label>
              <select
                id="timezone-select"
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                defaultValue="UTC"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">
                  Eastern Time (US & Canada)
                </option>
                <option value="America/Chicago">
                  Central Time (US & Canada)
                </option>
                <option value="America/Denver">
                  Mountain Time (US & Canada)
                </option>
                <option value="America/Los_Angeles">
                  Pacific Time (US & Canada)
                </option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Asia/Seoul">Seoul</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Used for displaying dates and scheduling appointments
              </p>
            </div>
          </div>
        </Card>

        {/* Email Notifications */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Email Notifications
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Manage your email notification preferences
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex-1">
                <Label
                  htmlFor="email-calls"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  Call Notifications
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email alerts for incoming and outgoing calls
                </p>
              </div>
              <Switch
                id="email-calls"
                defaultChecked={true}
                className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-orange-500"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex-1">
                <Label
                  htmlFor="email-appointments"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  Appointment Notifications
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified about appointment bookings and cancellations
                </p>
              </div>
              <Switch
                id="email-appointments"
                defaultChecked={true}
                className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-orange-500"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex-1">
                <Label
                  htmlFor="email-system"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  System Updates
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Important system notifications and maintenance alerts
                </p>
              </div>
              <Switch
                id="email-system"
                defaultChecked={true}
                className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-orange-500"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex-1">
                <Label
                  htmlFor="email-billing"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  Billing & Payments
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Payment confirmations, invoice notifications, and billing
                  updates
                </p>
              </div>
              <Switch
                id="email-billing"
                defaultChecked={true}
                className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-orange-500"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <Label
                  htmlFor="email-marketing"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  Marketing & Promotions
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Product updates, feature announcements, and promotional
                  content
                </p>
              </div>
              <Switch
                id="email-marketing"
                defaultChecked={false}
                className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
