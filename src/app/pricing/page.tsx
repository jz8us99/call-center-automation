'use client';

import { useState } from 'react';
import { CheckIcon } from '@/components/icons';
import { SimpleThemeSwitch } from '@/components/SimpleThemeSwitch';
import { HomeButton } from '@/components/HomeButton';

const PricingPage = () => {
  const [activeTab, setActiveTab] = useState('ai-receptionist');

  const tabs = [
    { id: 'ai-receptionist', label: 'AI Receptionist', active: true },
    { id: 'outreach-campaigns', label: 'Outreach Campaigns', active: false },
    { id: 'web-chat', label: 'Web Chat', active: false },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      calls: '30 calls',
      price: '$90.00',
      overage: '$4.25 per call over 30',
      button: 'Get started',
      buttonStyle: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Basic',
      calls: '90 calls',
      price: '$250.00',
      overage: '$4.00 per call over 90',
      button: 'Get started',
      buttonStyle: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      name: 'Pro',
      calls: '300 calls',
      price: '$800.00',
      overage: '$3.75 per call over 300',
      button: 'Get started',
      buttonStyle: 'bg-purple-600 hover:bg-purple-700',
      popular: true,
    },
    {
      name: 'Enterprise',
      calls: 'Custom',
      price: 'Ask about enterprise pricing',
      overage: 'Price adjusted based on your needs',
      button: 'Talk to us',
      buttonStyle: 'bg-red-600 hover:bg-red-700',
    },
  ];

  const features = [
    'Lead screening, qualification & intake',
    'Live expert agents on standby 24/7',
    'Rich business insights in your dashboard',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:bg-gray-900 text-black dark:text-white dark:text-white transition-colors duration-300">
      {/* Home Button and Theme Switch */}
      <div className="absolute top-6 left-6 z-50">
        <HomeButton variant="default" />
      </div>
      <div className="absolute top-6 right-6 z-50">
        <SimpleThemeSwitch />
      </div>

      {/* Header Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-black dark:bg-gradient-to-r dark:from-white dark:to-gray-300 dark:bg-clip-text dark:text-transparent">
            Convert conversations to clients
          </h1>
          <p className="text-xl md:text-2xl text-orange-500 max-w-3xl mx-auto font-semibold">
            AI Receptionest and Customer Service 24/7.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex justify-center mb-16">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2 inline-flex border border-gray-200 dark:border-gray-700">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20 ${
                plan.popular
                  ? 'border-purple-500 shadow-purple-500/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-black dark:text-white dark:text-white">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <p className="text-black dark:text-gray-300 dark:text-gray-400 mb-2">
                    {plan.calls}
                  </p>
                  <div className="text-4xl font-bold mb-2">
                    {plan.name === 'Enterprise' ? (
                      <span className="text-2xl">Custom</span>
                    ) : (
                      <>
                        {plan.price}
                        <span className="text-lg text-black dark:text-gray-300 dark:text-gray-400">
                          /month
                        </span>
                      </>
                    )}
                  </div>
                  {plan.name === 'Enterprise' ? (
                    <p className="text-lg font-semibold text-black dark:text-gray-300 dark:text-gray-300 mb-4">
                      {plan.price}
                    </p>
                  ) : null}
                </div>

                <div className="mb-6">
                  <p className="text-sm text-black dark:text-gray-300 dark:text-gray-400 leading-relaxed">
                    {plan.overage}
                  </p>
                </div>

                <button className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  {plan.button}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info Banner */}
        <div className="bg-gradient-to-r from-purple-100/80 to-red-100/80 dark:from-purple-900/50 dark:to-red-900/50 rounded-2xl p-8 border border-purple-300/50 dark:border-purple-500/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6 text-black dark:text-white dark:text-white">
              ALL PLANS INCLUDE A 30-DAY MONEY-BACK GUARANTEE, PLUS:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center space-x-3"
                >
                  <CheckIcon className="h-6 w-6 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
