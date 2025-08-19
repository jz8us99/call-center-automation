'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Phone,
  Clock,
  Globe,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Calendar,
  MessageSquare,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AIReceptionistPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const coreFeatures = [
    {
      icon: Clock,
      title: '24/7 Availability',
      description:
        'Never miss a call again. Your AI Receptionist works around the clock, including holidays, ensuring every customer inquiry is handled professionally.',
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description:
        "Serve customers in over 30 languages with natural, fluent conversations. Automatically detect and switch languages to match your caller's preference.",
    },
    {
      icon: MessageSquare,
      title: 'Intelligent Call Routing',
      description:
        'Route calls to the right department or person based on caller intent. Handle complex routing rules with ease, including time-based and skill-based routing.',
    },
    {
      icon: Database,
      title: 'CRM Integration',
      description:
        'Seamlessly sync with Salesforce, HubSpot, and 20+ other CRM platforms. Automatically log calls, update records, and create follow-up tasks.',
    },
    {
      icon: TrendingUp,
      title: 'Lead Capture & Qualification',
      description:
        'Capture and qualify leads automatically. Gather essential information, score leads based on your criteria, and instantly notify your sales team.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description:
        'Book, reschedule, and cancel appointments directly during calls. Sync with Google Calendar, Outlook, and other scheduling tools in real-time.',
    },
  ];

  const benefits = [
    {
      title: 'Reduce Operational Costs by 70%',
      description:
        'Replace multiple full-time receptionists with one AI solution that never needs breaks, sick days, or overtime pay.',
    },
    {
      title: 'Scale Without Limits',
      description:
        'Handle 1 or 1,000 simultaneous calls without any additional infrastructure or hiring.',
    },
    {
      title: 'Improve Customer Satisfaction',
      description:
        'Zero wait times and consistent, professional service lead to happier customers and better reviews.',
    },
    {
      title: 'Focus on Growth',
      description:
        'Free your team from answering routine calls so they can focus on high-value activities that drive revenue.',
    },
  ];

  const useCases = [
    {
      industry: 'Healthcare',
      scenario: 'Medical & Dental Practices',
      description:
        'Handle appointment scheduling, prescription refills, insurance verification, and after-hours emergencies with HIPAA-compliant security.',
    },
    {
      industry: 'Legal Services',
      scenario: 'Law Firms',
      description:
        'Manage client intake, schedule consultations, provide case status updates, and route urgent matters to on-call attorneys.',
    },
    {
      industry: 'Real Estate',
      scenario: 'Property Management & Agencies',
      description:
        'Answer property inquiries, schedule showings, qualify buyers, and handle maintenance requests 24/7.',
    },
    {
      industry: 'Home Services',
      scenario: 'HVAC, Plumbing, Electrical',
      description:
        'Book service appointments, dispatch emergency calls, provide quotes, and follow up on completed jobs.',
    },
    {
      industry: 'Hospitality',
      scenario: 'Restaurants & Hotels',
      description:
        'Take reservations, answer menu questions, handle special requests, and manage event bookings seamlessly.',
    },
    {
      industry: 'E-commerce',
      scenario: 'Online Retailers',
      description:
        'Process orders over the phone, handle returns, track shipments, and provide product information instantly.',
    },
  ];

  const faqs = [
    {
      question: 'How quickly can the AI Receptionist answer calls?',
      answer:
        'Our AI Receptionist answers every call in under 2 seconds, ensuring your customers never have to wait. The system maintains this speed even during peak call volumes, handling multiple calls simultaneously without any degradation in response time.',
    },
    {
      question: 'Can it handle complex customer inquiries?',
      answer:
        'Yes! Our AI uses advanced natural language processing to understand context and nuance. It can handle multi-step inquiries, remember information from earlier in the conversation, and even detect emotional cues to provide empathetic responses. For truly complex issues, it seamlessly transfers to your human team with full context.',
    },
    {
      question: 'How does the multilingual support work?',
      answer:
        "The AI automatically detects the caller's language within the first few seconds of conversation and switches seamlessly. It supports over 30 languages with native-level fluency, including regional dialects and colloquialisms. You can also set language preferences for specific phone numbers or customer profiles.",
    },
    {
      question: 'What CRM systems does it integrate with?',
      answer:
        'We integrate with all major CRM platforms including Salesforce, HubSpot, Pipedrive, Zoho, Microsoft Dynamics, and 20+ others. Our API also allows custom integrations with proprietary systems. All data syncs in real-time, ensuring your records are always up-to-date.',
    },
    {
      question: 'Is my customer data secure?',
      answer:
        'Absolutely. We use bank-level encryption (256-bit SSL) for all data transmission and storage. Our platform is SOC 2 Type II certified, GDPR compliant, and for healthcare clients, fully HIPAA compliant. We also offer on-premise deployment options for organizations with strict data residency requirements.',
    },
    {
      question: 'How long does it take to set up?',
      answer:
        'Most businesses are up and running within 24 hours. Our onboarding team helps you customize scripts, set up integrations, and train the AI on your specific business information. We provide templates for your industry to accelerate the process, and our support team is available 24/7 during your first week.',
    },
    {
      question: "Can I customize the AI's voice and personality?",
      answer:
        'Yes! Choose from over 50 natural-sounding voices or clone your own. Adjust speaking pace, tone, and personality traits to match your brand. You can even set different voices for different departments or times of day. Our voice customization engine ensures your AI receptionist sounds exactly how you want.',
    },
    {
      question: "What happens if the AI can't handle a call?",
      answer:
        'Our AI is trained to recognize when human intervention is needed and transfers calls smoothly with full context. You can set custom escalation rules based on keywords, customer value, or inquiry type. The AI provides your team with a complete summary of the conversation before transfer, ensuring seamless handoffs.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Trusted by 5,000+ Businesses
              </span>
            </div>

            <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              AI Receptionist
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Your 24/7 Virtual Front Desk That Never Misses a Call
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
              Answer every call instantly, capture leads, book appointments, and
              deliver exceptional customer service around the clock—all while
              reducing operational costs by up to 70%.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors border border-gray-300 dark:border-gray-600">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Quick Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect your phone number, customize your AI receptionist\'s
                  responses, and integrate with your existing tools in under 30
                  minutes.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  AI Training
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our AI learns your business specifics, services, FAQs, and
                  preferred call handling procedures to deliver personalized
                  responses.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Go Live
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your AI Receptionist starts answering calls immediately,
                  learning and improving with every interaction while you
                  monitor performance in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Core Features
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
              Everything you need to deliver exceptional phone support, built
              into one intelligent platform
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Benefits for Small Businesses
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16">
              Transform your customer service without breaking the bank
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ROI Calculator
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                See how much you could save with our AI Receptionist
              </p>
              <Link
                href="/roi-calculator"
                className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold"
              >
                Calculate Your Savings
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Use Cases by Industry
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
              Tailored solutions for every business type
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {useCase.industry}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    {useCase.scenario}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
              Everything you need to know about our AI Receptionist
            </p>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to Transform Your Customer Service?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Join thousands of businesses delivering exceptional phone support
              with AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-100 text-orange-600 font-semibold rounded-lg transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-lg transition-colors border border-orange-500"
              >
                <Phone className="mr-2 w-5 h-5" />
                Talk to Sales
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
