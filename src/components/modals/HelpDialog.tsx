'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HelpIcon,
  CloseIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  PhoneIcon,
  PlusIcon,
} from '@/components/icons';
import { useTranslations } from 'next-intl';

interface HelpDialogProps {
  currentPage?:
    | 'home'
    | 'dashboard'
    | 'configuration'
    | 'auth'
    | 'signup'
    | 'settings';
}

export function HelpDialog({ currentPage = 'home' }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('modals.help');

  // Helper function to get array content from numbered keys
  const getArrayContent = (baseKey: string, count: number = 3): string[] => {
    const result: string[] = [];
    for (let i = 1; i <= count; i++) {
      try {
        const value = t(`${baseKey}${i}`);
        if (value) result.push(value);
      } catch {
        break;
      }
    }
    return result;
  };

  const navigationGuides = {
    home: {
      title: t('pages.home.title'),
      description: t('pages.home.description'),
      sections: [
        {
          title: t('pages.home.gettingStarted'),
          content: getArrayContent('pages.home.gettingStartedContent', 3),
        },
        {
          title: t('pages.home.availableFeatures'),
          content: getArrayContent('pages.home.availableFeaturesContent', 3),
        },
      ],
    },
    auth: {
      title: t('pages.auth.title'),
      description: t('pages.auth.description'),
      sections: [
        {
          title: t('pages.auth.signInOptions'),
          content: getArrayContent('pages.auth.signInOptionsContent', 3),
        },
        {
          title: t('pages.auth.newUsers'),
          content: getArrayContent('pages.auth.newUsersContent', 3),
        },
      ],
    },
    dashboard: {
      title: t('pages.dashboard.title'),
      description: t('pages.dashboard.description'),
      sections: [
        {
          title: t('pages.dashboard.mainNavigation'),
          content: getArrayContent('pages.dashboard.mainNavigationContent', 3),
        },
        {
          title: t('pages.dashboard.dashboardFeatures'),
          content: getArrayContent(
            'pages.dashboard.dashboardFeaturesContent',
            3
          ),
        },
        {
          title: t('pages.dashboard.quickActions'),
          content: getArrayContent('pages.dashboard.quickActionsContent', 3),
        },
      ],
    },
    configuration: {
      title: t('pages.configuration.title'),
      description: t('pages.configuration.description'),
      sections: [
        {
          title: t('pages.configuration.navigationTabs'),
          content: getArrayContent(
            'pages.configuration.navigationTabsContent',
            6
          ),
        },
        {
          title: t('pages.configuration.aiAgentSetup'),
          content: getArrayContent(
            'pages.configuration.aiAgentSetupContent',
            3
          ),
        },
        {
          title: t('pages.configuration.staffManagement'),
          content: getArrayContent(
            'pages.configuration.staffManagementContent',
            3
          ),
        },
      ],
    },
    signup: {
      title: t('pages.signup.title'),
      description: t('pages.signup.description'),
      sections: [
        {
          title: t('pages.signup.accountCreation'),
          content: getArrayContent('pages.signup.accountCreationContent', 3),
        },
        {
          title: t('pages.signup.gettingStarted'),
          content: getArrayContent('pages.signup.gettingStartedContent', 3),
        },
        {
          title: t('pages.signup.existingUsers'),
          content: getArrayContent('pages.signup.existingUsersContent', 3),
        },
      ],
    },
  };

  const currentGuide = navigationGuides[currentPage] || navigationGuides.home;

  const allPages = [
    {
      name: t('allPages.pages.homePage'),
      path: '/',
      icon: HomeIcon,
      description: t('allPages.descriptions.homePage'),
    },
    {
      name: t('allPages.pages.signIn'),
      path: '/auth',
      icon: UsersIcon,
      description: t('allPages.descriptions.signIn'),
    },
    {
      name: t('allPages.pages.signUp'),
      path: '/signup',
      icon: PlusIcon,
      description: t('allPages.descriptions.signUp'),
    },
    {
      name: t('allPages.pages.dashboard'),
      path: '/dashboard',
      icon: PhoneIcon,
      description: t('allPages.descriptions.dashboard'),
    },
    {
      name: t('allPages.pages.configuration'),
      path: '/configuration',
      icon: SettingsIcon,
      description: t('allPages.descriptions.configuration'),
    },
    {
      name: t('allPages.pages.adminDashboard'),
      path: '/admin/dashboard',
      icon: UsersIcon,
      description: t('allPages.descriptions.adminDashboard'),
    },
  ];

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <HelpIcon className="h-4 w-4 mr-2" />
        {t('helpButton')}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <HelpIcon className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Current Page Guide */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                  <span>{currentGuide.title}</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {currentGuide.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentGuide.sections.map((section, index) => (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* All Pages Overview */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  {t('allPages.title')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('allPages.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {allPages.map((page, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:border-orange-300 dark:hover:border-orange-400 transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <page.icon className="h-5 w-5 text-orange-600" />
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {page.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {page.path}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {page.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Tips */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  {t('navigationTips.title')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('navigationTips.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('navigationTips.homeNavigation')}
                    </h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {getArrayContent(
                        'navigationTips.homeNavigationContent',
                        3
                      ).map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('navigationTips.findingFeatures')}
                    </h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {getArrayContent(
                        'navigationTips.findingFeaturesContent',
                        3
                      ).map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('navigationTips.accountManagement')}
                    </h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {getArrayContent(
                        'navigationTips.accountManagementContent',
                        3
                      ).map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('navigationTips.configuration')}
                    </h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      {getArrayContent(
                        'navigationTips.configurationContent',
                        3
                      ).map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">
                  {t('keyboardShortcuts.title')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('keyboardShortcuts.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('keyboardShortcuts.general')}
                    </h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded text-xs">
                          ?
                        </kbd>{' '}
                        {t('keyboardShortcuts.generalShortcuts.help')}
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded text-xs">
                          Esc
                        </kbd>{' '}
                        {t('keyboardShortcuts.generalShortcuts.escape')}
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded text-xs">
                          Tab
                        </kbd>{' '}
                        {t('keyboardShortcuts.generalShortcuts.tab')}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      {t('keyboardShortcuts.dashboard')}
                    </h4>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded text-xs">
                          Ctrl+F
                        </kbd>{' '}
                        {t('keyboardShortcuts.dashboardShortcuts.search')}
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded text-xs">
                          Space
                        </kbd>{' '}
                        {t('keyboardShortcuts.dashboardShortcuts.playPause')}
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded text-xs">
                          Enter
                        </kbd>{' '}
                        {t('keyboardShortcuts.dashboardShortcuts.openDetails')}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-300">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('needMoreHelp')}
            </p>
            <Button onClick={() => setIsOpen(false)}>{t('gotIt')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for adding help to any page
export function HelpButton({
  currentPage,
}: {
  currentPage?: HelpDialogProps['currentPage'];
}) {
  return <HelpDialog currentPage={currentPage} />;
}
