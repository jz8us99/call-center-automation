'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useBrand } from '@/lib/brand';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { profile, loading: profileLoading, isAdmin } = useUserProfile(user);
  const brand = useBrand();

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
    if (!loading && !profileLoading) {
      if (!user) {
        router.push('/auth');
      } else if (profile && !isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [loading, profileLoading, user, profile, isAdmin, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-white">
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={
          profile?.full_name || user?.email?.split('@')[0] || 'Admin'
        }
        pageType="admin"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Control Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your {brand.name} system from here.
            </p>
          </div>

          {/* Navigation Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md active:shadow-lg transform"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-blue-600"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  View system overview and analytics
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md active:shadow-lg transform"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-purple-600"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Management
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Manage user accounts and permissions
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md active:shadow-lg transform">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Configure application settings
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md active:shadow-lg transform">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reports
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Generate and view system reports
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md active:shadow-lg transform">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Monitoring
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Monitor system health and performance
                </p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md active:shadow-lg transform">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-cyan-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Database
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Database management and backups
                </p>
              </div>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Overview
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  -
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  -
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Active Sessions
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Online</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  System Status
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  -
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total Storage
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
