'use client';

import { useTheme } from 'next-themes';

export const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark'
          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      }`}
      aria-label="Toggle theme"
      style={{
        backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        color: theme === 'dark' ? '#d1d5db' : '#374151',
      }}
    >
      {theme === 'light' ? (
        // Sun icon - shows in light mode (current state)
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon - shows in dark mode (current state)
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
};
