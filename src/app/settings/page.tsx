'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { HelpButton } from '@/components/modals/HelpDialog';

// Layout and Components
import SettingsLayout from '@/components/settings/SettingsLayout';
import { SettingsTab } from '@/components/settings/SettingsTabs';
import BusinessSettings from '@/components/settings/business/BusinessSettings';
import AccountSettings from '@/components/settings/account/AccountSettings';
import BillingSettings from '@/components/settings/billing/BillingSettings';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const router = useRouter();
  const searchParams = useSearchParams();

  const { profile, loading: profileLoading } = useUserProfile(user);

  // Get tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab;
    if (tabParam && ['business', 'account', 'payment'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  // Get user from Supabase
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !profileLoading && !user) {
      router.push('/auth');
    }
  }, [loading, profileLoading, user, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const userDisplayName =
    profile?.full_name || user.email?.split('@')[0] || 'User';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessSettings user={user} />;
      case 'account':
        return <AccountSettings user={user} />;
      case 'payment':
        return <BillingSettings user={user} />;
      default:
        return <BusinessSettings user={user} />;
    }
  };

  return (
    <>
      <SettingsLayout
        user={user}
        userDisplayName={userDisplayName}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {renderTabContent()}
      </SettingsLayout>

      <HelpButton currentPage="settings" />
    </>
  );
}
