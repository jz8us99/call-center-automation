'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { SimpleThemeSwitch } from '@/components/common/SimpleThemeSwitch';
import { ChevronDown, Monitor, Settings, LogOut, Phone } from 'lucide-react';

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
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    />
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
                          <Monitor className="h-4 w-4" />
                          {isAdmin ? 'Admin Panel' : 'Dashboard'}
                        </Link>

                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>

                        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-300 transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
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
                  <Phone className="h-4 w-4" />
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
