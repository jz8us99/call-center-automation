'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SimpleThemeSwitch } from '@/components/common/SimpleThemeSwitch';
import { SettingsIcon } from '@/components/icons';
import { User } from '@supabase/supabase-js';
import { useBrand } from '@/lib/brand';

interface DashboardHeaderProps {
  user: User | null;
  userDisplayName: string;
  pageType: 'admin' | 'dashboard';
  showConfigurationLink?: boolean;
}

export function DashboardHeader({
  user,
  userDisplayName,
  pageType,
  showConfigurationLink = false,
}: DashboardHeaderProps) {
  const router = useRouter();
  const brand = useBrand();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getBadgeStyles = () => {
    if (pageType === 'admin') {
      return 'bg-red-100 text-red-700';
    }
    return 'bg-orange-100 text-orange-700';
  };

  const getBadgeText = () => {
    return pageType === 'admin' ? 'Admin' : 'Dashboard';
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <span className="text-xl font-bold text-black dark:text-white">
                {brand.name}
              </span>
            </Link>
            <span
              className={`text-sm px-2 py-1 rounded-full ${getBadgeStyles()}`}
            >
              {getBadgeText()}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {showConfigurationLink && (
              <Link
                href="/configuration"
                className="flex items-center gap-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Configuration</span>
              </Link>
            )}

            <span className="text-sm text-black dark:text-gray-300">
              Welcome, {userDisplayName}
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

            <SimpleThemeSwitch />
          </div>
        </div>
      </div>
    </header>
  );
}
