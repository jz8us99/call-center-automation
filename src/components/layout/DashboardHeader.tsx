'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SimpleThemeSwitch } from '@/components/common/SimpleThemeSwitch';
import { SettingsIcon } from '@/components/icons';
import { User } from '@supabase/supabase-js';
import { useBrand } from '@/lib/brand';

interface DashboardHeaderProps {
  user: User | null;
  userDisplayName: string;
  pageType: 'admin' | 'dashboard';
}

export function DashboardHeader({
  user,
  userDisplayName,
  pageType,
}: DashboardHeaderProps) {
  const router = useRouter();
  const brand = useBrand();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
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
            {user && (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-black dark:text-gray-300">
                    Welcome, {userDisplayName}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-3 py-2 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                  >
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                      {userDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <svg
                      className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {userDisplayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-black dark:text-white font-medium">
                              {userDisplayName}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href={pageType === 'admin' ? '/admin' : '/dashboard'}
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
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
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          {pageType === 'admin' ? 'Admin Panel' : 'Dashboard'}
                        </Link>

                        <Link
                          href="/configuration"
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <SettingsIcon className="h-4 w-4" />
                          Settings
                        </Link>

                        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-300 transition-colors w-full text-left"
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
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <SimpleThemeSwitch />
          </div>
        </div>
      </div>
    </header>
  );
}
