'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

// Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EditIcon, CheckIcon, XIcon, DollarSignIcon } from '@/components/icons';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  agent_types_allowed: string[];
  max_agents: number;
  max_calls_per_month: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

const AGENT_TYPE_NAMES = {
  inbound_call: 'Inbound Call Agent',
  outbound_appointment: 'Outbound Appointment Agent',
  outbound_marketing: 'Outbound Marketing Agent',
  customer_support: 'Customer Support Agent',
};

export default function AdminPricingConfig() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [showTierForm, setShowTierForm] = useState(false);

  const router = useRouter();
  const { profile, loading: profileLoading, isAdmin } = useUserProfile(user);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    // Development mode bypass - remove this in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!loading && !profileLoading && !isDevelopment) {
      if (!user) {
        router.push('/auth');
      } else if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [loading, profileLoading, user, isAdmin, router]);

  useEffect(() => {
    // Load pricing tiers in development mode or when user is admin
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment || isAdmin) {
      loadPricingTiers();
    }
  }, [isAdmin]);

  const loadPricingTiers = async () => {
    try {
      setTiersLoading(true);

      const response = await fetch('/api/admin/pricing', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pricing tiers');
      }

      const data = await response.json();
      setPricingTiers(data.tiers || []);
    } catch (error) {
      console.error('Failed to load pricing tiers:', error);
      // Fall back to development mode with empty array
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        setPricingTiers([]);
      }
    } finally {
      setTiersLoading(false);
    }
  };

  const handleEditTier = (tier: PricingTier) => {
    setSelectedTier(tier);
    setShowTierForm(true);
  };

  const handleCreateTier = () => {
    setSelectedTier(null);
    setShowTierForm(true);
  };

  const handleSaveTier = async (formData: FormData) => {
    try {
      const tierData = {
        name: formData.get('name') as string,
        price: parseFloat(formData.get('price') as string),
        billing_period: formData.get('billing_period') as string,
        max_agents: formData.get('max_agents')
          ? parseInt(formData.get('max_agents') as string)
          : -1,
        max_calls_per_month: parseInt(
          formData.get('max_calls_per_month') as string
        ),
        agent_types_allowed: Array.from(
          formData.getAll('agent_types_allowed')
        ) as string[],
        features: [], // Would need to implement dynamic feature management
        is_active: formData.get('is_active') === 'on',
        is_popular: formData.get('is_popular') === 'on',
      };

      const isEditing = selectedTier !== null;
      const url = isEditing
        ? `/api/admin/pricing/${selectedTier.id}`
        : '/api/admin/pricing';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tierData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditing ? 'update' : 'create'} pricing tier`
        );
      }

      setShowTierForm(false);
      setSelectedTier(null);
      await loadPricingTiers();
      alert(`Pricing tier ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save pricing tier:', error);
      alert(
        `Failed to ${selectedTier ? 'update' : 'create'} pricing tier. Please try again.`
      );
    }
  };

  // Development mode bypass - remove this in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if ((loading || profileLoading) && !isDevelopment) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">
            Loading pricing configuration...
          </p>
        </div>
      </div>
    );
  }

  if (!isDevelopment && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-black dark:text-gray-300 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (showTierForm) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowTierForm(false)}
                  className="text-black dark:text-gray-300 hover:text-black dark:text-white"
                >
                  ← Back to Pricing
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-black dark:text-white">
                    {selectedTier
                      ? 'Edit Pricing Tier'
                      : 'Create New Pricing Tier'}
                  </h1>
                  <p className="text-sm text-black dark:text-gray-300">
                    Configure pricing and features for this tier
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tier Form */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Tier Configuration</CardTitle>
                <CardDescription>
                  Set up pricing, features, and limitations for this tier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form action={handleSaveTier}>
                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Tier Name
                      </label>
                      <Input
                        name="name"
                        defaultValue={selectedTier?.name || ''}
                        placeholder="e.g., Basic, Premium, Enterprise"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Price (USD)
                      </label>
                      <div className="relative">
                        <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="price"
                          type="number"
                          defaultValue={selectedTier?.price || ''}
                          placeholder="29"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing & Limits */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Billing Period
                      </label>
                      <select
                        name="billing_period"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        defaultValue={selectedTier?.billing_period || 'monthly'}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Max AI Agents
                      </label>
                      <Input
                        name="max_agents"
                        type="number"
                        defaultValue={
                          selectedTier?.max_agents === -1
                            ? ''
                            : selectedTier?.max_agents || ''
                        }
                        placeholder="5 (leave empty for unlimited)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Max Calls/Month
                      </label>
                      <Input
                        name="max_calls_per_month"
                        type="number"
                        defaultValue={selectedTier?.max_calls_per_month || ''}
                        placeholder="1000"
                        required
                      />
                    </div>
                  </div>

                  {/* Agent Types */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-black dark:text-gray-300 mb-3">
                      Allowed Agent Types
                    </label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(AGENT_TYPE_NAMES).map(([key, name]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            name="agent_types_allowed"
                            value={key}
                            defaultChecked={selectedTier?.agent_types_allowed.includes(
                              key
                            )}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-black dark:text-white">
                              {name}
                            </span>
                            <div className="text-xs text-gray-500">
                              {key === 'inbound_call' && 'Basic tier feature'}
                              {key === 'outbound_appointment' &&
                                'Premium tier feature'}
                              {key === 'customer_support' &&
                                'Premium tier feature'}
                              {key === 'outbound_marketing' &&
                                'Enterprise tier feature'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-black dark:text-gray-300 mb-3">
                      Features
                    </label>
                    <div className="space-y-2">
                      {selectedTier?.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Input
                            name={`feature_${index}`}
                            defaultValue={feature}
                            placeholder="Enter feature description"
                            className="flex-1"
                          />
                          <Button variant="outline" size="sm" type="button">
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )) || (
                        <>
                          <div className="flex items-center space-x-2">
                            <Input
                              name="feature_0"
                              placeholder="Enter feature description"
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm" type="button">
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              name="feature_1"
                              placeholder="Enter feature description"
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm" type="button">
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                      <Button variant="outline" size="sm" type="button">
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="border-t pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Tier Settings
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="is_active"
                          defaultChecked={selectedTier?.is_active !== false}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-black dark:text-white">
                          Tier Active
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="is_popular"
                          defaultChecked={selectedTier?.is_popular}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-black dark:text-white">
                          Mark as Popular
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTierForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {selectedTier ? 'Update Tier' : 'Create Tier'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={profile?.full_name || user?.email || 'Admin'}
        pageType="admin"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Pricing Configuration
              </h1>
              <p className="text-black dark:text-gray-300">
                Manage pricing tiers, features, and limitations
              </p>
            </div>
            <Button onClick={handleCreateTier}>
              <DollarSignIcon className="h-4 w-4 mr-2" />
              Add New Tier
            </Button>
          </div>

          {/* Pricing Tiers */}
          {tiersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricingTiers.map(tier => (
                <Card
                  key={tier.id}
                  className={`relative ${tier.is_popular ? 'ring-2 ring-orange-500' : ''}`}
                >
                  {tier.is_popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-orange-500 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                        {tier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-black dark:text-white">
                        ${tier.price}
                      </span>
                      <span className="text-black dark:text-gray-300">
                        /{tier.billing_period}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Limitations */}
                    <div className="text-sm text-black dark:text-gray-300 space-y-1">
                      <p>
                        <strong>Max Agents:</strong>{' '}
                        {tier.max_agents === -1 ? 'Unlimited' : tier.max_agents}
                      </p>
                      <p>
                        <strong>Max Calls:</strong>{' '}
                        {tier.max_calls_per_month.toLocaleString()}/month
                      </p>
                    </div>

                    {/* Agent Types */}
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white mb-2">
                        Allowed Agent Types:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tier.agent_types_allowed.map(agentType => (
                          <Badge
                            key={agentType}
                            variant="outline"
                            className="text-xs"
                          >
                            {
                              AGENT_TYPE_NAMES[
                                agentType as keyof typeof AGENT_TYPE_NAMES
                              ]
                            }
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white mb-2">
                        Features:
                      </p>
                      <ul className="text-sm text-black dark:text-gray-300 space-y-1">
                        {tier.features.slice(0, 4).map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {tier.features.length > 4 && (
                          <li className="text-gray-500">
                            +{tier.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleEditTier(tier)}
                        className="w-full"
                      >
                        <EditIcon className="h-4 w-4 mr-2" />
                        Edit Tier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Statistics</CardTitle>
              <CardDescription>
                Overview of current pricing configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {pricingTiers.length}
                  </div>
                  <div className="text-sm text-black dark:text-gray-300">
                    Total Tiers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {pricingTiers.filter(t => t.is_active).length}
                  </div>
                  <div className="text-sm text-black dark:text-gray-300">
                    Active Tiers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    ${Math.min(...pricingTiers.map(t => t.price))}
                  </div>
                  <div className="text-sm text-black dark:text-gray-300">
                    Lowest Price
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    ${Math.max(...pricingTiers.map(t => t.price))}
                  </div>
                  <div className="text-sm text-black dark:text-gray-300">
                    Highest Price
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
