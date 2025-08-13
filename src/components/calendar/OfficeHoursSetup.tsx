'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthenticatedApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ClockIcon, CheckIcon, XIcon } from '@/components/icons';

interface OfficeHours {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface OfficeHoursSetupProps {
  user: User;
  businessId: string;
  onSaved?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function OfficeHoursSetup({
  user,
  businessId,
  onSaved,
}: OfficeHoursSetupProps) {
  const [officeHours, setOfficeHours] = useState<OfficeHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOfficeHours();
  }, [user, businessId]);

  const loadOfficeHours = async () => {
    try {
      setLoading(true);
      const response = await AuthenticatedApiClient.get(
        `/api/business/office-hours?user_id=${user.id}&business_id=${businessId}`
      );

      if (response.ok) {
        const data = await response.json();
        const existingHours = data.office_hours || [];

        // Initialize with default hours (Mon-Fri 9AM-5PM) if none exist
        const allDays = DAYS_OF_WEEK.map(day => {
          const existing = existingHours.find(
            (h: OfficeHours) => h.day_of_week === day.value
          );
          return (
            existing || {
              day_of_week: day.value,
              start_time: day.value >= 1 && day.value <= 5 ? '09:00' : '',
              end_time: day.value >= 1 && day.value <= 5 ? '17:00' : '',
              is_active: day.value >= 1 && day.value <= 5,
            }
          );
        });

        setOfficeHours(allDays);
      }
    } catch (error) {
      console.error('Failed to load office hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDayHours = (
    dayIndex: number,
    field: keyof OfficeHours,
    value: any
  ) => {
    setOfficeHours(prev =>
      prev.map((day, index) =>
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const copyToAllDays = (sourceDayIndex: number) => {
    const sourceDay = officeHours[sourceDayIndex];
    if (!sourceDay.is_active) return;

    setOfficeHours(prev =>
      prev.map(day =>
        day.is_active
          ? {
              ...day,
              start_time: sourceDay.start_time,
              end_time: sourceDay.end_time,
            }
          : day
      )
    );
  };

  const saveOfficeHours = async () => {
    try {
      setSaving(true);

      // Only save active days
      const activeHours = officeHours
        .filter(day => day.is_active)
        .map(day => ({
          day_of_week: day.day_of_week,
          start_time: day.start_time + ':00',
          end_time: day.end_time + ':00',
          is_active: day.is_active,
        }));

      const response = await AuthenticatedApiClient.post(
        '/api/business/office-hours',
        {
          user_id: user.id,
          business_id: businessId,
          office_hours: activeHours,
        }
      );

      if (response.ok) {
        toast.success('Office hours saved successfully!');
        if (onSaved) onSaved();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save office hours');
      }
    } catch (error) {
      console.error('Failed to save office hours:', error);
      toast.error('Failed to save office hours. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading office hours...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Office Hours Setup
        </CardTitle>
        <CardDescription>
          Configure your business operating hours for each day of the week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day, index) => {
            const dayHours = officeHours[index];
            if (!dayHours) return null;

            return (
              <div
                key={day.value}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="w-20">
                  <Label className="font-medium">{day.short}</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={dayHours.is_active}
                    onCheckedChange={checked =>
                      updateDayHours(index, 'is_active', checked)
                    }
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Open
                  </span>
                </div>

                {dayHours.is_active && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">From:</Label>
                      <Input
                        type="time"
                        value={dayHours.start_time}
                        onChange={e =>
                          updateDayHours(index, 'start_time', e.target.value)
                        }
                        className="w-32"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm">To:</Label>
                      <Input
                        type="time"
                        value={dayHours.end_time}
                        onChange={e =>
                          updateDayHours(index, 'end_time', e.target.value)
                        }
                        className="w-32"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToAllDays(index)}
                      className="text-xs"
                    >
                      Copy to all
                    </Button>
                  </>
                )}

                {!dayHours.is_active && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Office Hours Tips</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>
                  • Use the "Copy to all" button to apply the same hours to all
                  open days
                </li>
                <li>• Toggle days off by switching them to "Closed"</li>
                <li>• These hours will be the default for all staff members</li>
                <li>
                  • Individual staff can override these hours in their personal
                  calendars
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={saveOfficeHours}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Office Hours
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadOfficeHours} disabled={saving}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
