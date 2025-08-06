// Test file to verify icon imports are working
// This is for debugging only - delete after fixing the issue

import React from 'react';
import {
  PlusIcon,
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  HomeIcon,
  CheckIcon,
  BuildingIcon,
  ClockIcon,
} from '@/components/icons';

export function TestIconImports() {
  return (
    <div className="p-4">
      <h2>Icon Import Test</h2>
      <div className="flex gap-2">
        <PlusIcon className="h-6 w-6" />
        <SettingsIcon className="h-6 w-6" />
        <UsersIcon className="h-6 w-6" />
        <CalendarIcon className="h-6 w-6" />
        <HomeIcon className="h-6 w-6" />
        <CheckIcon className="h-6 w-6" />
        <BuildingIcon className="h-6 w-6" />
        <ClockIcon className="h-6 w-6" />
      </div>
    </div>
  );
}
