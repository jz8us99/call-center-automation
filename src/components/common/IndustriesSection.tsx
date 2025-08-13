import { useTranslations } from 'next-intl';

interface Industry {
  image: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
}

export default function IndustriesSection() {
  const t = useTranslations('home.industries');
  const industries: Industry[] = [
    {
      image: '/api/placeholder/400/300',
      titleKey: 'homeServices.title',
      subtitleKey: 'homeServices.subtitle',
      descriptionKey: 'homeServices.description',
    },
    {
      image: '/api/placeholder/400/300',
      titleKey: 'medical.title',
      subtitleKey: 'medical.subtitle',
      descriptionKey: 'medical.description',
    },
    {
      image: '/api/placeholder/400/300',
      titleKey: 'marketing.title',
      subtitleKey: 'marketing.subtitle',
      descriptionKey: 'marketing.description',
    },
    {
      image: '/api/placeholder/400/300',
      titleKey: 'petServices.title',
      subtitleKey: 'petServices.subtitle',
      descriptionKey: 'petServices.description',
    },
    {
      image: '/api/placeholder/400/300',
      titleKey: 'propertyManagement.title',
      subtitleKey: 'propertyManagement.subtitle',
      descriptionKey: 'propertyManagement.description',
    },
    {
      image: '/api/placeholder/400/300',
      titleKey: 'salonsSpas.title',
      subtitleKey: 'salonsSpas.subtitle',
      descriptionKey: 'salonsSpas.description',
    },
  ];

  return (
    <section id="solutions" className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-black dark:text-gray-300 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {industries.map((industry, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 shadow-md border border-gray-300 dark:border-gray-600 hover:border-orange-200 dark:hover:border-orange-400"
            >
              <div className="bg-white dark:from-orange-900/20 dark:to-gray-800 dark:bg-gradient-to-br p-6 flex items-center justify-center min-h-[140px]">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {t(industry.titleKey)}
                  </h3>
                  <p className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                    {t(industry.subtitleKey)}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-black dark:text-gray-300 text-sm leading-relaxed">
                  {t(industry.descriptionKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
