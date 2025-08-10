'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { HelpButton } from '@/components/modals/HelpDialog';
import {
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  BuildingIcon,
  ClockIcon,
} from '@/components/icons';

// Sub-components
import { LoadingScreen } from './LoadingScreen';
import { ProgressBar } from './ProgressBar';
import { StepNavigation, Step } from './StepNavigation';
import { ProgressNotification } from './ProgressNotification';
import { RequirementsNotice } from './RequirementsNotice';
import { StepContent } from './StepContent';
import { useWorkflowState } from './hooks/useWorkflowState';

export default function ConfigurationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState<Step['id']>('business');

  const router = useRouter();
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
        'configuration-active-step'
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
      sessionStorage.setItem('configuration-active-step', activeStep);
    }
  }, [activeStep, mounted]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!loading && !profileLoading && !user) {
      router.push('/auth');
    } else if (!loading && !profileLoading && user && mounted) {
      loadInitialWorkflowState();
    }
  }, [
    loading,
    profileLoading,
    user,
    router,
    mounted,
    loadInitialWorkflowState,
  ]);

  if (!mounted || loading || profileLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Will redirect to auth
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={
          profile?.full_name || user?.email?.split('@')[0] || 'User'
        }
        pageType="dashboard"
        showConfigurationLink={false}
      />

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
      <main className="container mx-auto px-4 py-8">
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
      </main>

      <HelpButton currentPage="configuration" />
    </div>
  );
}
