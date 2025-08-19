'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon } from '@/components/icons';
import { SimpleThemeSwitch } from '@/components/common/SimpleThemeSwitch';
import { HomeButton } from '@/components/common/HomeButton';
import { OUTREACH_PRICING_PLANS } from '@/lib/stripe';
import { toast } from 'sonner';

const OutreachPricingPage = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (
    planKey: keyof typeof OUTREACH_PRICING_PLANS
  ) => {
    const plan = OUTREACH_PRICING_PLANS[planKey];

    if (planKey === 'enterprise') {
      // Handle enterprise plan differently - maybe redirect to contact form
      window.location.href = '/contact?plan=outreach-enterprise';
      return;
    }

    try {
      setLoadingPlan(planKey);

      const response = await fetch('/api/stripe/test-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: `Outreach ${plan.name}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoadingPlan(null);
    }
  };

  const pricingPlans = Object.entries(OUTREACH_PRICING_PLANS).map(
    ([key, plan]) => ({
      key: key as keyof typeof OUTREACH_PRICING_PLANS,
      name: plan.name,
      calls:
        typeof plan.calls === 'number' ? `${plan.calls} calls` : plan.calls,
      price:
        typeof plan.price === 'number'
          ? `$${plan.price.toFixed(2)}`
          : plan.price,
      overage: `$${plan.overage}/call overage` || 'Custom pricing',
      button: key === 'enterprise' ? 'Talk to us' : 'Get started',
      buttonStyle:
        key === 'enterprise'
          ? 'bg-red-600 hover:bg-red-700'
          : 'bg-purple-600 hover:bg-purple-700',
      popular: plan.popular || false,
    })
  );

  const features = [
    'AI-powered lead qualification & scoring',
    'Multi-channel campaign management',
    'Advanced analytics & performance tracking',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
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
            Scale your sales outreach
          </h1>
          <p className="text-xl md:text-2xl text-orange-500 max-w-3xl mx-auto font-semibold">
            AI-powered outbound calling campaigns that convert.
          </p>
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
                <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <p className="text-black dark:text-gray-300 mb-2">
                    {plan.calls}
                  </p>
                  <div className="text-4xl font-bold mb-2">
                    {plan.name === 'Enterprise' ? (
                      <span className="text-2xl">Custom</span>
                    ) : (
                      <>
                        {plan.price}
                        <span className="text-lg text-black dark:text-gray-300">
                          /month
                        </span>
                      </>
                    )}
                  </div>
                  {plan.name === 'Enterprise' ? (
                    <p className="text-lg font-semibold text-black dark:text-gray-300 mb-4">
                      {plan.price}
                    </p>
                  ) : null}
                </div>

                <div className="mb-6">
                  <p className="text-sm text-black dark:text-gray-400 leading-relaxed">
                    {plan.overage}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={loadingPlan === plan.key}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loadingPlan === plan.key ? 'Loading...' : plan.button}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Info Banner */}
        <div className="bg-gradient-to-r from-purple-100/80 to-red-100/80 dark:from-purple-900/50 dark:to-red-900/50 rounded-2xl p-8 border border-purple-300/50 dark:border-purple-500/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6 text-black dark:text-white">
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

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-black dark:text-white">
            Plan Features Comparison
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Features
                    </th>
                    {pricingPlans.map(plan => (
                      <th
                        key={plan.key}
                        className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {OUTREACH_PRICING_PLANS.starter.features.map(
                    (_, featureIndex) => (
                      <tr
                        key={featureIndex}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {Object.values(OUTREACH_PRICING_PLANS)[0].features[
                            featureIndex
                          ] ||
                            Object.values(OUTREACH_PRICING_PLANS)[1].features[
                              featureIndex
                            ] ||
                            Object.values(OUTREACH_PRICING_PLANS)[2].features[
                              featureIndex
                            ] ||
                            Object.values(OUTREACH_PRICING_PLANS)[3].features[
                              featureIndex
                            ]}
                        </td>
                        {Object.values(OUTREACH_PRICING_PLANS).map(
                          (plan, planIndex) => (
                            <td
                              key={planIndex}
                              className="px-6 py-4 text-center"
                            >
                              {plan.features[featureIndex] ? (
                                <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Scale Your Outreach?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Start converting more leads with AI-powered outbound campaigns
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-orange-600 transition-colors"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutreachPricingPage;
