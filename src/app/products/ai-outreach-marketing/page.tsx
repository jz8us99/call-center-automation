'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  ArrowRight,
  Shield,
  Calendar,
  BarChart3,
  Target,
  Users,
  MessageSquare,
  Database,
  Zap,
  CheckCircle,
  Star,
  Phone,
  Clock,
  DollarSign,
  Settings,
  PlayCircle,
  Headphones,
  ChevronRight,
  Building,
  Globe,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function AIOutreachMarketingPage() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const toggleFAQ = (value: string) => {
    setOpenFAQ(openFAQ === value ? null : value);
  };

  const features = [
    {
      icon: Target,
      title: 'Personalized Outbound Calling Campaigns',
      description:
        "AI-crafted messaging that adapts to each prospect's profile and preferences",
    },
    {
      icon: Users,
      title: 'Lead Qualification & Scoring',
      description:
        'Intelligent scoring system that identifies your highest-value prospects',
    },
    {
      icon: Calendar,
      title: 'Automated Appointment Setting',
      description:
        'Seamless calendar integration for effortless demo and meeting scheduling',
    },
    {
      icon: BarChart3,
      title: 'Surveys & Market Research',
      description:
        'Gather valuable insights and feedback through intelligent conversation flows',
    },
    {
      icon: Database,
      title: 'CRM Integration & Compliance',
      description:
        'Full compliance with regulations and seamless CRM data synchronization',
    },
  ];

  const valueProps = [
    {
      icon: MessageSquare,
      title: 'More Conversations',
      description: '3x more meaningful conversations with qualified prospects',
      metric: '300%',
      metricLabel: 'increase in qualified conversations',
    },
    {
      icon: TrendingUp,
      title: 'Higher Conversion',
      description: 'Convert 40% more prospects into meetings and demos',
      metric: '40%',
      metricLabel: 'higher conversion rates',
    },
    {
      icon: DollarSign,
      title: 'Lower CAC',
      description: 'Reduce customer acquisition costs by up to 60%',
      metric: '60%',
      metricLabel: 'reduction in CAC',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Connect Data',
      description:
        'Integrate your CRM, lead lists, and customer data for intelligent targeting',
    },
    {
      step: '02',
      title: 'Design Playbooks',
      description:
        'Create custom conversation flows and qualification criteria',
    },
    {
      step: '03',
      title: 'Go Live',
      description:
        'Launch campaigns and watch qualified leads flow into your pipeline',
    },
  ];

  const useCases = [
    {
      icon: Building,
      title: 'B2B Demo Setting',
      description:
        'Book qualified product demos with decision-makers in your target accounts',
      results: '4x more qualified demos booked',
    },
    {
      icon: Globe,
      title: 'Event & Webinar Follow-up',
      description:
        'Nurture event attendees and convert interest into concrete next steps',
      results: '65% better event ROI',
    },
    {
      icon: Briefcase,
      title: 'Survey & Market Research',
      description:
        'Gather customer insights and validate product-market fit at scale',
      results: '85% survey completion rates',
    },
  ];

  const integrations = [
    { name: 'Salesforce', icon: Database },
    { name: 'HubSpot', icon: Target },
    { name: 'Pipedrive', icon: TrendingUp },
    { name: 'Google Calendar', icon: Calendar },
    { name: 'Outlook', icon: Calendar },
    { name: 'Slack', icon: MessageSquare },
    { name: 'Zendesk', icon: Headphones },
    { name: 'Zapier', icon: Zap },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$299',
      period: '/month',
      description: 'Perfect for small sales teams',
      features: [
        '1,000 outbound calls/month',
        'Basic lead scoring',
        'CRM integration',
        'Email support',
        'Campaign analytics',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '$799',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        '5,000 outbound calls/month',
        'Advanced lead scoring',
        'Multi-channel campaigns',
        'Priority support',
        'Advanced analytics',
        'A/B testing',
        'Custom integrations',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large sales organizations',
      features: [
        'Unlimited outbound calls',
        'AI model customization',
        'Dedicated success manager',
        'White-label options',
        'Custom workflows',
        'SLA guarantees',
        '24/7 enterprise support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      value: 'compliance',
      question: 'How do you handle compliance and opt-outs?',
      answer:
        'We maintain full compliance with TCPA, CAN-SPAM, and GDPR regulations. Our system automatically handles opt-out requests, maintains do-not-call lists, and provides complete audit trails for all communications.',
    },
    {
      value: 'calendar',
      question: 'How does calendar booking work?',
      answer:
        'Our AI seamlessly integrates with Google Calendar, Outlook, and other popular calendar systems. When a prospect shows interest, the AI can check availability in real-time and book meetings directly into your calendar with automatic confirmations.',
    },
    {
      value: 'channels',
      question: 'What channels are supported?',
      answer:
        'We support voice calls, SMS, email, and LinkedIn messaging. Our multi-channel approach ensures you reach prospects through their preferred communication method for maximum engagement.',
    },
    {
      value: 'scoring',
      question: 'How does lead scoring work?',
      answer:
        'Our AI analyzes conversation context, response sentiment, buying signals, and behavioral patterns to assign lead scores. The system learns from your successful conversions to continuously improve scoring accuracy.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Back to Products Button */}
      <div className="container mx-auto px-4 pt-8">
        <Link
          href="/#products"
          className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold transition-colors"
        >
          <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
          Back to Our Products
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Trusted by 2,000+ Sales Teams
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
              AI Outreach Marketing
            </h1>

            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Scale Your Sales Efforts Intelligently
            </p>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
              Transform cold calls into warm conversations. Our AI agent
              qualifies leads, schedules demos, conducts surveys, and nurtures
              prospects—multiplying your sales team's effectiveness.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
              >
                <PlayCircle className="mr-2 w-5 h-5" />
                Get a Live Demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-8 py-4 text-lg"
              >
                <Phone className="mr-2 w-5 h-5" />
                Talk to Sales
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">SOC2-ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">
                  CRM & Calendar Integrations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Analytics Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Feature Highlights
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Everything you need to turn prospects into pipeline
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md rounded-xl">
                    <CardHeader>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Measurable Results That Drive Growth
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                See the impact on your sales metrics from day one
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {valueProps.map((prop, index) => (
                <div key={index}>
                  <Card className="text-center h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md rounded-xl">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <prop.icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-2">
                        {prop.title}
                      </CardTitle>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        {prop.metric}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {prop.metricLabel}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        {prop.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Get started in three simple steps
              </p>
            </div>

            <div className="space-y-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Use Cases
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Proven strategies for every sales scenario
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <div key={index}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md rounded-xl">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                        <useCase.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-lg">{useCase.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 dark:text-gray-400 mb-4">
                        {useCase.description}
                      </CardDescription>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                          {useCase.results}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Seamless Integrations
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Connect with your existing sales stack
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {integrations.map((integration, index) => (
                <div key={index}>
                  <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md rounded-xl">
                    <integration.icon className="w-8 h-8 mx-auto mb-3 text-gray-600 dark:text-gray-400" />
                    <p className="font-medium text-gray-900 dark:text-white">
                      {integration.name}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Scale your outreach with plans that grow with you
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <div key={index}>
                  <Card
                    className={`h-full relative transition-all duration-300 rounded-xl ${
                      tier.highlighted
                        ? 'ring-2 ring-orange-500 shadow-xl scale-105'
                        : 'hover:shadow-lg border-0 shadow-md'
                    }`}
                  >
                    {tier.highlighted && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white">
                        {tier.price}
                        <span className="text-lg text-gray-500 dark:text-gray-400">
                          {tier.period}
                        </span>
                      </div>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center gap-3"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full rounded-lg ${
                          tier.highlighted
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                        }`}
                      >
                        {tier.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Everything you need to know about AI Outreach Marketing
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md"
                >
                  <button
                    onClick={() => toggleFAQ(faq.value)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {openFAQ === faq.value ? (
                      <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFAQ === faq.value && (
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

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to turn cold outreach into hot pipeline?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Join hundreds of sales teams already scaling with AI outreach
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-orange-600 px-8 py-4 text-lg rounded-lg"
              >
                <PlayCircle className="mr-2 w-5 h-5" />
                Book a Demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg rounded-lg"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
