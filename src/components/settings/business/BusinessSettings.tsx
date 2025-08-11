'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useUserProfile } from '@/hooks/useUserProfile';

// Import existing configuration components
import { LoadingScreen } from '@/components/configuration/ConfigurationPage/LoadingScreen';
import { Step } from '@/components/configuration/ConfigurationPage/StepNavigation';
import { RequirementsNotice } from '@/components/configuration/ConfigurationPage/RequirementsNotice';
import { StepContent } from '@/components/configuration/ConfigurationPage/StepContent';
import { useWorkflowState } from '@/components/configuration/ConfigurationPage/hooks/useWorkflowState';

// Import icons
import {
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  BuildingIcon,
  ClockIcon,
  CheckIcon,
} from '@/components/icons';

interface BusinessSettingsProps {
  user: User;
}

export default function BusinessSettings({ user }: BusinessSettingsProps) {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState<Step['id']>('business');

  const { loading: profileLoading } = useUserProfile(user);

  // Use custom hook for workflow state management
  const {
    workflowState,
    loadInitialWorkflowState,
    handleBusinessInfoUpdate,
    handleProductsUpdate,
    handleServicesUpdate,
    handleStaffUpdate,
    handleAppointmentUpdate,
    handleAgentSetupUpdate,
  } = useWorkflowState(user, mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore saved active step after workflow state is loaded
  useEffect(() => {
    if (mounted && workflowState.businessInfo.canAccess) {
      const savedActiveStep = sessionStorage.getItem(
        'business-settings-active-step'
      );
      if (
        savedActiveStep &&
        [
          'business',
          'products',
          'services',
          'staff',
          'appointments',
          'agent',
        ].includes(savedActiveStep)
      ) {
        const stepKey = savedActiveStep as Step['id'];
        const stepMapping = {
          business: 'businessInfo',
          products: 'products',
          services: 'services',
          staff: 'staffManagement',
          appointments: 'appointmentSystem',
          agent: 'aiAgentSetup',
        } as const;

        const workflowKey = stepMapping[stepKey] || 'businessInfo';
        if (workflowState[workflowKey]?.canAccess) {
          setActiveStep(savedActiveStep as Step['id']);
        }
      }
    }
  }, [mounted, workflowState]);

  // Save active step to session storage
  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem('business-settings-active-step', activeStep);
    }
  }, [activeStep, mounted]);

  useEffect(() => {
    if (!profileLoading && user && mounted) {
      loadInitialWorkflowState();
    }
  }, [profileLoading, user, mounted, loadInitialWorkflowState]);

  if (!mounted || profileLoading) {
    return <LoadingScreen />;
  }

  const steps: readonly Step[] = [
    {
      id: 'business',
      label: 'Business Information',
      icon: BuildingIcon,
      description:
        'Train your AI to understand your business as much as it can',
      step: 1,
      status: workflowState.businessInfo,
    },
    {
      id: 'products',
      label: 'Products',
      icon: SettingsIcon,
      description: 'Manage your product inventory and pricing',
      step: 2,
      status: workflowState.products,
    },
    {
      id: 'services',
      label: 'Services',
      icon: ClockIcon,
      description:
        'Configure appointment-based services with duration and pricing',
      step: 3,
      status: workflowState.services,
    },
    {
      id: 'appointments',
      label: 'Appointment System',
      icon: CalendarIcon,
      description:
        'Configure appointment types, business hours, and booking settings',
      step: 4,
      status: workflowState.appointmentSystem,
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: UsersIcon,
      description:
        'Add staff members and manage their schedules based on business hours',
      step: 5,
      status: workflowState.staffManagement,
    },
    {
      id: 'agent',
      label: 'AI Agents Setup',
      icon: SettingsIcon,
      description:
        'Create and manage multiple AI agents with different capabilities',
      step: 6,
      status: workflowState.aiAgentSetup,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Left Sidebar Menu */}
        <div className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <nav className="space-y-2">
            {steps.map(step => {
              return (
                <button
                  key={step.id}
                  onClick={() =>
                    step.status.canAccess && setActiveStep(step.id)
                  }
                  disabled={!step.status.canAccess}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeStep === step.id
                      ? 'bg-orange-200 text-orange-800 dark:bg-orange-300/30 dark:text-orange-200'
                      : step.status.canAccess
                        ? 'text-gray-900 hover:bg-orange-50 dark:text-gray-100 dark:hover:bg-orange-900/20'
                        : 'text-gray-400 cursor-not-allowed dark:text-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status.completed
                          ? 'bg-green-500 text-white'
                          : activeStep === step.id
                            ? 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white'
                            : step.status.canAccess
                              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
                              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                    >
                      {step.status.completed ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        step.step
                      )}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          activeStep === step.id
                            ? 'text-orange-800 dark:text-orange-200'
                            : ''
                        }`}
                      >
                        {step.label}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          activeStep === step.id
                            ? 'text-orange-700 dark:text-orange-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-6">
            <RequirementsNotice
              showNotice={!workflowState.aiAgentSetup.canAccess}
            />
          </div>
          <StepContent
            activeStep={activeStep}
            user={user}
            workflowState={workflowState}
            onBusinessInfoUpdate={handleBusinessInfoUpdate}
            onProductsUpdate={handleProductsUpdate}
            onServicesUpdate={handleServicesUpdate}
            onStaffUpdate={handleStaffUpdate}
            onAppointmentUpdate={handleAppointmentUpdate}
            onAgentSetupUpdate={handleAgentSetupUpdate}
          />
        </div>
      </div>
    </div>
  );
}
