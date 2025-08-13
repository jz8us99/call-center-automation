'use client';

import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface AccountSettingsProps {
  user: User;
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const t = useTranslations('accountSettings');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Profile Section */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t('profile.title')}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('profile.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('profile.firstName')}</Label>
                <Input
                  id="firstName"
                  placeholder={t('profile.firstNamePlaceholder')}
                  defaultValue=""
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('profile.lastName')}</Label>
                <Input
                  id="lastName"
                  placeholder={t('profile.lastNamePlaceholder')}
                  defaultValue=""
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('profile.emailPlaceholder')}
                defaultValue={user.email || ''}
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('profile.emailNote')}
              </p>
            </div>

            <div className="flex justify-end">
              <Button>{t('profile.saveChanges')}</Button>
            </div>
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t('security.title')}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('security.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">
                {t('security.currentPassword')}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder={t('security.currentPasswordPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">{t('security.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('security.newPasswordPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">
                  {t('security.confirmPassword')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('security.confirmPasswordPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button>{t('security.updatePassword')}</Button>
            </div>
          </div>
        </Card>

        {/* Preferences Section */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t('preferences.title')}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('preferences.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">{t('preferences.timezone')}</Label>
                <select
                  id="timezone"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                  defaultValue="UTC"
                >
                  <option value="UTC">
                    {t('preferences.timezoneOptions.utc')}
                  </option>
                  <option value="America/New_York">
                    {t('preferences.timezoneOptions.eastern')}
                  </option>
                  <option value="America/Chicago">
                    {t('preferences.timezoneOptions.central')}
                  </option>
                  <option value="America/Denver">
                    {t('preferences.timezoneOptions.mountain')}
                  </option>
                  <option value="America/Los_Angeles">
                    {t('preferences.timezoneOptions.pacific')}
                  </option>
                </select>
              </div>

              <div>
                <Label htmlFor="language">{t('preferences.language')}</Label>
                <select
                  id="language"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                  defaultValue="en"
                >
                  <option value="en">
                    {t('preferences.languageOptions.english')}
                  </option>
                  <option value="es">
                    {t('preferences.languageOptions.spanish')}
                  </option>
                  <option value="zh">
                    {t('preferences.languageOptions.chinese')}
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button>{t('preferences.savePreferences')}</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
