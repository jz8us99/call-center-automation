import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('home.hero');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-black dark:text-white mb-8 leading-tight">
            {t('title')}
            <br />
            <span className="text-orange-500">{t('subtitle')}</span>
          </h1>

          <p className="text-xl md:text-2xl text-black dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('description')}
          </p>

          <div className="flex justify-center mb-16">
            <Link
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xl px-12 py-6 rounded-lg font-semibold inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                />
              </svg>
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
