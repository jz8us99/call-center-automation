import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/icons';
import { Step } from './StepNavigation';

interface WorkflowState {
  businessInfo: { completed: boolean; canAccess: boolean };
  products: { completed: boolean; canAccess: boolean };
  services: { completed: boolean; canAccess: boolean };
  staffManagement: { completed: boolean; canAccess: boolean };
  appointmentSystem: { completed: boolean; canAccess: boolean };
  aiAgentSetup: { completed: boolean; canAccess: boolean };
}

interface ProgressNotificationProps {
  activeStep: Step['id'];
  workflowState: WorkflowState;
  onStepChange: (stepId: Step['id']) => void;
}

export function ProgressNotification({
  activeStep,
  workflowState,
  onStepChange,
}: ProgressNotificationProps) {
  if (
    workflowState.businessInfo.completed &&
    workflowState.products.canAccess &&
    activeStep === 'business'
  ) {
    return (
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
              onClick={() => onStepChange('products')}
              className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800"
            >
              <span className="text-orange-700 dark:text-orange-300">
                Go to Products →
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (workflowState.products.completed && activeStep === 'products') {
    return (
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
              onClick={() => onStepChange('services')}
              className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800"
            >
              <span className="text-orange-700 dark:text-orange-300">
                Go to Services →
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (
    workflowState.services.completed &&
    workflowState.appointmentSystem.canAccess &&
    activeStep === 'services'
  ) {
    return (
      <div className="bg-green-50 border-green-200 border-b dark:bg-green-900/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <CheckIcon className="h-3 w-3" />
              </div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Services configured! You can now proceed to Appointment System
                setup.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStepChange('appointments')}
              className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800"
            >
              <span className="text-orange-700 dark:text-orange-300">
                Go to Appointment System →
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (
    workflowState.appointmentSystem.completed &&
    workflowState.staffManagement.canAccess &&
    activeStep === 'appointments'
  ) {
    return (
      <div className="bg-green-50 border-green-200 border-b dark:bg-green-900/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <CheckIcon className="h-3 w-3" />
              </div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Appointment System configured! Now set up your staff schedules
                based on your business hours and holidays.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStepChange('staff')}
              className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-800"
            >
              <span className="text-orange-700 dark:text-orange-300">
                Go to Staff Management →
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
