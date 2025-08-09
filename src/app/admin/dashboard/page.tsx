'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';

// Components
import { Badge } from '@/components/ui/badge';
import { SimpleThemeSwitch } from '@/components/SimpleThemeSwitch';

interface CallLog {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  direction?: 'inbound' | 'outbound';
  from_number?: string;
  to_number?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  duration?: number;
  call_summary?: string;
  transcript?: string;
  call_type?: string;
  custom_data?: Record<string, unknown>;
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
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [callsLoading, setCallsLoading] = useState(false);
  const [, setUsersLoading] = useState(false);
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

      // Get current session and token for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers,
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

  // Load call logs with optional user filtering
  const loadCalls = useCallback(async (userId: string = 'all') => {
    try {
      setCallsLoading(true);

      const params = new URLSearchParams({
        page: '1',
        limit: '20',
      });

      if (userId && userId !== 'all') {
        params.append('user_id', userId);
      }

      // Get current session and token for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/customer-call-logs-rls?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(
          `Failed to fetch calls: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      setCalls(data.data || []);
      setStats(prev => ({
        ...prev,
        totalCalls: data.pagination?.total || 0,
        recentCalls: data.data?.length || 0,
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
    }
  }, [user, isAdmin, loadUsers, loadCalls]);

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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center shadow-lg">
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Admin Dashboard
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
                    d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m0 0V11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10m3 0a1 1 0 0 0 1-1V10m0 0 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </Link>
              <SimpleThemeSwitch />
              <span className="text-sm text-black dark:text-gray-300">
                Welcome, {profile?.full_name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
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

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
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

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
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

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
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
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
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
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
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

              <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
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

              <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
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

          {/* Call Logs Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                Call Logs
              </h2>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Filter by User:
                </label>
                <select
                  value={selectedUserId}
                  onChange={e => handleUserFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
                >
                  <option value="all">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.business_name || user.email})
                    </option>
                  ))}
                </select>
                {callsLoading && (
                  <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </div>

            {callsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  No Call Logs Found
                </h3>
                <p className="text-black dark:text-gray-300">
                  {selectedUserId === 'all'
                    ? 'No call logs available in the system yet.'
                    : 'No call logs found for the selected user.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                        Phone Number
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                        Type/Direction
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                        Duration
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                        Summary
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map(call => (
                      <tr
                        key={call.id}
                        className="border-b border-gray-100 hover:bg-white dark:bg-gray-800 dark:bg-gray-900"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-black dark:text-white">
                              {call.profiles?.full_name ||
                                call.user_id ||
                                'Unknown User'}
                            </div>
                            <div className="text-sm text-black dark:text-gray-300">
                              {call.profiles?.business_name ||
                                call.profiles?.email ||
                                'No profile data'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-black dark:text-white">
                            {call.direction === 'inbound'
                              ? call.from_number
                              : call.to_number || call.phone_number || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              call.call_type === 'completed'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              call.call_type === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : call.call_type === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {call.call_type || call.direction || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-black dark:text-white">
                            {call.duration
                              ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}`
                              : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-black dark:text-white">
                              {call.start_timestamp || call.created_at
                                ? new Date(
                                    call.start_timestamp || call.created_at
                                  ).toLocaleDateString()
                                : '-'}
                            </div>
                            <div className="text-sm text-black dark:text-gray-300">
                              {call.start_timestamp || call.created_at
                                ? new Date(
                                    call.start_timestamp || call.created_at
                                  ).toLocaleTimeString()
                                : '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-black dark:text-white truncate">
                              {call.call_summary || 'No summary available'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
