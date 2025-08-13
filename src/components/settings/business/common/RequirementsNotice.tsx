interface RequirementsNoticeProps {
  showNotice: boolean;
}

export function RequirementsNotice({ showNotice }: RequirementsNoticeProps) {
  if (!showNotice) return null;

  return (
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
  );
}
