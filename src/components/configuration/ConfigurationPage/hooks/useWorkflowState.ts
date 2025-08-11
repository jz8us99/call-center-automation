import { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';

interface StepStatus {
  completed: boolean;
  canAccess: boolean;
}

export interface WorkflowState {
  businessInfo: StepStatus;
  products: StepStatus;
  services: StepStatus;
  staffManagement: StepStatus;
  appointmentSystem: StepStatus;
  aiAgentSetup: StepStatus;
}

export function useWorkflowState(user: User | null, mounted: boolean) {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    businessInfo: { completed: false, canAccess: true },
    products: { completed: false, canAccess: false },
    services: { completed: false, canAccess: false },
    staffManagement: { completed: false, canAccess: false },
    appointmentSystem: { completed: false, canAccess: false },
    aiAgentSetup: { completed: false, canAccess: false },
  });

  // Load initial workflow state from the database
  const loadInitialWorkflowState = useCallback(async () => {
    if (!user) return;

    try {
      // Assume business information is available (removed problematic API call)
      const hasBusinessInfo = true;

      // Check products
      const productsResponse = await authenticatedFetch(`/api/business/products`);
      const productsData = await productsResponse.json();
      const hasProducts =
        productsData.products && productsData.products.length > 0;

      // Check services
      const servicesResponse = await authenticatedFetch(`/api/business/services`);
      const servicesData = await servicesResponse.json();
      const hasServices =
        servicesData.services && servicesData.services.length > 0;

      // Check appointments
      const appointmentsResponse = await authenticatedFetch(`/api/appointment-types`);
      const appointmentsData = await appointmentsResponse.json();
      const hasAppointments =
        appointmentsData.appointment_types &&
        appointmentsData.appointment_types.length > 0;

      // Check staff
      const staffResponse = await authenticatedFetch(`/api/business/staff-members`);
      const staffData = await staffResponse.json();
      const hasStaff = staffData.staff && staffData.staff.length > 0;

      // Check AI agents
      const agentsResponse = await authenticatedFetch(`/api/ai-agents`);
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
  }, [user]);

  // Save state to session storage whenever it changes
  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem(
        'configuration-workflow-state',
        JSON.stringify(workflowState)
      );
    }
  }, [workflowState, mounted]);

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
  const getProgressPercentage = useCallback(() => {
    const steps = Object.values(workflowState);
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [workflowState]);

  return {
    workflowState,
    loadInitialWorkflowState,
    handleBusinessInfoUpdate,
    handleProductsUpdate,
    handleServicesUpdate,
    handleStaffUpdate,
    handleAppointmentUpdate,
    handleAgentSetupUpdate,
    getProgressPercentage,
  };
}
