import { useTranslations } from 'next-intl';

export default function ValueProposition() {
  const t = useTranslations('home.valueProposition');
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-8">
              {t('title')}{' '}
              <span className="text-orange-500">{t('titleHighlight')}</span>
            </h2>
            <p className="text-xl text-black dark:text-gray-300 mb-8">
              {t('description')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">95%</div>
              <div className="text-black dark:text-gray-300">
                {t('stats.satisfaction')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                4.9/5
              </div>
              <div className="text-black dark:text-gray-300">
                {t('stats.clutchRating')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                24/7
              </div>
              <div className="text-black dark:text-gray-300">
                {t('stats.availability')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 mb-2">
                4.8/5
              </div>
              <div className="text-black dark:text-gray-300">
                {t('stats.trustpilotRating')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
