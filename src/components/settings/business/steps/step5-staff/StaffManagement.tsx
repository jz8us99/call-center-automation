'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FinalStaffManagement } from '@/components/settings/business/steps/step5-staff/FinalStaffManagement';

interface StaffManagementProps {
  user: User;
  onStaffUpdate: (hasStaff: boolean) => void;
}

export function StaffManagement({ user, onStaffUpdate }: StaffManagementProps) {
  const t = useTranslations('staffManagement');
  const [serviceTypeCode, setServiceTypeCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBusinessProfile();
    }
  }, [user]);

  const loadBusinessProfile = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `/api/business/profile?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.profile?.business_type) {
          setServiceTypeCode(data.profile.business_type);
        }
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FinalStaffManagement
      user={user}
      serviceTypeCode={serviceTypeCode}
      onStaffUpdate={onStaffUpdate}
    />
  );
}
