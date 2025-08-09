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
  CalendarIcon,
  PhoneIcon,
  PlusIcon,
} from '@/components/icons';

interface HelpDialogProps {
  currentPage?: 'home' | 'dashboard' | 'configuration' | 'auth' | 'signup';
}

export function HelpDialog({ currentPage = 'home' }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigationGuides = {
    home: {
      title: 'Home Page Navigation',
      description: 'Welcome to JSX-ReceptionAI - Your AI Call Center Assistant',
      sections: [
        {
          title: 'Getting Started',
          content: [
            '• Click "Sign In" to access your dashboard with existing account',
            '• Click "Sign Up" to create a new account',
            '• Use Google Sign-In for quick authentication',
          ],
        },
        {
          title: 'Available Features',
          content: [
            '• Dashboard - View call logs and statistics',
            '• Configuration - Set up AI agents and business settings',
            '• Call Management - Handle incoming calls and voicemails',
          ],
        },
      ],
    },
    auth: {
      title: 'Authentication Page',
      description: 'Sign in to access your call center management system',
      sections: [
        {
          title: 'Sign In Options',
          content: [
            '• Enter your email and password',
            '• Use "Sign in with Google" for quick access',
            '• Click "Forgot Password?" if you need to reset',
          ],
        },
        {
          title: 'New Users',
          content: [
            '• Click "Sign up" to create a new account',
            '• Admin users can invite team members',
          ],
        },
      ],
    },
    dashboard: {
      title: 'Dashboard Navigation',
      description: 'Your main control center for call management and analytics',
      sections: [
        {
          title: 'Main Navigation',
          content: [
            '• Home button (🏠) - Return to main page',
            '• Sign out - Log out of your account',
            '• User profile shows in top right corner',
          ],
        },
        {
          title: 'Dashboard Features',
          content: [
            "• Call Statistics - View total calls, today's calls, unique numbers",
            '• Call Logs Table - Browse all call records with search and filters',
            '• Audio Player - Listen to call recordings',
            '• Transcript Modal - Read call transcripts and summaries',
          ],
        },
        {
          title: 'Quick Actions',
          content: [
            '• Use search filters to find specific calls',
            '• Click on call rows to view details',
            '• Export call data for reporting',
            '• Access AI Agent Configuration from here',
          ],
        },
      ],
    },
    configuration: {
      title: 'Configuration Dashboard',
      description: 'Set up and customize your AI voice agents',
      sections: [
        {
          title: 'Navigation Tabs',
          content: [
            '• Overview - Quick setup guide and statistics',
            '• AI Agent - Configure voice agents and business info',
            '• Staff - Manage team members and schedules',
            '• Appointments - Set up booking system',
          ],
        },
        {
          title: 'AI Agent Setup',
          content: [
            '• Business Info - Enter your practice details',
            '• Call Scripts - Customize conversation templates',
            '• Voice Settings - Choose and tune AI voice characteristics',
            '• Call Routing - Set up forwarding and voicemail',
          ],
        },
        {
          title: 'Staff Management',
          content: [
            '• Add staff members with roles and contact info',
            '• Set weekly availability schedules',
            '• Manage time-off and holidays',
            '• Configure appointment booking preferences',
          ],
        },
      ],
    },
  };

  const currentGuide = (navigationGuides as any)[currentPage] || navigationGuides.home;

  const allPages = [
    {
      name: 'Home Page',
      path: '/',
      icon: HomeIcon,
      description: 'Main landing page with sign in/up options',
    },
    {
      name: 'Sign In',
      path: '/auth',
      icon: UsersIcon,
      description: 'Authentication page for existing users',
    },
    {
      name: 'Sign Up',
      path: '/signup',
      icon: PlusIcon,
      description: 'Registration page for new users',
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: PhoneIcon,
      description: 'Main dashboard with call logs and statistics',
    },
    {
      name: 'Configuration',
      path: '/configuration',
      icon: SettingsIcon,
      description: 'AI agent setup and business configuration',
    },
    {
      name: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: UsersIcon,
      description: 'Admin-only features and user management',
    },
  ];

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <HelpIcon className="h-4 w-4 mr-2" />
        Help
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <HelpIcon className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Navigation Help</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <CloseIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Current Page Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                  <span>{currentGuide.title}</span>
                </CardTitle>
                <CardDescription>{currentGuide.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentGuide.sections.map((section: any, index: number) => (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.content.map((item: any, itemIndex: number) => (
                        <li key={itemIndex} className="text-sm text-gray-600">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* All Pages Overview */}
            <Card>
              <CardHeader>
                <CardTitle>All Available Pages</CardTitle>
                <CardDescription>
                  Quick reference to navigate anywhere in the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {allPages.map((page, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <page.icon className="h-5 w-5 text-orange-600" />
                        <div>
                          <h4 className="font-semibold text-sm">{page.name}</h4>
                          <p className="text-xs text-gray-500">{page.path}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {page.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation Tips</CardTitle>
                <CardDescription>
                  General tips for using the application efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">🏠 Home Navigation</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>
                        • Home button available on all authenticated pages
                      </li>
                      <li>• Click the JSX-ReceptionAI logo to return home</li>
                      <li>• Use browser back button for previous page</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">🔍 Finding Features</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Use search filters in call logs</li>
                      <li>• Check tab navigation in configuration</li>
                      <li>• Look for help buttons on complex pages</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      👤 Account Management
                    </h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Profile info shown in top right</li>
                      <li>• Sign out button available everywhere</li>
                      <li>• Admin features require admin role</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">⚙️ Configuration</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Start with Overview tab for guidance</li>
                      <li>• Complete AI Agent setup first</li>
                      <li>• Add staff before setting up appointments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle>Keyboard Shortcuts</CardTitle>
                <CardDescription>
                  Speed up your workflow with these shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">General</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          ?
                        </kbd>{' '}
                        - Open this help dialog
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Esc
                        </kbd>{' '}
                        - Close modals/dialogs
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Tab
                        </kbd>{' '}
                        - Navigate between form fields
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dashboard</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Ctrl+F
                        </kbd>{' '}
                        - Focus search
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Space
                        </kbd>{' '}
                        - Play/pause audio
                      </li>
                      <li>
                        •{' '}
                        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                          Enter
                        </kbd>{' '}
                        - Open call details
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Need more help? Contact support or check the documentation.
            </p>
            <Button onClick={() => setIsOpen(false)}>Got it!</Button>
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
