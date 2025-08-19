'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  HeadphonesIcon,
  Clock,
  Globe,
  Shield,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  MessageSquare,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
  Target,
  Settings,
  Brain,
  Workflow,
} from 'lucide-react';

export default function AICustomerSupportPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const detailedFeatures = [
    {
      icon: Brain,
      title: 'Intelligent Ticket Routing',
      description:
        'Automatically categorize and route tickets to the right agents based on issue type, customer priority, and agent expertise. Reduce response times by up to 80%.',
    },
    {
      icon: Database,
      title: 'Knowledge Base Integration',
      description:
        'Instantly access your entire knowledge base to provide accurate answers. AI learns from your documentation and previous resolutions to improve over time.',
    },
    {
      icon: MessageSquare,
      title: 'Multi-Channel Support',
      description:
        'Seamlessly handle support across phone, email, chat, and social media. Maintain conversation context across all channels for a unified experience.',
    },
    {
      icon: Workflow,
      title: 'Automated Workflows',
      description:
        'Set up custom automation rules for common issues. Handle password resets, order tracking, and routine inquiries without human intervention.',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description:
        'Monitor customer satisfaction, response times, and resolution rates in real-time. Get actionable insights to continuously improve your support quality.',
    },
    {
      icon: Settings,
      title: 'CRM Integration',
      description:
        'Sync with Salesforce, HubSpot, Zendesk, and 50+ other platforms. Automatically update customer records and track support interactions.',
    },
  ];

  const benefits = [
    {
      title: 'Reduce Support Costs by 60%',
      description:
        'Automate routine inquiries and deflect tickets before they reach your team. Handle 3x more customer requests with the same staff.',
    },
    {
      title: 'Improve Response Times by 85%',
      description:
        'Instant AI responses for common questions and intelligent routing for complex issues. Never leave customers waiting again.',
    },
    {
      title: 'Increase Customer Satisfaction by 40%',
      description:
        'Consistent, accurate responses and 24/7 availability lead to happier customers and better reviews.',
    },
    {
      title: 'Scale Support Infinitely',
      description:
        'Handle thousands of simultaneous conversations without hiring additional staff. Perfect for seasonal spikes and business growth.',
    },
  ];

  const useCases = [
    {
      industry: 'E-commerce',
      scenario: 'Order Management & Returns',
      description:
        'Handle order status inquiries, process returns and exchanges, track shipments, and manage payment issues automatically.',
      results: '75% reduction in support tickets, 90% faster resolution times',
    },
    {
      industry: 'SaaS Companies',
      scenario: 'Technical Support & Onboarding',
      description:
        'Provide instant technical assistance, guide new users through setup, troubleshoot common issues, and escalate complex problems.',
      results: '50% improvement in user activation, 65% fewer escalations',
    },
    {
      industry: 'Financial Services',
      scenario: 'Account Management & Security',
      description:
        'Assist with account inquiries, password resets, transaction disputes, and fraud alerts while maintaining strict security protocols.',
      results: '80% faster account resolution, 95% security compliance',
    },
    {
      industry: 'Healthcare',
      scenario: 'Patient Support & Scheduling',
      description:
        'Handle appointment scheduling, insurance verification, prescription refills, and general health inquiries with HIPAA compliance.',
      results:
        '60% reduction in phone wait times, 45% increase in patient satisfaction',
    },
    {
      industry: 'Telecommunications',
      scenario: 'Service Issues & Billing',
      description:
        'Resolve connectivity issues, explain billing inquiries, manage service upgrades, and coordinate technician visits.',
      results: '70% first-call resolution, 55% reduction in churn',
    },
    {
      industry: 'Travel & Hospitality',
      scenario: 'Booking & Guest Services',
      description:
        'Manage reservations, handle special requests, provide local information, and resolve booking modifications 24/7.',
      results: '85% guest satisfaction score, 40% increase in repeat bookings',
    },
  ];

  const testimonials = [
    {
      company: 'TechFlow Solutions',
      industry: 'SaaS',
      quote:
        'Our support ticket volume decreased by 65% in the first month. The AI handles our common questions perfectly, and our team can focus on complex technical issues.',
      author: 'Sarah Chen',
      role: 'Head of Customer Success',
      rating: 5,
    },
    {
      company: 'MediCare Plus',
      industry: 'Healthcare',
      quote:
        'HIPAA-compliant AI support has transformed our patient experience. 24/7 availability means patients get help when they need it most.',
      author: 'Dr. Michael Rodriguez',
      role: 'Practice Administrator',
      rating: 5,
    },
    {
      company: 'ShopSmart Retail',
      industry: 'E-commerce',
      quote:
        'Customer satisfaction scores improved from 3.2 to 4.8 stars. The AI resolves order issues instantly, and escalations are seamless.',
      author: 'Jennifer Walsh',
      role: 'Customer Experience Director',
      rating: 5,
    },
  ];

  const roiMetrics = [
    {
      metric: '60%',
      label: 'Reduction in Support Costs',
      description: 'Lower operational expenses through automation',
    },
    {
      metric: '85%',
      label: 'Faster Response Times',
      description: 'Instant responses to common inquiries',
    },
    {
      metric: '40%',
      label: 'Higher Customer Satisfaction',
      description: 'Consistent, accurate support experience',
    },
    {
      metric: '3x',
      label: 'More Tickets Resolved',
      description: 'Handle more customers with same team size',
    },
  ];

  const faqs = [
    {
      question: 'How does the AI understand customer intent?',
      answer:
        'Our AI uses advanced natural language processing and machine learning to understand customer intent with 95% accuracy. It analyzes conversation context, sentiment, and previous interactions to provide relevant responses.',
    },
    {
      question: 'Can it integrate with our existing helpdesk software?',
      answer:
        'Yes! We integrate with all major helpdesk platforms including Zendesk, Freshdesk, ServiceNow, Intercom, and 50+ others. Setup typically takes less than 30 minutes with our pre-built connectors.',
    },
    {
      question: 'What happens when the AI cannot resolve an issue?',
      answer:
        'The AI seamlessly escalates to human agents with full conversation context, customer history, and suggested solutions. Your team gets a complete summary before taking over.',
    },
    {
      question: 'How secure is customer data?',
      answer:
        'We maintain enterprise-grade security with SOC 2 Type II compliance, 256-bit encryption, and GDPR compliance. For healthcare clients, we provide full HIPAA compliance with dedicated infrastructure.',
    },
    {
      question: 'How long does implementation take?',
      answer:
        'Most companies are live within 48 hours. We provide guided setup, knowledge base integration, and custom training on your support processes. Our team handles the technical implementation.',
    },
    {
      question: 'Can we customize the AI responses?',
      answer:
        'Absolutely! Customize tone, personality, and responses to match your brand voice. Set up custom workflows, escalation rules, and industry-specific templates.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Back to Products Button */}
      <div className="container mx-auto px-4 pt-8">
        <Link
          href="/#products"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
        >
          <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
          Back to Our Products
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Trusted by 8,000+ Support Teams
              </span>
            </div>

            <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              AI Customer Support
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Intelligent Support That Never Sleeps
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
              Transform your customer support with AI that understands, learns,
              and resolves issues instantly. Reduce costs by 60% while improving
              satisfaction scores and response times.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
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

      {/* Overview Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              Overview
            </h2>
            <div className="prose prose-lg mx-auto text-gray-600 dark:text-gray-400">
              <p className="text-xl leading-relaxed mb-6">
                Our AI Customer Support platform revolutionizes how businesses
                handle customer inquiries. By combining advanced natural
                language processing with deep integration capabilities, we
                deliver instant, accurate responses while seamlessly routing
                complex issues to human experts.
              </p>
              <p className="text-lg leading-relaxed">
                Whether you're a growing startup or an enterprise serving
                millions, our AI scales with your needs, maintains your brand
                voice, and continuously improves through machine learning.
                Experience the future of customer support where every
                interaction is handled with intelligence, empathy, and
                efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900 dark:text-white">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Intelligent Intake
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI analyzes incoming requests across all channels,
                  understanding customer intent, sentiment, and urgency to
                  provide immediate assistance or routing.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Smart Resolution
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Leverages your knowledge base, previous resolutions, and CRM
                  data to provide instant, accurate answers or execute automated
                  workflows.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Seamless Escalation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  When human expertise is needed, transfers with full context,
                  suggested solutions, and customer history for efficient
                  resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Detailed Features
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
              Comprehensive support capabilities designed for modern customer
              service teams
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {detailedFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Business Benefits
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16">
              Measurable improvements across all support metrics
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
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              ROI & Value for Your Business
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
              See the measurable impact on your bottom line and customer
              experience
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {roiMetrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {metric.metric}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {metric.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Calculate Your Savings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                See how much you could save with AI Customer Support based on
                your current support volume
              </p>
              <Link
                href="/roi-calculator"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                ROI Calculator
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
              Real-World Use Cases
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16 max-w-3xl mx-auto">
              See how businesses across industries transform their support
              operations
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {useCase.industry}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    {useCase.scenario}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {useCase.description}
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                      Results: {useCase.results}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Customer Testimonials
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-16">
              Hear from businesses transforming their customer support
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <blockquote className="text-gray-600 dark:text-gray-400 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {testimonial.company} • {testimonial.industry}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
              Everything you need to know about AI Customer Support
            </p>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to Transform Your Customer Support?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of businesses delivering exceptional support with
              AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-lg transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors border border-blue-500"
              >
                <HeadphonesIcon className="mr-2 w-5 h-5" />
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
                <span className="text-sm">24/7 support included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
