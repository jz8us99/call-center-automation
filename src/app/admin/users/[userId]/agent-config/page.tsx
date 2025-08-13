'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';

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
import { AgentConfigurationDashboard } from '@/components/settings/business/admin/AgentConfigurationDashboard';
import { UsageUpgradeDialog } from '@/components/ui/usage-upgrade-dialog';
import {
  ArrowLeftIcon,
  SettingsIcon,
  UsersIcon,
  ArrowUpIcon,
} from '@/components/icons';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  pricing_tier: 'basic' | 'premium' | 'enterprise';
  agent_types_allowed: string[];
  is_active: boolean;
  business_name?: string;
  business_type?: string;
}

export default function AdminUserAgentConfig() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [targetUserLoading, setTargetUserLoading] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
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
    const loadTargetUser = async () => {
      if (!userId) return;

      try {
        setTargetUserLoading(true);

        const response = await authenticatedFetch(
          `/api/admin/users/${userId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user');
        }

        const data = await response.json();
        setTargetUser(data.user);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Fall back to development mode with mock data
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (isDevelopment) {
          const mockUser: UserProfile = {
            id: userId,
            full_name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
            pricing_tier: 'premium',
            agent_types_allowed: ['inbound_call', 'outbound_appointment'],
            is_active: true,
            business_name: 'Doe Dental Clinic',
            business_type: 'Dental',
          };
          setTargetUser(mockUser);
        }
      } finally {
        setTargetUserLoading(false);
      }
    };

    // Load target user in development mode or when user is admin
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment || isAdmin) {
      loadTargetUser();
    }
  }, [userId, isAdmin]);

  const handleUpgrade = async (newTier: 'basic' | 'premium' | 'enterprise') => {
    try {
      const response = await authenticatedFetch(
        `/api/admin/users/${userId}/upgrade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newTier }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade user');
      }

      const data = await response.json();
      setTargetUser(data.user);

      alert(`Successfully upgraded user to ${newTier} tier!`);
    } catch (error) {
      console.error('Failed to upgrade user:', error);
      alert('Failed to upgrade user. Please try again.');
    }
  };

  // Development mode bypass - remove this in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if ((loading || profileLoading || targetUserLoading) && !isDevelopment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Loading user agent configuration...</p>
        </div>
      </div>
    );
  }

  if (!isDevelopment && (!user || !isAdmin || !targetUser)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page or the user was
            not found.
          </p>
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Back to User Management
          </button>
        </div>
      </div>
    );
  }

  // Handle missing targetUser in development mode
  let displayUser = targetUser;
  if (isDevelopment && !targetUser) {
    displayUser = {
      id: userId || '1',
      full_name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      pricing_tier: 'premium',
      agent_types_allowed: ['inbound_call', 'outbound_appointment'],
      is_active: true,
      business_name: 'Doe Dental Clinic',
      business_type: 'Dental',
    };
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/users')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Agent Configuration
                </h1>
                <p className="text-sm text-gray-600">
                  Managing agents for {displayUser.full_name} (
                  {displayUser.email})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m0 0V11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v10m3 0a1 1 0 0 0 1-1V10m0 0 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </button>
              <Badge
                variant={
                  displayUser.pricing_tier === 'enterprise'
                    ? 'default'
                    : 'secondary'
                }
                className={
                  displayUser.pricing_tier === 'enterprise'
                    ? 'bg-purple-100 text-purple-800'
                    : displayUser.pricing_tier === 'premium'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                }
              >
                {displayUser.pricing_tier} tier
              </Badge>
              <Badge variant={displayUser.is_active ? 'default' : 'secondary'}>
                {displayUser.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* User Info Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center">
                <UsersIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {displayUser.full_name}
                </h1>
                <p className="text-blue-100 text-lg">AI Agent Configuration</p>
                <div className="flex items-center space-x-4 mt-2 text-blue-100">
                  <span>{displayUser.email}</span>
                  {displayUser.business_name && (
                    <>
                      <span>•</span>
                      <span>{displayUser.business_name}</span>
                    </>
                  )}
                  {displayUser.business_type && (
                    <>
                      <span>•</span>
                      <span>{displayUser.business_type}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-100 mb-2">
                  Current Permissions
                </p>
                <Badge
                  variant="secondary"
                  className={`mb-2 ${
                    displayUser.pricing_tier === 'enterprise'
                      ? 'bg-purple-200 text-purple-900'
                      : displayUser.pricing_tier === 'premium'
                        ? 'bg-orange-200 text-orange-900'
                        : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {displayUser.pricing_tier.toUpperCase()} TIER
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {displayUser.agent_types_allowed.map(agentType => (
                    <Badge
                      key={agentType}
                      variant="secondary"
                      className="text-xs bg-white/30 text-white border-white/40"
                    >
                      {agentType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Management Panel */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Permission Management
            </CardTitle>
            <CardDescription className="text-blue-700">
              Configure which AI agent types this user can access and create
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">
                  Available Agent Types
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      id: 'inbound_call',
                      name: 'Inbound Call Agent',
                      tier: 'basic',
                      description: 'Handle incoming customer calls',
                    },
                    {
                      id: 'outbound_appointment',
                      name: 'Outbound Appointment Agent',
                      tier: 'premium',
                      description: 'Manage appointment bookings and reminders',
                    },
                    {
                      id: 'customer_support',
                      name: 'Customer Support Agent',
                      tier: 'premium',
                      description: 'Provide detailed customer assistance',
                    },
                    {
                      id: 'outbound_marketing',
                      name: 'Outbound Marketing Agent',
                      tier: 'enterprise',
                      description: 'Conduct sales and marketing calls',
                    },
                  ].map(agentType => {
                    const isAllowed = displayUser.agent_types_allowed.includes(
                      agentType.id
                    );
                    const canAccess =
                      agentType.tier === 'basic' ||
                      (agentType.tier === 'premium' &&
                        ['premium', 'enterprise'].includes(
                          displayUser.pricing_tier
                        )) ||
                      (agentType.tier === 'enterprise' &&
                        displayUser.pricing_tier === 'enterprise');

                    return (
                      <div
                        key={agentType.id}
                        className={`p-3 rounded-lg border ${
                          isAllowed && canAccess
                            ? 'bg-green-50 border-green-200'
                            : canAccess
                              ? 'bg-white border-gray-200'
                              : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900">
                                {agentType.name}
                              </h5>
                              <Badge variant="outline" className="text-xs">
                                {agentType.tier}
                              </Badge>
                              {isAllowed && (
                                <Badge
                                  variant="default"
                                  className="text-xs bg-green-600"
                                >
                                  Enabled
                                </Badge>
                              )}
                              {!canAccess && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-red-100 text-red-800"
                                >
                                  Requires {agentType.tier} tier
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {agentType.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            {canAccess ? (
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                onChange={() => {
                                  // TODO: Implement permission toggle
                                  console.log(
                                    `Toggle ${agentType.id} for user ${displayUser.id}`
                                  );
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            ) : (
                              <div className="w-4 h-4 bg-gray-300 rounded border border-gray-400 cursor-not-allowed"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-900 mb-3">
                  Current Configuration
                </h4>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Pricing Tier:
                      </span>
                      <Badge
                        className={`ml-2 ${
                          displayUser.pricing_tier === 'enterprise'
                            ? 'bg-purple-100 text-purple-800'
                            : displayUser.pricing_tier === 'premium'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {displayUser.pricing_tier.charAt(0).toUpperCase() +
                          displayUser.pricing_tier.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Enabled Agent Types:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {displayUser.agent_types_allowed.length > 0 ? (
                          displayUser.agent_types_allowed.map(type => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="text-xs"
                            >
                              {type.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">
                            None enabled
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Account Status:
                      </span>
                      <Badge
                        variant={
                          displayUser.is_active ? 'default' : 'secondary'
                        }
                        className="ml-2"
                      >
                        {displayUser.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Save Permission Changes
                    </button>
                    <button
                      onClick={() => setShowUpgradeDialog(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Configuration Dashboard */}
        <div className="space-y-6">
          {user && (
            <AgentConfigurationDashboard
              user={user}
              // Pass additional props to indicate this is admin mode
              isAdminMode={true}
              targetUser={targetUser}
            />
          )}
        </div>
      </div>

      {/* Usage Upgrade Dialog */}
      {targetUser && (
        <UsageUpgradeDialog
          currentTier={targetUser.pricing_tier}
          onUpgrade={handleUpgrade}
          onClose={() => setShowUpgradeDialog(false)}
          isOpen={showUpgradeDialog}
        />
      )}
    </div>
  );
}
