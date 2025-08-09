'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getCurrentUserToken } from '@/lib/get-jwt-token';
import { User } from '@supabase/supabase-js';

// Components
import { CallLogsTable, CallLog } from '@/components/CallLogsTable';
import { SearchFilters, User as UserProfile } from '@/components/SearchFilters';
import { StatsCard } from '@/components/StatsCard';
import { HelpButton } from '@/components/HelpDialog';
import { SimpleThemeSwitch } from '@/components/SimpleThemeSwitch';
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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [, setUsersLoading] = useState(false);

  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile(user);

  // Fetch users for admin user filter
  const fetchUsers = useCallback(async () => {
    if (
      !user ||
      !profile ||
      (profile.role !== 'admin' && !profile.is_super_admin)
    ) {
      return;
    }

    setUsersLoading(true);
    try {
      const token = await getCurrentUserToken();
      if (!token) return;

      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [user, profile]);

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

  // Fetch users for admin filtering
  useEffect(() => {
    if (
      user &&
      profile &&
      (profile.role === 'admin' || profile.is_super_admin)
    ) {
      fetchUsers();
    }
  }, [user, profile, fetchUsers]);

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
          <p className="text-black dark:text-white">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Please Sign In
          </h1>
          <p className="text-black dark:text-gray-300 mb-6">
            You need to sign in to access your dashboard.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <span className="text-xl font-bold text-black dark:text-white">
                ReceptionPro
              </span>
              <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Dashboard
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <HomeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                href="/configuration"
                className="flex items-center gap-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Configuration</span>
              </Link>
              <SimpleThemeSwitch />
              <span className="text-sm text-black dark:text-gray-300">
                Welcome, {profile?.full_name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <SignOutIcon />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                  Welcome back, {profile?.full_name || 'User'}!
                </h1>
                <p className="text-black dark:text-gray-300">
                  {profile?.role === 'admin' || profile?.is_super_admin
                    ? 'Admin view: Manage all user call records, view call history and statistics.'
                    : 'Manage your call records, view call history and statistics.'}
                </p>
              </div>
              {(profile?.role === 'admin' || profile?.is_super_admin) && (
                <div className="flex items-center space-x-2">
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                    <UsersIcon className="h-4 w-4 inline mr-1" />
                    Admin View
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Call Records"
              value={pagination.total}
              icon={<PhoneIcon className="h-5 w-5 text-orange-600" />}
            />
            <StatsCard
              title="Today's Calls"
              value={todayCalls}
              icon={<PlusIcon className="h-5 w-5 text-green-600" />}
            />
            <StatsCard
              title="Unique Numbers"
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
            isAdmin={
              profile?.role === 'admin' || profile?.is_super_admin === true
            }
            users={users}
          />
        </div>
      </main>

      {/* Help Button */}
      <HelpButton currentPage="dashboard" />
    </div>
  );
}
