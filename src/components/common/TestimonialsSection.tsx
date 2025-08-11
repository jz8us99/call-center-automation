import { useTranslations } from 'next-intl';

interface Testimonial {
  avatar: string;
  nameKey: string;
  companyKey: string;
  rating: number;
  textKey: string;
}

export default function TestimonialsSection() {
  const t = useTranslations('home.testimonials');
  const testimonials: Testimonial[] = [
    {
      avatar: '/api/placeholder/60/60',
      nameKey: 'testimonial1.name',
      companyKey: 'testimonial1.company',
      rating: 5,
      textKey: 'testimonial1.text',
    },
    {
      avatar: '/api/placeholder/60/60',
      nameKey: 'testimonial2.name',
      companyKey: 'testimonial2.company',
      rating: 5,
      textKey: 'testimonial2.text',
    },
    {
      avatar: '/api/placeholder/60/60',
      nameKey: 'testimonial3.name',
      companyKey: 'testimonial3.company',
      rating: 5,
      textKey: 'testimonial3.text',
    },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
            {t('title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-semibold">
                    {t(testimonial.nameKey).charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-black dark:text-white">
                    {t(testimonial.nameKey)}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t(testimonial.companyKey)}
                  </p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-orange-500 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-black dark:text-gray-300 italic">
                {t(testimonial.textKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
