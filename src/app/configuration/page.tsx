'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';

// Components
import { BusinessInformationStep } from '@/components/configuration/BusinessInformationStep';
import { BusinessProducts } from '@/components/configuration/BusinessProducts';
import { BusinessServices } from '@/components/configuration/BusinessServices';
import { StaffManagement } from '@/components/configuration/StaffManagement';
import { AppointmentSystem } from '@/components/configuration/AppointmentSystem';
import { AIAgentsStep } from '@/components/configuration/AIAgentsStep';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpButton } from '@/components/modals/HelpDialog';
import {
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  HomeIcon,
  CheckIcon,
  BuildingIcon,
  ClockIcon,
} from '@/components/icons';

interface StepStatus {
  completed: boolean;
  canAccess: boolean;
}

interface WorkflowState {
  businessInfo: StepStatus;
  products: StepStatus;
  services: StepStatus;
  staffManagement: StepStatus;
  appointmentSystem: StepStatus;
  aiAgentSetup: StepStatus;
}

export default function ConfigurationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState<
    'business' | 'products' | 'services' | 'staff' | 'appointments' | 'agent'
  >('business');

  // Workflow state tracking
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    businessInfo: { completed: false, canAccess: true },
    products: { completed: false, canAccess: false },
    services: { completed: false, canAccess: false },
    staffManagement: { completed: false, canAccess: false },
    appointmentSystem: { completed: false, canAccess: false },
    aiAgentSetup: { completed: false, canAccess: false },
  });

  const router = useRouter();
  const { loading: profileLoading } = useUserProfile(user);

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
        const stepKey = savedActiveStep as
          | 'business'
          | 'products'
          | 'services'
          | 'staff'
          | 'appointments'
          | 'agent';
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
          setActiveStep(
            savedActiveStep as
              | 'business'
              | 'products'
              | 'services'
              | 'staff'
              | 'appointments'
              | 'agent'
          );
        }
      }
    }
  }, [mounted, workflowState]);

  // Save state to session storage whenever it changes
  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem('configuration-active-step', activeStep);
      sessionStorage.setItem(
        'configuration-workflow-state',
        JSON.stringify(workflowState)
      );
    }
  }, [activeStep, workflowState, mounted]);

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
      // Load initial workflow state based on existing data
      loadInitialWorkflowState();
    }
  }, [loading, profileLoading, user, router, mounted]);

  // Load initial workflow state from the database
  const loadInitialWorkflowState = async () => {
    if (!user) return;

    try {
      // Check business information
      const businessResponse = await fetch(
        `/api/business-profile?user_id=${user.id}`
      );
      const businessData = await businessResponse.json();
      const hasBusinessInfo =
        businessData.profiles && businessData.profiles.length > 0;

      // Check products
      const productsResponse = await fetch(
        `/api/business-products?user_id=${user.id}`
      );
      const productsData = await productsResponse.json();
      const hasProducts =
        productsData.products && productsData.products.length > 0;

      // Check services
      const servicesResponse = await fetch(
        `/api/business-services?user_id=${user.id}`
      );
      const servicesData = await servicesResponse.json();
      const hasServices =
        servicesData.services && servicesData.services.length > 0;

      // Check appointments
      const appointmentsResponse = await fetch(
        `/api/appointment-types?user_id=${user.id}`
      );
      const appointmentsData = await appointmentsResponse.json();
      const hasAppointments =
        appointmentsData.appointment_types &&
        appointmentsData.appointment_types.length > 0;

      // Check staff
      const staffResponse = await fetch(
        `/api/staff-members?user_id=${user.id}`
      );
      const staffData = await staffResponse.json();
      const hasStaff = staffData.staff && staffData.staff.length > 0;

      // Check AI agents
      const agentsResponse = await fetch(`/api/ai-agents?user_id=${user.id}`);
      const agentsData = await agentsResponse.json();
      const hasAgents = agentsData.agents && agentsData.agents.length > 0;

      // Update workflow state based on actual data
      setWorkflowState({
        businessInfo: { completed: hasBusinessInfo, canAccess: true },
        products: { completed: hasProducts, canAccess: hasBusinessInfo },
        services: { completed: hasServices, canAccess: hasBusinessInfo },
        appointmentSystem: {
          completed: hasAppointments,
          canAccess: hasBusinessInfo && hasServices,
        },
        staffManagement: {
          completed: hasStaff,
          canAccess: hasBusinessInfo && hasServices && hasAppointments,
        },
        aiAgentSetup: {
          completed: hasAgents,
          canAccess:
            hasBusinessInfo &&
            hasProducts &&
            hasServices &&
            hasAppointments &&
            hasStaff,
        },
      });
    } catch (error) {
      console.warn('Failed to load initial workflow state:', error);
    }
  };

  // Handle workflow progression
  const handleBusinessInfoUpdate = useCallback((hasBusinessInfo: boolean) => {
    setWorkflowState(prev => ({
      ...prev,
      businessInfo: { ...prev.businessInfo, completed: hasBusinessInfo },
      products: { ...prev.products, canAccess: hasBusinessInfo },
      services: { ...prev.services, canAccess: hasBusinessInfo },
    }));
  }, []);

  const handleProductsUpdate = useCallback((hasProducts: boolean) => {
    setWorkflowState(prev => ({
      ...prev,
      products: { ...prev.products, completed: hasProducts },
    }));
  }, []);

  const handleServicesUpdate = useCallback((hasServices: boolean) => {
    setWorkflowState(prev => ({
      ...prev,
      services: { ...prev.services, completed: hasServices },
      appointmentSystem: {
        ...prev.appointmentSystem,
        canAccess: prev.businessInfo.completed && hasServices,
      },
    }));
  }, []);

  const handleStaffUpdate = useCallback((hasStaff: boolean) => {
    setWorkflowState(prev => ({
      ...prev,
      staffManagement: { ...prev.staffManagement, completed: hasStaff },
      aiAgentSetup: {
        ...prev.aiAgentSetup,
        canAccess:
          prev.businessInfo.completed &&
          prev.services.completed &&
          prev.appointmentSystem.completed &&
          hasStaff,
      },
    }));
  }, []);

  const handleAppointmentUpdate = useCallback((hasAppointments: boolean) => {
    setWorkflowState(prev => ({
      ...prev,
      appointmentSystem: {
        ...prev.appointmentSystem,
        completed: hasAppointments,
      },
      staffManagement: {
        ...prev.staffManagement,
        canAccess:
          prev.businessInfo.completed &&
          prev.services.completed &&
          hasAppointments,
      },
    }));
  }, []);

  const handleAgentSetupUpdate = useCallback((isComplete: boolean) => {
    setWorkflowState(prev => ({
      ...prev,
      aiAgentSetup: { ...prev.aiAgentSetup, completed: isComplete },
    }));
  }, []);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const steps = Object.values(workflowState);
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  if (!mounted || loading || profileLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const steps = [
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
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-black dark:text-gray-300 hover:text-black dark:text-white"
              >
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  AI Agent Configuration
                </h1>
                <p className="text-sm text-black dark:text-gray-300">
                  Manage your AI voice agent settings and business information
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-black dark:text-gray-300 hover:text-black dark:text-white"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-black dark:text-gray-300 hover:text-black dark:text-white"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Setup Progress
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {getProgressPercentage()}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-0">
            {steps.map(step => (
              <button
                key={step.id}
                onClick={() => step.status.canAccess && setActiveStep(step.id)}
                disabled={!step.status.canAccess}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${
                  activeStep === step.id
                    ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20'
                    : step.status.canAccess
                      ? 'border-transparent text-gray-900 hover:text-orange-600 hover:border-orange-300 dark:text-gray-100'
                      : 'border-transparent text-gray-400 cursor-not-allowed dark:text-gray-600'
                } ${step.status.completed ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.status.completed
                        ? 'bg-green-500 text-white'
                        : step.status.canAccess
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-500'
                    }`}
                  >
                    {step.status.completed ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      step.step
                    )}
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-medium ${
                        activeStep === step.id
                          ? '!text-orange-600'
                          : step.status.canAccess
                            ? '!text-red-600 dark:!text-red-400'
                            : '!text-gray-400 dark:!text-gray-600'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Progress Notifications */}
      {workflowState.businessInfo.completed &&
        workflowState.products.canAccess &&
        activeStep === 'business' && (
          <div className="bg-green-50 border-green-200 border-b dark:bg-green-900/20">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Business Information completed! You can now configure your
                    Products and Services.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep('products')}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <span className="text-orange-700 dark:text-orange-300">
                    Go to Products →
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

      {workflowState.products.completed && activeStep === 'products' && (
        <div className="bg-green-50 border-green-200 border-b dark:bg-green-900/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-3 w-3" />
                </div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Products configured! You can now configure your Services.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep('services')}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <span className="text-orange-700 dark:text-orange-300">
                  Go to Services →
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {workflowState.services.completed &&
        workflowState.appointmentSystem.canAccess &&
        activeStep === 'services' && (
          <div className="bg-green-50 border-green-200 border-b dark:bg-green-900/20">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Services configured! You can now proceed to Appointment
                    System setup.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep('appointments')}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <span className="text-orange-700 dark:text-orange-300">
                    Go to Appointment System →
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

      {workflowState.appointmentSystem.completed &&
        workflowState.staffManagement.canAccess &&
        activeStep === 'appointments' && (
          <div className="bg-green-50 border-green-200 border-b dark:bg-green-900/20">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Appointment System configured! Now set up your staff
                    schedules based on your business hours and holidays.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveStep('staff')}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <span className="text-orange-700 dark:text-orange-300">
                    Go to Staff Management →
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Requirements Notice */}
      {!workflowState.aiAgentSetup.canAccess && (
        <div className="bg-amber-50 border-amber-200 border-b dark:bg-amber-900/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <div className="w-5 h-5 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center">
                <span className="text-xs">!</span>
              </div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Complete Business Information, Products, Services, Appointment
                System, and Staff Management before setting up your AI Agent.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeStep === 'business' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Step 1: Business Information
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Provide comprehensive information about your business. This
                information will be shared across all your AI agents and staff
                management systems.
              </p>
            </div>
            <BusinessInformationStep
              user={user}
              onBusinessProfileUpdate={handleBusinessInfoUpdate}
            />
          </div>
        )}

        {activeStep === 'products' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Step 2: Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Manage your product inventory, pricing, and details. Products
                are items you sell that don't require appointments.
              </p>
            </div>
            {workflowState.products.canAccess ? (
              <BusinessProducts
                user={user}
                onProductsUpdate={handleProductsUpdate}
              />
            ) : (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Complete Business Information First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please complete the Business Information step before
                    configuring products.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeStep === 'services' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Step 3: Services
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Configure appointment-based services with duration, pricing, and
                scheduling requirements.
              </p>
            </div>
            {workflowState.services.canAccess ? (
              <BusinessServices
                user={user}
                onServicesUpdate={handleServicesUpdate}
              />
            ) : (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Complete Business Information First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please complete the Business Information step before
                    configuring services.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeStep === 'appointments' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Step 4: Appointment System
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Configure appointment types, business hours, and booking
                settings. This enables the AI to handle appointment scheduling
                requests and provides the foundation for staff scheduling.
              </p>
            </div>
            {workflowState.appointmentSystem.canAccess ? (
              <AppointmentSystem
                user={user}
                onAppointmentUpdate={handleAppointmentUpdate}
              />
            ) : (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Complete Previous Steps First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please complete Business Information and Services before
                    configuring the appointment system.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeStep === 'staff' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Step 5: Staff Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Add your staff members and configure their individual schedules
                and specialties based on your business hours and holidays. This
                helps the AI provide accurate availability information.
              </p>
            </div>
            {workflowState.staffManagement.canAccess ? (
              <StaffManagement user={user} onStaffUpdate={handleStaffUpdate} />
            ) : (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Complete Previous Steps First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please complete Business Information, Services, and
                    Appointment System before managing staff.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeStep === 'agent' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
                Step 6: AI Agents Setup
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create and manage multiple AI agents with different types and
                purposes. Each agent can have unique personalities, scripts, and
                capabilities while sharing your business context.
              </p>
            </div>
            {workflowState.aiAgentSetup.canAccess ? (
              <AIAgentsStep
                user={user}
                onConfigurationUpdate={handleAgentSetupUpdate}
              />
            ) : (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-8 text-center">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Complete All Prerequisites First
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please complete Business Information, Products, Services,
                    Staff Management, and Appointment System before setting up
                    your AI Agents.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center justify-center gap-4">
                      <span
                        className={
                          workflowState.businessInfo.completed
                            ? 'text-green-600'
                            : ''
                        }
                      >
                        ✓ Business Info{' '}
                        {workflowState.businessInfo.completed
                          ? '(Complete)'
                          : '(Pending)'}
                      </span>
                      <span
                        className={
                          workflowState.products.completed
                            ? 'text-green-600'
                            : ''
                        }
                      >
                        ✓ Products{' '}
                        {workflowState.products.completed
                          ? '(Complete)'
                          : '(Pending)'}
                      </span>
                      <span
                        className={
                          workflowState.services.completed
                            ? 'text-green-600'
                            : ''
                        }
                      >
                        ✓ Services{' '}
                        {workflowState.services.completed
                          ? '(Complete)'
                          : '(Pending)'}
                      </span>
                      <span
                        className={
                          workflowState.appointmentSystem.completed
                            ? 'text-green-600'
                            : ''
                        }
                      >
                        ✓ Appointments{' '}
                        {workflowState.appointmentSystem.completed
                          ? '(Complete)'
                          : '(Pending)'}
                      </span>
                      <span
                        className={
                          workflowState.staffManagement.completed
                            ? 'text-green-600'
                            : ''
                        }
                      >
                        ✓ Staff Management{' '}
                        {workflowState.staffManagement.completed
                          ? '(Complete)'
                          : '(Pending)'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Help Button */}
      <HelpButton currentPage="configuration" />
    </div>
  );
}
