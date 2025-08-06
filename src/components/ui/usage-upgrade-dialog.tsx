'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, ArrowUpIcon } from '@/components/icons';

interface UsageUpgradeDialogProps {
  currentTier: 'basic' | 'premium' | 'enterprise';
  onUpgrade: (newTier: 'basic' | 'premium' | 'enterprise') => void;
  onClose: () => void;
  isOpen: boolean;
}

export function UsageUpgradeDialog({
  currentTier,
  onUpgrade,
  onClose,
  isOpen,
}: UsageUpgradeDialogProps) {
  const [selectedTier, setSelectedTier] = useState<
    'basic' | 'premium' | 'enterprise'
  >(currentTier);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'basic' as const,
      name: 'Basic',
      price: 29,
      features: [
        'Up to 2 AI agents',
        'Inbound call handling',
        '500 calls per month',
        'Basic analytics',
        'Email support',
      ],
      agentTypes: ['Inbound Call Agent'],
      maxAgents: 2,
      maxCalls: 500,
      popular: false,
    },
    {
      id: 'premium' as const,
      name: 'Premium',
      price: 79,
      features: [
        'Up to 5 AI agents',
        'Inbound & outbound calls',
        'Appointment scheduling',
        '2,000 calls per month',
        'Advanced analytics',
        'Priority support',
        'Custom voice settings',
      ],
      agentTypes: [
        'Inbound Call Agent',
        'Outbound Appointment Agent',
        'Customer Support Agent',
      ],
      maxAgents: 5,
      maxCalls: 2000,
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 199,
      features: [
        'Unlimited AI agents',
        'All agent types',
        'Marketing campaigns',
        '10,000+ calls per month',
        'Custom integrations',
        'White-label option',
        'Dedicated support',
        'SLA guarantee',
      ],
      agentTypes: ['All Agent Types Available'],
      maxAgents: -1, // unlimited
      maxCalls: 10000,
      popular: false,
    },
  ];

  const handleUpgrade = () => {
    onUpgrade(selectedTier);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Upgrade Your Plan
              </h2>
              <p className="text-gray-600 mt-1">
                Choose a plan that fits your business needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {tiers.map(tier => (
              <Card
                key={tier.id}
                className={`relative cursor-pointer transition-all ${
                  selectedTier === tier.id
                    ? 'ring-2 ring-blue-500 border-blue-500'
                    : 'hover:border-gray-300'
                } ${tier.popular ? 'border-orange-500' : ''}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {currentTier === tier.id && (
                  <div className="absolute -top-3 right-4">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <input
                      type="radio"
                      name="tier"
                      checked={selectedTier === tier.id}
                      onChange={() => setSelectedTier(tier.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ${tier.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Usage Limits */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Usage Limits
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Max Agents:</strong>{' '}
                        {tier.maxAgents === -1 ? 'Unlimited' : tier.maxAgents}
                      </p>
                      <p>
                        <strong>Max Calls:</strong>{' '}
                        {tier.maxCalls.toLocaleString()}/month
                      </p>
                    </div>
                  </div>

                  {/* Agent Types */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      AI Agent Types
                    </h4>
                    <div className="space-y-1">
                      {tier.agentTypes.map((agentType, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-sm text-gray-600"
                        >
                          <CheckIcon className="h-4 w-4 text-green-600" />
                          <span>{agentType}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Features
                    </h4>
                    <ul className="space-y-1">
                      {tier.features.slice(0, 4).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start space-x-2 text-sm text-gray-600"
                        >
                          <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {tier.features.length > 4 && (
                        <li className="text-sm text-gray-500">
                          +{tier.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Current Usage Display */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Current Usage</CardTitle>
              <CardDescription className="text-blue-700">
                Your current plan usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-900">2/2</div>
                  <div className="text-sm text-blue-700">AI Agents Used</div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    450/500
                  </div>
                  <div className="text-sm text-blue-700">Calls This Month</div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: '90%' }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {currentTier}
                  </div>
                  <div className="text-sm text-blue-700">Current Plan</div>
                  <Badge className="mt-1 bg-blue-100 text-blue-800">
                    {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedTier !== currentTier && (
                <span className="flex items-center gap-1">
                  <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  Upgrading to{' '}
                  <strong>
                    {selectedTier.charAt(0).toUpperCase() +
                      selectedTier.slice(1)}
                  </strong>
                </span>
              )}
            </div>
            <div className="space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpgrade}
                disabled={selectedTier === currentTier}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {selectedTier === currentTier
                  ? 'Current Plan'
                  : `Upgrade to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
