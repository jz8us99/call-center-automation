'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { SimpleThemeSwitch } from '@/components/common/SimpleThemeSwitch';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { profile, isAdmin } = useUserProfile(user);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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
    setUser(null);
    setShowUserMenu(false);
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <header
      className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 sticky top-0 z-50 shadow-sm"
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">R</span>
            </div>
            <span className="text-xl font-bold text-black dark:text-white">
              ReceptionPro
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#products"
              className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white transition-colors"
            >
              Products
            </a>
            <a
              href="#solutions"
              className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white transition-colors"
            >
              Solutions
            </a>
            <Link
              href="/pricing"
              className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <a
              href="#partners"
              className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white transition-colors"
            >
              Partners
            </a>
            <a
              href="#company"
              className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white transition-colors"
            >
              Company
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-black dark:text-gray-300">
                    Welcome, {getUserDisplayName()}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-3 py-2 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                  >
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                      {getUserDisplayName().charAt(0).toUpperCase()}
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
                            {getUserDisplayName().charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-black dark:text-white font-medium">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href={isAdmin ? '/admin' : '/dashboard'}
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
                          {isAdmin ? 'Admin Panel' : 'Dashboard'}
                        </Link>

                        <Link
                          href="/configuration"
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
                              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
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
            ) : (
              <>
                <Link
                  href="/auth"
                  className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <span className="text-gray-400">|</span>
                <a
                  href="tel:+15551234567"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-500 hover:text-white text-black dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-orange-500 rounded-lg transition-all duration-200 border border-gray-300 dark:border-gray-600 hover:border-orange-500 shadow-sm"
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  (555) 123-4567
                </a>
              </>
            )}
            <SimpleThemeSwitch />
          </div>
        </div>
      </div>
    </header>
  );
}
