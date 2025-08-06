'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <div className="relative">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-sm border border-gray-300 bg-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked && 'bg-blue-600 border-blue-600 text-white',
          className
        )}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        {checked && <Check className="h-3 w-3" />}
      </div>
    </div>
  )
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
