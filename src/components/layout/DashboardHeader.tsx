'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useBrand } from '@/lib/brand';
import {
  ChevronDown,
  ChevronRight,
  Monitor,
  Settings,
  LogOut,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardHeaderProps {
  user: User | null;
  userDisplayName: string;
  pageType: 'admin' | 'dashboard' | 'settings';
}

export function DashboardHeader({
  user,
  userDisplayName,
  pageType,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const brand = useBrand();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = useTranslations('dashboardHeader');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        // Check if the click is inside the dropdown menu
        const target = event.target as Element;
        const dropdown = target.closest('[data-dropdown="user-menu"]');
        if (!dropdown) {
          setShowUserMenu(false);
        }
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

  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    if (parts.length > 0 && parts[0] === 'admin') {
      breadcrumbs.push({
        label: t('breadcrumbs.admin'),
        href: '/admin',
        isActive: parts.length === 1,
      });

      if (parts.length > 1) {
        const subPage = parts[1];
        const subPageLabels: Record<string, string> = {
          dashboard: t('breadcrumbs.dashboard'),
          users: t('breadcrumbs.users'),
          pricing: t('breadcrumbs.pricing'),
          settings: t('breadcrumbs.settings'),
        };

        if (subPageLabels[subPage]) {
          breadcrumbs.push({
            label: subPageLabels[subPage],
            href: `/admin/${subPage}`,
            isActive: true,
          });
        }

        // Handle deeper paths like /admin/users/[userId]/agent-config
        if (parts.length > 2) {
          if (subPage === 'users' && parts[2]) {
            breadcrumbs[breadcrumbs.length - 1].isActive = false;
            breadcrumbs.push({
              label: t('breadcrumbs.userDetails'),
              href: `/admin/users/${parts[2]}`,
              isActive: parts.length === 3,
            });

            if (parts.length > 3 && parts[3] === 'agent-config') {
              breadcrumbs[breadcrumbs.length - 1].isActive = false;
              breadcrumbs.push({
                label: t('breadcrumbs.agentConfig'),
                href: `/admin/users/${parts[2]}/agent-config`,
                isActive: true,
              });
            }
          }
        }
      }
    } else if (pageType === 'dashboard') {
      breadcrumbs.push({
        label: t('breadcrumbs.dashboard'),
        href: '/dashboard',
        isActive: true,
      });
    } else if (pageType === 'settings') {
      breadcrumbs.push({
        label: t('breadcrumbs.settings'),
        href: '/settings',
        isActive: true,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

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

            {/* Breadcrumb Navigation */}
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-2">
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb.href} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                    )}
                    {crumb.isActive ? (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-black dark:text-gray-300">
                    {t('welcome', { name: userDisplayName })}
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
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {showUserMenu && (
                  <div
                    data-dropdown="user-menu"
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
                  >
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
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
                        </Link>
                      </div>

                      <div className="py-1">
                        <Link
                          href={pageType === 'admin' ? '/admin' : '/dashboard'}
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Monitor className="h-4 w-4" />
                          {pageType === 'admin'
                            ? t('navigation.adminPanel')
                            : t('navigation.dashboard')}
                        </Link>

                        {/* Only show Settings for non-admin users */}
                        {pageType !== 'admin' && (
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="h-4 w-4" />
                            {t('navigation.settings')}
                          </Link>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-300 transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('navigation.signOut')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
