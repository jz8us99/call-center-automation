'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';

// Components
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import {
  CallLogsTable,
  CallLog,
  CallLogColumn,
} from '@/components/tables/CallLogsTable';
import { SearchFilters } from '@/components/tables/SearchFilters';

// Admin dashboard column configuration
const ADMIN_COLUMNS: CallLogColumn[] = [
  'startTime',
  'endTime',
  'duration',
  'type',
  'phoneNumber',
  'cost',
];

interface AdminCallLog {
  id: string;
  user_id: string;
  phone_number: string;
  call_status: string;
  started_at: string;
  ended_at: string;
  duration?: number;
  call_summary?: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    business_name?: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  business_name?: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<AdminCallLog[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [callLogsPagination, setCallLogsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callLogsError, setCallLogsError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [callsLoading, setCallsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalCalls: 0,
    recentCalls: 0,
  });

  const router = useRouter();
  const { profile, loading: profileLoading, isAdmin } = useUserProfile(user);

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

  useEffect(() => {
    // Development mode bypass - remove this in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!loading && !profileLoading && !isDevelopment) {
      if (!user) {
        router.push('/auth');
      } else if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [loading, profileLoading, user, isAdmin, router]);

  // Load users for the filter dropdown
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);

      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setStats(prev => ({ ...prev, totalUsers: data.users?.length || 0 }));
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load call logs for CallLogsTable component
  const loadCallLogs = useCallback(
    async (page = 1, filters?: SearchFilters) => {
      try {
        setCallLogsLoading(true);
        setCallLogsError(null);

        // Get the current session token
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('No authentication token available');
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

        const response = await fetch(`/api/admin/calls?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch call logs');
        }

        const data = await response.json();
        setCallLogs(data.calls || []);
        setCallLogsPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || 10,
          total: data.totalCount || 0,
          totalPages:
            data.pagination?.totalPages ||
            Math.ceil((data.totalCount || 0) / 10),
        });
      } catch (error) {
        console.error('Failed to load call logs:', error);
        setCallLogsError(
          error instanceof Error ? error.message : 'Failed to fetch call logs'
        );
        setCallLogs([]);
      } finally {
        setCallLogsLoading(false);
      }
    },
    []
  );

  // Handle search for CallLogsTable
  const handleCallLogsSearch = useCallback(
    (filters: SearchFilters) => {
      loadCallLogs(1, filters);
    },
    [loadCallLogs]
  );

  // Load call logs with optional user filtering (for simple table)
  const loadCalls = useCallback(async (userId: string = 'all') => {
    try {
      setCallsLoading(true);

      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
      });

      if (userId && userId !== 'all') {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/admin/calls?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }

      const data = await response.json();
      setCalls(data.calls || []);
      setStats(prev => ({
        ...prev,
        totalCalls: data.totalCount || 0,
        recentCalls: data.calls?.length || 0,
      }));
    } catch (error) {
      console.error('Failed to load calls:', error);
      setCalls([]);
    } finally {
      setCallsLoading(false);
    }
  }, []);

  // Handle user filter change
  const handleUserFilterChange = (userId: string) => {
    setSelectedUserId(userId);
    loadCalls(userId);
  };

  // Load data when component mounts or admin status changes
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment || (user && isAdmin)) {
      loadUsers();
      loadCalls();
      loadCallLogs();
    }
  }, [user, isAdmin, loadUsers, loadCalls, loadCallLogs]);

  // Development mode bypass - remove this in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if ((loading || profileLoading) && !isDevelopment) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isDevelopment && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-black dark:text-gray-300 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={profile?.full_name || user?.email || 'Admin'}
        pageType="admin"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-black dark:text-gray-300">
              Manage users, system settings, and monitor application
              performance.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Calls</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {stats.totalCalls}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">System Status</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    Online
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Recent Calls</p>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {stats.recentCalls}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-black dark:text-white font-medium">
                    User Management
                  </p>
                  <p className="text-black dark:text-gray-300 text-sm">
                    Manage user accounts & permissions
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/pricing"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-black dark:text-white font-medium">
                    Pricing Configuration
                  </p>
                  <p className="text-black dark:text-gray-300 text-sm">
                    Manage pricing tiers & features
                  </p>
                </div>
              </Link>

              <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-black dark:text-white font-medium">
                    System Settings
                  </p>
                  <p className="text-black dark:text-gray-300 text-sm">
                    Configure application
                  </p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-black dark:text-white font-medium">
                    Analytics
                  </p>
                  <p className="text-black dark:text-gray-300 text-sm">
                    View system metrics & reports
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Call Logs Section - Using CallLogsTable Component */}
          <CallLogsTable
            callLogs={callLogs}
            loading={callLogsLoading}
            error={callLogsError}
            pagination={callLogsPagination}
            onPageChange={loadCallLogs}
            onSearch={handleCallLogsSearch}
            showUserSelector={true}
            visibleColumns={ADMIN_COLUMNS}
          />
        </div>
      </main>
    </div>
  );
}
