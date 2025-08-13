'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { locales } from '@/lib/i18n';
import { ChevronDown, Globe } from 'lucide-react';

const languageNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
};

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);

    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.startsWith(`/${locale}`)
      ? pathname.slice(locale.length + 1)
      : pathname;

    // Add the new locale to the path
    const newPath =
      newLocale === 'en'
        ? pathWithoutLocale || '/'
        : `/${newLocale}${pathWithoutLocale}`;

    router.push(newPath);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span>{languageNames[locale]}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {locales.map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  locale === lang
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
