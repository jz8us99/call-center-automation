'use client';

import { useState } from 'react';
import { User, CreditCard, Settings } from 'lucide-react';

export type SettingsTab = 'business' | 'account' | 'payment';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: TabItem[] = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    description: 'Profile, security, and preferences',
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: CreditCard,
    description: 'Billing, subscriptions, and payment methods',
  },
  {
    id: 'business',
    label: 'Business',
    icon: Settings,
    description: 'Business configuration and AI agent setup',
  },
];

export default function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-3 py-4 px-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
