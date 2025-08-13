import { User } from '@supabase/supabase-js';
import { BusinessInformationStep } from '@/components/settings/business/steps/step1-business/BusinessInformationStep';
import { BusinessProducts } from '@/components/settings/business/steps/step2-products/BusinessProducts';
import { BusinessServices } from '@/components/settings/business/steps/step3-services/BusinessServices';
import { StaffManagement } from '@/components/settings/business/steps/step5-staff/StaffManagement';
import { AppointmentSystemConfig } from '@/components/settings/business/steps/step4-appointments/AppointmentSystemConfig';
import { AIAgentsStep } from '@/components/settings/business/steps/step6-agents/AIAgentsStep';
import { Card, CardContent } from '@/components/ui/card';
import {
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  BuildingIcon,
  ClockIcon,
} from '@/components/icons';
import { Step } from '@/components/settings/business/common/StepNavigation';

interface StepContentProps {
  activeStep: Step['id'];
  user: User;
  workflowState: {
    businessInfo: { completed: boolean; canAccess: boolean };
    products: { completed: boolean; canAccess: boolean };
    services: { completed: boolean; canAccess: boolean };
    staffManagement: { completed: boolean; canAccess: boolean };
    appointmentSystem: { completed: boolean; canAccess: boolean };
    aiAgentSetup: { completed: boolean; canAccess: boolean };
  };
  onBusinessInfoUpdate: (hasBusinessInfo: boolean) => void;
  onProductsUpdate: (hasProducts: boolean) => void;
  onServicesUpdate: (hasServices: boolean) => void;
  onStaffUpdate: (hasStaff: boolean) => void;
  onAppointmentUpdate: (hasAppointments: boolean) => void;
  onAgentSetupUpdate: (isComplete: boolean) => void;
}

export function StepContent({
  activeStep,
  user,
  workflowState,
  onBusinessInfoUpdate,
  onProductsUpdate,
  onServicesUpdate,
  onStaffUpdate,
  onAppointmentUpdate,
  onAgentSetupUpdate,
}: StepContentProps) {
  switch (activeStep) {
    case 'business':
      return (
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
            onBusinessProfileUpdate={onBusinessInfoUpdate}
          />
        </div>
      );

    case 'products':
      return (
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
              Manage your product inventory, pricing, and details. Products are
              items you sell that don't require appointments.
            </p>
          </div>
          {workflowState.products.canAccess ? (
            <BusinessProducts user={user} onProductsUpdate={onProductsUpdate} />
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
      );

    case 'services':
      return (
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
            <BusinessServices user={user} onServicesUpdate={onServicesUpdate} />
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
      );

    case 'appointments':
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              Step 4: Appointment System
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Configure appointment types, business hours, and booking settings.
              This enables the AI to handle appointment scheduling requests and
              provides the foundation for staff scheduling.
            </p>
          </div>
          {workflowState.appointmentSystem.canAccess ? (
            <AppointmentSystemConfig
              user={user}
              onAppointmentUpdate={onAppointmentUpdate}
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
      );

    case 'staff':
      return (
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
            <StaffManagement user={user} onStaffUpdate={onStaffUpdate} />
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
      );

    case 'agent':
      return (
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
              onConfigurationUpdate={onAgentSetupUpdate}
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
                        workflowState.products.completed ? 'text-green-600' : ''
                      }
                    >
                      ✓ Products{' '}
                      {workflowState.products.completed
                        ? '(Complete)'
                        : '(Pending)'}
                    </span>
                    <span
                      className={
                        workflowState.services.completed ? 'text-green-600' : ''
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
      );

    default:
      return null;
  }
}
