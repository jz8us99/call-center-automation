'use client';

import Link from 'next/link';

interface HomeButtonProps {
  variant?: 'default' | 'light' | 'dark';
  className?: string;
}

export const HomeButton: React.FC<HomeButtonProps> = ({
  variant = 'default',
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105';

  const variantClasses = {
    default:
      'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-md',
    light:
      'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm hover:shadow-md',
    dark: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 shadow-sm hover:shadow-md',
  };

  return (
    <Link
      href="/"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      Home
    </Link>
  );
};
