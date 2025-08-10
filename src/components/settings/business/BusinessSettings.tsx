'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useUserProfile } from '@/hooks/useUserProfile';

// Import existing configuration components
import { LoadingScreen } from '@/components/configuration/ConfigurationPage/LoadingScreen';
import { ProgressBar } from '@/components/configuration/ConfigurationPage/ProgressBar';
import {
  StepNavigation,
  Step,
} from '@/components/configuration/ConfigurationPage/StepNavigation';
import { ProgressNotification } from '@/components/configuration/ConfigurationPage/ProgressNotification';
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
} from '@/components/icons';

interface BusinessSettingsProps {
  user: User;
}

export default function BusinessSettings({ user }: BusinessSettingsProps) {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState<Step['id']>('business');

  const { profile, loading: profileLoading } = useUserProfile(user);

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
    getProgressPercentage,
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
      <ProgressBar percentage={getProgressPercentage()} />
      <StepNavigation
        steps={steps}
        activeStep={activeStep}
        onStepChange={setActiveStep}
      />
      <ProgressNotification
        activeStep={activeStep}
        workflowState={workflowState}
        onStepChange={setActiveStep}
      />
      <RequirementsNotice showNotice={!workflowState.aiAgentSetup.canAccess} />

      {/* Main Content */}
      <div className="space-y-8">
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
  );
}
