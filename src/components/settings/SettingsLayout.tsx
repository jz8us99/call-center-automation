'use client';

import { ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import SettingsTabs, { SettingsTab } from './SettingsTabs';

interface SettingsLayoutProps {
  user: User;
  userDisplayName: string;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  children: ReactNode;
}

export default function SettingsLayout({
  user,
  userDisplayName,
  activeTab,
  onTabChange,
  children,
}: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={userDisplayName}
        pageType="settings"
      />

      {/* Tabs Navigation */}
      <SettingsTabs activeTab={activeTab} onTabChange={onTabChange} />

      {/* Tab Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
