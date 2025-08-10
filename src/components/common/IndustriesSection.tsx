interface Industry {
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

export default function IndustriesSection() {
  const industries: Industry[] = [
    {
      image: '/api/placeholder/400/300',
      title: 'Home Services',
      subtitle: 'Convert calls into booked jobs, 24/7',
      description:
        'From plumbing to HVAC, we handle customer calls professionally',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Doctor and Wellness Offices',
      subtitle: 'Help clients faster',
      description:
        'Professional AI-powered call handling bookings scheduling and more',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Marketing Agencies',
      subtitle: 'Never miss a lead',
      description: 'Professional call handling for marketing professionals',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Pet Services',
      subtitle: 'Keep pet parents happy',
      description: 'Caring AI call handling for veterinarians and pet care',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Property Management',
      subtitle: '24/7 tenant support',
      description: 'Round-the-clock property management call handling',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Salons & Spas',
      subtitle: 'Book appointments seamlessly',
      description: 'Professional appointment booking and customer service',
    },
  ];

  return (
    <section id="solutions" className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-4">
            We serve a variety of industries
          </h2>
          <p className="text-lg text-black dark:text-gray-300 max-w-2xl mx-auto">
            Tailored AI solutions for every business type
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
                    {industry.title}
                  </h3>
                  <p className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                    {industry.subtitle}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-black dark:text-gray-300 text-sm leading-relaxed">
                  {industry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
