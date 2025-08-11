'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getCurrentUserToken } from '@/lib/get-jwt-token';
import { User } from '@supabase/supabase-js';
import { useTranslations } from 'next-intl';

// Components
import {
  CallLogsTable,
  CallLog,
  CallLogColumn,
} from '@/components/tables/CallLogsTable';

// User dashboard column configuration
const USER_COLUMNS: CallLogColumn[] = [
  'startTime',
  'endTime',
  'duration',
  'type',
  'phoneNumber',
  'cost',
  'summary',
  'audio',
];
import { SearchFilters } from '@/components/tables/SearchFilters';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { HelpButton } from '@/components/modals/HelpDialog';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import {
  PhoneIcon,
  PlusIcon,
  UsersIcon,
  SignOutIcon,
  HomeIcon,
  SettingsIcon,
} from '@/components/icons';

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callLogsError, setCallLogsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile(user);
  const t = useTranslations('dashboard');
  const tAuth = useTranslations('auth');

  // Fetch call logs from API
  const fetchCallLogs = useCallback(
    async (page = 1, filters?: SearchFilters) => {
      if (!user) return;

      setCallLogsLoading(true);
      setCallLogsError(null);

      try {
        const token = await getCurrentUserToken();
        if (!token) {
          setCallLogsError('User not logged in');
          return;
        }

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
        });

        if (filters?.startTimeFrom) {
          params.append('start_time_from', filters.startTimeFrom);
        }
        if (filters?.startTimeTo) {
          params.append('start_time_to', filters.startTimeTo);
        }
        if (filters?.type && filters.type !== 'all') {
          params.append('type', filters.type);
        }
        if (filters?.phoneNumber) {
          params.append('phone_number', filters.phoneNumber);
        }
        if (filters?.userId) {
          params.append('user_id', filters.userId);
        }

        const response = await fetch(
          `/api/customer-call-logs-rls?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        setCallLogs(result.data || []);
        setPagination(prev => result.pagination || prev);
      } catch (error) {
        console.error('Failed to fetch call logs:', error);
        setCallLogsError(
          error instanceof Error ? error.message : 'Failed to fetch call logs'
        );
      } finally {
        setCallLogsLoading(false);
      }
    },
    [user]
  );

  // Handle search
  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      fetchCallLogs(1, filters);
    },
    [fetchCallLogs]
  );

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

  // Fetch call logs after user login
  useEffect(() => {
    if (user && !profileLoading) {
      fetchCallLogs(1);
    }
  }, [user, profileLoading, fetchCallLogs]);

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!user) {
        router.push('/auth');
      }
    }
  }, [loading, profileLoading, user, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            {tAuth('signIn')}
          </h1>
          <p className="text-black dark:text-gray-300 mb-6">
            {t('auth.needSignIn')}
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            {t('auth.goToSignIn')}
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const todayCalls = callLogs.filter(log => {
    const today = new Date().toDateString();
    const logDate = new Date(log.created_at).toDateString();
    return today === logDate;
  }).length;

  const uniqueNumbers = new Set(
    callLogs
      .map(log =>
        log.direction === 'inbound' ? log.from_number : log.to_number
      )
      .filter(Boolean)
  ).size;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={
          profile?.full_name || user?.email?.split('@')[0] || 'User'
        }
        pageType="dashboard"
        showConfigurationLink={true}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  {t('welcome', {
                    name: profile?.full_name || 'User',
                  })}
                </h1>
                <p className="text-black dark:text-gray-300">
                  {profile?.role === 'admin' || profile?.is_super_admin
                    ? t('adminView')
                    : t('userView')}
                </p>
              </div>
              {(profile?.role === 'admin' || profile?.is_super_admin) && (
                <div className="flex items-center space-x-2">
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                    <UsersIcon className="h-4 w-4 inline mr-1" />
                    {t('adminViewBadge')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title={t('totalCallRecords')}
              value={pagination.total}
              icon={<PhoneIcon className="h-5 w-5 text-orange-600" />}
            />
            <StatsCard
              title={t('todaysCalls')}
              value={todayCalls}
              icon={<PlusIcon className="h-5 w-5 text-green-600" />}
            />
            <StatsCard
              title={t('uniqueNumbers')}
              value={uniqueNumbers}
              icon={<UsersIcon className="h-5 w-5 text-blue-600" />}
            />
          </div>

          {/* Call Logs Table */}
          <CallLogsTable
            callLogs={callLogs}
            loading={callLogsLoading}
            error={callLogsError}
            pagination={pagination}
            onPageChange={fetchCallLogs}
            onSearch={handleSearch}
            showUserSelector={
              profile?.role === 'admin' || profile?.is_super_admin === true
            }
            visibleColumns={USER_COLUMNS}
          />
        </div>
      </main>

      {/* Help Button */}
      <HelpButton currentPage="dashboard" />
    </div>
  );
}
