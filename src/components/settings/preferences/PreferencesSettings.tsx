'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations, useLocale } from 'next-intl';
import { locales, type Locale } from '@/i18n/config';
import { setUserLocale } from '@/services/locale';
import { useTransition } from 'react';

interface PreferencesSettingsProps {
  user: User;
}

export default function PreferencesSettings({
  user: _user,
}: PreferencesSettingsProps) {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  const t = useTranslations('settings.preferences');
  const tLanguages = useTranslations('languages');
  const tTimezones = useTranslations('timezones');

  const handleLanguageChange = (newLocale: string) => {
    const newLocaleTyped = newLocale as Locale;
    setSelectedLanguage(newLocaleTyped);
    startTransition(() => {
      setUserLocale(newLocaleTyped);
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Dark Mode Settings */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Moon className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {t('appearance')}
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('appearanceDesc')}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <Label
                  htmlFor="dark-mode"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  {t('darkMode')}
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('darkModeDesc')}
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
                {t('language')}
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('languageDesc')}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label
                htmlFor="language-select"
                className="text-xs font-medium text-gray-900 dark:text-white"
              >
                {t('interfaceLanguage')}
              </Label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={e => handleLanguageChange(e.target.value)}
                disabled={isPending}
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs disabled:opacity-50"
              >
                {locales.map(lang => (
                  <option key={lang} value={lang}>
                    {tLanguages(lang)}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('languageChangeNote')}
              </p>
            </div>

            <div>
              <Label
                htmlFor="timezone-select"
                className="text-xs font-medium text-gray-900 dark:text-white"
              >
                {t('timezone')}
              </Label>
              <select
                id="timezone-select"
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                defaultValue="UTC"
              >
                <option value="UTC">{tTimezones('UTC')}</option>
                <option value="America/New_York">
                  {tTimezones('America/New_York')}
                </option>
                <option value="America/Chicago">
                  {tTimezones('America/Chicago')}
                </option>
                <option value="America/Denver">
                  {tTimezones('America/Denver')}
                </option>
                <option value="America/Los_Angeles">
                  {tTimezones('America/Los_Angeles')}
                </option>
                <option value="Europe/London">
                  {tTimezones('Europe/London')}
                </option>
                <option value="Europe/Paris">
                  {tTimezones('Europe/Paris')}
                </option>
                <option value="Europe/Berlin">
                  {tTimezones('Europe/Berlin')}
                </option>
                <option value="Asia/Tokyo">{tTimezones('Asia/Tokyo')}</option>
                <option value="Asia/Shanghai">
                  {tTimezones('Asia/Shanghai')}
                </option>
                <option value="Asia/Seoul">{tTimezones('Asia/Seoul')}</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('timezoneDesc')}
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
                {t('emailNotifications')}
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('emailNotificationsDesc')}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex-1">
                <Label
                  htmlFor="email-calls"
                  className="text-xs font-medium text-gray-900 dark:text-white"
                >
                  {t('callNotifications')}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('callNotificationsDesc')}
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
                  {t('appointmentNotifications')}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('appointmentNotificationsDesc')}
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
                  {t('systemUpdates')}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('systemUpdatesDesc')}
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
                  {t('billingPayments')}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('billingPaymentsDesc')}
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
                  {t('marketingPromotions')}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('marketingPromotionsDesc')}
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
            {t('savePreferences')}
          </Button>
        </div>
      </div>
    </div>
  );
}
