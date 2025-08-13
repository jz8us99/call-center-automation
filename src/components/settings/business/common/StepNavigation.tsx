import { CheckIcon } from '@/components/icons';

export interface StepStatus {
  completed: boolean;
  canAccess: boolean;
}

export interface Step {
  id: 'business' | 'products' | 'services' | 'staff' | 'appointments' | 'agent';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  step: number;
  status: StepStatus;
}

interface StepNavigationProps {
  steps: readonly Step[];
  activeStep: Step['id'];
  onStepChange: (stepId: Step['id']) => void;
}

export function StepNavigation({
  steps,
  activeStep,
  onStepChange,
}: StepNavigationProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-0">
          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => step.status.canAccess && onStepChange(step.id)}
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
  );
}
