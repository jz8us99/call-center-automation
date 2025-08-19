'use client';

import { Target, Users, Zap, Shield, Heart, Eye } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Customer Obsession',
    description:
      'Every feature we build starts with a simple question: "How does this help our customers succeed?" Your growth is our growth.',
  },
  {
    icon: Shield,
    title: 'Reliability First',
    description:
      "When businesses trust us with their customer communications, we take that responsibility seriously. 99.99% uptime isn't a goal—it's a requirement.",
  },
  {
    icon: Zap,
    title: 'Continuous Innovation',
    description:
      'Voice AI technology evolves daily. We stay at the forefront, constantly improving our systems to deliver better, more natural conversations.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description:
      'No hidden fees, no black boxes. We believe in clear pricing, open communication, and helping you understand exactly how our technology serves your business.',
  },
];

export default function CompanySection() {
  return (
    <section id="company" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              About Us
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Democratizing enterprise-level customer communication technology
            </p>
          </div>

          <div className="mb-16">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Our Mission
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To democratize access to enterprise-level customer communication
                technology, enabling businesses of all sizes to deliver
                exceptional phone experiences through intelligent voice AI.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Who We Are
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We're a team of AI engineers, customer experience
                  specialists, and business innovators who believe every call
                  matters. Founded in 2025, we are helping businesses
                  transform their phone operations from cost centers into growth
                  engines.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    What We Do
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We build and deploy intelligent voice AI systems that handle
                  your business calls with the warmth and professionalism your
                  customers expect. Our platform combines cutting-edge NLP with
                  deep business logic understanding.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Our Values
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <value.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {value.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Accessibility
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Great customer service shouldn't be a luxury. We're committed
                to making professional voice AI affordable and easy to implement
                for businesses of every size.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Ready to transform your customer communications?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Get Started Today
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
