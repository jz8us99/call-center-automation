'use client';

import { Phone, HeadphonesIcon, TrendingUp, Layers } from 'lucide-react';
import Link from 'next/link';

const products = [
  {
    icon: Phone,
    title: 'AI Receptionist',
    tagline: 'Never Miss Another Call',
    description:
      "Your business deserves a receptionist who never takes a break. Our AI Receptionist answers every call in under 3 seconds, 24/7/365. Handle appointment bookings, answer FAQs, route calls intelligently, and capture leads—all while maintaining your brand's professional voice.",
    features: [
      'Instant call answering with natural conversation flow',
      'Multilingual support for global customers',
      'Seamless CRM and calendar integration',
      'Custom call scripts tailored to your business',
      'Real-time call transcripts and analytics',
    ],
  },
  {
    icon: HeadphonesIcon,
    title: 'AI Customer Support',
    tagline: 'Instant Resolution, Happy Customers',
    description:
      'Deliver exceptional customer service around the clock. Our AI Customer Support agent handles inquiries, troubleshoots issues, processes returns, and escalates complex cases—ensuring your customers always get the help they need.',
    features: [
      'Intelligent ticket creation and routing',
      'Knowledge base integration for instant answers',
      'Multi-channel support coordination',
      'Sentiment analysis and priority escalation',
      'Automated follow-up and resolution tracking',
    ],
  },
  {
    icon: TrendingUp,
    title: 'AI Outreach Marketing',
    tagline: 'Scale Your Sales Efforts Intelligently',
    description:
      "Transform cold calls into warm conversations. Our AI Outreach Marketing agent qualifies leads, schedules demos, conducts surveys, and nurtures prospects—multiplying your sales team's effectiveness.",
    features: [
      'Personalized outbound calling campaigns',
      'Lead qualification and scoring',
      'Automated appointment setting for sales teams',
      'Survey collection and market research',
      'CRM integration for seamless lead handoff',
    ],
  },
  {
    icon: Layers,
    title: 'Industry Templates',
    tagline: 'Pre-Built Solutions for Your Sector',
    description:
      'Why start from scratch? Our industry-specific templates are pre-configured with the terminology, workflows, and best practices for your field. Deploy a fully-trained AI assistant in minutes, not months.',
    industries: [
      'Healthcare: HIPAA-compliant patient scheduling',
      'Legal: Client intake and case updates',
      'Real Estate: Property inquiries and showings',
      'Home Services: Quote requests and dispatch',
      'Restaurants: Reservations and takeout orders',
    ],
  },
];

export default function ProductsSection() {
  return (
    <section id="products" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Our Products
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Enterprise-level voice AI solutions that scale with your business
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {products.map((product, index) => {
            const getLearnMoreHref = (title: string) => {
              switch (title) {
                case 'AI Receptionist':
                  return '/products/ai-receptionist';
                case 'AI Customer Support':
                  return '/products/ai-customer-support';
                case 'AI Outreach Marketing':
                  return '/products/ai-outreach-marketing';
                case 'Industry Templates':
                  return '/products/industry-templates';
                default:
                  return '/signup';
              }
            };

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <product.icon className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {product.title}
                    </h3>
                    <p className="text-orange-600 dark:text-orange-400 font-semibold">
                      {product.tagline}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {product.description}
                </p>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {product.industries
                      ? 'Available Templates:'
                      : 'Key Features:'}
                  </h4>
                  <ul className="space-y-2">
                    {(product.features || product.industries)?.map(
                      (item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                        >
                          <span className="text-orange-500 mt-1">•</span>
                          <span className="text-sm">{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="mt-6">
                  <Link
                    href={getLearnMoreHref(product.title)}
                    className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold transition-colors"
                  >
                    Learn More →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>
    </section>
  );
}
