interface Integration {
  name: string;
  logo: string;
}

export default function IntegrationsSection() {
  const integrations: Integration[] = [
    { name: 'Salesforce', logo: '/api/placeholder/120/60' },
    { name: 'Zapier', logo: '/api/placeholder/120/60' },
    { name: 'Calendly', logo: '/api/placeholder/120/60' },
    { name: 'Slack', logo: '/api/placeholder/120/60' },
    { name: 'HubSpot', logo: '/api/placeholder/120/60' },
    { name: 'Google Calendar', logo: '/api/placeholder/120/60' },
  ];

  return (
    <section id="partners" className="py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-6">
            Integrates with your favorite tools
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-600"
            >
              <div className="h-8 flex items-center justify-center">
                <span className="text-black dark:text-gray-300 font-semibold">
                  {integration.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
