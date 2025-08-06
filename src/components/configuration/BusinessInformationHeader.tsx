'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditIcon, CheckIcon, BuildingIcon } from '@/components/icons';
import { User } from '@supabase/supabase-js';
import { BusinessType } from '@/types/business-types';
import { BusinessInformationForm } from './BusinessInformationForm';

interface BusinessProfile {
  id?: string;
  user_id: string;
  business_name: string;
  business_type: string;
  business_address?: string;
  business_phone: string;
  business_email?: string;
  business_website?: string;
  timezone: string;
  contact_person_name?: string;
  contact_person_role?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  business_hours?: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  created_at?: string;
  updated_at?: string;
}

interface BusinessInformationHeaderProps {
  user: User;
  onBusinessProfileUpdate?: (profile: BusinessProfile) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  agentType?: string;
  showAgentTypeSpecific?: boolean;
}

export function BusinessInformationHeader({
  user,
  onBusinessProfileUpdate,
  isCollapsed = false,
  onToggleCollapse,
  agentType,
  showAgentTypeSpecific = false,
}: BusinessInformationHeaderProps) {
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({});
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  useEffect(() => {
    loadBusinessProfile();
    loadBusinessTypes();
  }, [user]);

  const loadBusinessTypes = async () => {
    try {
      const response = await fetch('/api/business-types');
      const result = await response.json();
      setBusinessTypes(result.business_types || []);
    } catch (error) {
      console.error('Failed to load business types:', error);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/business-profile?user_id=${user.id}`);
      const result = await response.json();

      if (result.profile) {
        // Map the client data to BusinessProfile format
        const profile: BusinessProfile = {
          id: result.profile.id,
          user_id: result.profile.user_id,
          business_name: result.profile.business_name || '',
          business_type: result.profile.business_type || '',
          business_phone: result.profile.contact_phone || '',
          business_email: result.profile.contact_email || '',
          timezone: result.profile.timezone || 'America/New_York',
          business_hours: {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '13:00', closed: false },
            sunday: { open: '09:00', close: '17:00', closed: true },
          },
        };
        setBusinessProfile(profile);
        setFormData(profile);
      } else {
        // No profile exists, create empty one
        const emptyProfile: BusinessProfile = {
          user_id: user.id,
          business_name: '',
          business_type: '',
          business_phone: '',
          timezone: 'America/New_York',
          business_hours: {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '13:00', closed: false },
            sunday: { open: '09:00', close: '17:00', closed: true },
          },
        };
        setBusinessProfile(emptyProfile);
        setFormData(emptyProfile);
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.business_name || !formData.business_phone) {
      alert('Please fill in required fields: Business Name and Phone');
      return;
    }

    try {
      setSaving(true);

      const method = businessProfile?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/business-profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: businessProfile?.id,
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          business_address: formData.business_address,
          business_phone: formData.business_phone,
          business_email: formData.business_email,
          business_website: formData.business_website,
          timezone: formData.timezone,
          contact_person_name: formData.contact_person_name,
          contact_person_role: formData.contact_person_role,
          contact_person_phone: formData.contact_person_phone,
          contact_person_email: formData.contact_person_email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save business profile');
      }

      const result = await response.json();

      // Map the saved client data back to BusinessProfile format
      const savedProfile: BusinessProfile = {
        id: result.profile.id,
        user_id: result.profile.user_id,
        business_name: result.profile.business_name,
        business_type: result.profile.business_type,
        business_phone: result.profile.contact_phone,
        business_email: result.profile.contact_email,
        timezone: result.profile.timezone,
        business_hours:
          businessProfile?.business_hours || formData.business_hours,
      };

      setBusinessProfile(savedProfile);
      setIsEditing(false);

      if (onBusinessProfileUpdate) {
        onBusinessProfileUpdate(savedProfile);
      }
    } catch (error) {
      console.error('Failed to save business profile:', error);
      alert('Failed to save business profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(businessProfile || {});
    setIsEditing(false);
  };

  const updateFormData = (field: keyof BusinessProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isProfileComplete =
    businessProfile?.business_name && businessProfile?.business_phone;

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <BusinessInformationForm
        user={user}
        onBusinessProfileUpdate={profile => {
          setBusinessProfile(profile);
          setIsEditing(false);
          if (onBusinessProfileUpdate) {
            onBusinessProfileUpdate(profile);
          }
        }}
        initialData={businessProfile}
      />
    );
  }

  return (
    <Card className="mb-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BuildingIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-black dark:text-white">
                Business Information & AI Training Data
                {agentType && showAgentTypeSpecific && (
                  <span className="ml-2 text-sm font-normal text-orange-600 dark:text-orange-400">
                    •{' '}
                    {agentType
                      .replace('_', ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}{' '}
                    Agent
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-black dark:text-gray-300">
                {showAgentTypeSpecific && agentType
                  ? `Configured for ${agentType.replace('_', ' ').toLowerCase()} operations`
                  : 'Comprehensive business details to train your AI agent'}
              </CardDescription>
            </div>
            {isProfileComplete && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-300"
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="hover:bg-orange-100 dark:hover:bg-orange-900/30"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              {businessProfile?.business_name
                ? 'Edit & Add Details'
                : 'Add Business Information'}
            </Button>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="hover:bg-orange-100 dark:hover:bg-orange-900/30"
              >
                {isCollapsed ? '▼' : '▲'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Display Mode */}
          {businessProfile?.business_name ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Business Name
                  </label>
                  <p className="text-sm font-medium text-black dark:text-white">
                    {businessProfile.business_name}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Type
                  </label>
                  <p className="text-sm text-black dark:text-gray-300">
                    {businessProfile.business_type
                      ? businessTypes.find(
                          bt => bt.type_code === businessProfile.business_type
                        )?.name || businessProfile.business_type
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">
                    Phone
                  </label>
                  <p className="text-sm text-black dark:text-gray-300">
                    {businessProfile.business_phone}
                  </p>
                </div>
                {businessProfile.business_email && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="text-sm text-black dark:text-gray-300">
                      {businessProfile.business_email}
                    </p>
                  </div>
                )}
                {businessProfile.business_address && (
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Address
                    </label>
                    <p className="text-sm text-black dark:text-gray-300">
                      {businessProfile.business_address}
                    </p>
                  </div>
                )}
              </div>

              {/* Show additional information summary if available */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Support Content
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {businessProfile.support_content
                        ? '✓ Added'
                        : '○ Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Payment Methods
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {(businessProfile.payment_methods?.length || 0) > 0
                        ? `✓ ${businessProfile.payment_methods?.length} methods`
                        : '○ Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      FAQs
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {(businessProfile.common_questions?.length || 0) > 0
                        ? `✓ ${businessProfile.common_questions?.length} items`
                        : '○ Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Documents
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {(businessProfile.business_documents?.length || 0) > 0
                        ? `✓ ${businessProfile.business_documents?.length} files`
                        : '○ Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <BuildingIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-black dark:text-white mb-2">
                Business Information Required
              </h4>
              <p className="text-sm text-black dark:text-gray-300 mb-4">
                Add comprehensive business information to train your AI agents
                effectively with products, services, policies, and more.
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Add Business Information
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
