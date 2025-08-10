'use client';

import { useState, useEffect } from 'react';

export const SimpleThemeSwitch = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const applyTheme = (darkMode: boolean) => {
    const html = document.documentElement;
    const body = document.body;

    if (darkMode) {
      html.classList.add('dark');
      body.classList.add('dark');
      body.style.backgroundColor = '#111827';
      body.style.color = '#f9fafb';
    } else {
      html.classList.remove('dark');
      body.classList.remove('dark');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#000000';
    }

    localStorage.setItem('theme', darkMode ? 'dark' : 'light');

    // Force re-render by triggering a small style change
    requestAnimationFrame(() => {
      // Trigger repaint to ensure styles are applied
      const buttons = document.querySelectorAll('[aria-label="Toggle theme"]');
      buttons.forEach(button => {
        if (button instanceof HTMLElement) {
          button.style.transition = 'all 0.2s ease';
        }
      });
    });

    // Debug logging
    console.log('Applied theme:', darkMode ? 'dark' : 'light');
    console.log('HTML classes:', html.classList.toString());
    console.log('Body style:', body.style.backgroundColor, body.style.color);
  };

  useEffect(() => {
    setMounted(true);

    // Clear localStorage for fresh start (temporary for debugging)
    // localStorage.removeItem('theme');

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    let isDarkMode = false;

    if (savedTheme) {
      isDarkMode = savedTheme === 'dark';
    } else {
      // Default to light mode
      isDarkMode = false;
    }

    console.log(
      'Initial theme setup:',
      isDarkMode ? 'dark' : 'light',
      'saved theme was:',
      savedTheme
    );
    setIsDark(isDarkMode);
    applyTheme(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    console.log(
      'Toggling theme from',
      isDark ? 'dark' : 'light',
      'to',
      newIsDark ? 'dark' : 'light'
    );
    setIsDark(newIsDark);
    applyTheme(newIsDark);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div className="p-2 rounded-lg w-9 h-9"></div>;
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${
        isDark
          ? 'text-gray-400 hover:text-gray-100'
          : 'text-gray-400 hover:text-black'
      }`}
      aria-label="Toggle theme"
    >
      {!isDark ? (
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
