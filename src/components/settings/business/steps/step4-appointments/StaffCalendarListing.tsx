'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  UserIcon,
  SearchIcon,
  SettingsIcon,
  CheckIcon,
  ClockIcon,
  EditIcon,
} from '@/components/icons';

interface StaffMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  is_active: boolean;
  created_at: string;
  specialties?: string[];
  job_types?: string[];
}

interface CalendarConfig {
  id: string;
  staff_id: string;
  is_configured: boolean;
  default_start_time: string;
  default_end_time: string;
  working_days: number;
  max_advance_days: number;
  created_at: string;
  updated_at: string;
}

interface BusinessHours {
  start_time: string;
  end_time: string;
  working_days: string[];
}

interface StaffCalendarListingProps {
  user: User;
  businessId: string;
  businessName?: string;
}

export function StaffCalendarListing({
  user,
  businessId,
  businessName = 'Your Business',
}: StaffCalendarListingProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [calendarConfigs, setCalendarConfigs] = useState<{
    [key: string]: CalendarConfig;
  }>({});
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'configured' | 'unconfigured'
  >('all');

  useEffect(() => {
    loadStaffAndConfigs();
    loadBusinessHours();
  }, [user, businessId]);

  const loadStaffAndConfigs = async () => {
    setLoading(true);
    try {
      // Load staff members
      const staffResponse = await fetch(
        `/api/business/staff?user_id=${user.id}`
      );
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        const staffMembers = staffData.staff || [];
        setStaff(staffMembers);

        // Load calendar configurations for all staff
        if (staffMembers.length > 0) {
          const configResponse = await authenticatedFetch(
            `/api/business/staff-calendar-configs?user_id=${user.id}`
          );
          if (configResponse.ok) {
            const configData = await configResponse.json();
            const configMap: { [key: string]: CalendarConfig } = {};
            configData.configs?.forEach((config: CalendarConfig) => {
              configMap[config.staff_id] = config;
            });
            setCalendarConfigs(configMap);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load staff and configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessHours = async () => {
    try {
      // Load business profile to get default hours
      const response = await authenticatedFetch(
        `/api/business/profile?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.profile?.business_hours) {
          setBusinessHours(data.profile.business_hours);
        }
      }
    } catch (error) {
      console.error('Failed to load business hours:', error);
    }
  };

  const handleCalendarConfiguration = (staffMember: StaffMember) => {
    // Navigate to individual staff calendar page
    router.push(`/appointments/calendar/${staffMember.id}`);
  };

  const getWorkingDaysDisplay = (workingDays: number) => {
    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      if (workingDays & Math.pow(2, i)) {
        days.push(dayNames[i]);
      }
    }
    return days.join(', ');
  };

  const getConfigurationStatus = (staffId: string) => {
    const config = calendarConfigs[staffId];
    if (!config) {
      return {
        status: 'not_configured',
        label: 'Not Configured',
        color: 'bg-red-100 text-red-800',
      };
    }
    if (config.is_configured) {
      return {
        status: 'configured',
        label: 'Configured',
        color: 'bg-green-100 text-green-800',
      };
    }
    return {
      status: 'partial',
      label: 'Partially Configured',
      color: 'bg-yellow-100 text-yellow-800',
    };
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch =
      searchTerm === '' ||
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;

    const configStatus = getConfigurationStatus(member.id);
    if (filterStatus === 'configured') {
      return configStatus.status === 'configured';
    }
    if (filterStatus === 'unconfigured') {
      return (
        configStatus.status === 'not_configured' ||
        configStatus.status === 'partial'
      );
    }

    return true;
  });

  const getStatsData = () => {
    const total = staff.length;
    const configured = staff.filter(
      s => getConfigurationStatus(s.id).status === 'configured'
    ).length;
    const unconfigured = total - configured;

    return { total, configured, unconfigured };
  };

  const stats = getStatsData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading staff calendar configurations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Appointment Calendar Configuration
          </CardTitle>
          <CardDescription>
            Configure individual staff calendars for {businessName}. Each staff
            member can customize their availability and booking preferences.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <UserIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Configured</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.configured}
                </p>
              </div>
              <CheckIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Setup</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.unconfigured}
                </p>
              </div>
              <SettingsIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Hours Info */}
      {businessHours && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">
                  Default Business Hours
                </h4>
                <p className="text-sm text-blue-700">
                  {businessHours.start_time} - {businessHours.end_time}
                  {businessHours.working_days &&
                    businessHours.working_days.length > 0 && (
                      <span className="ml-2">
                        ({businessHours.working_days.join(', ')})
                      </span>
                    )}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Staff calendars will inherit these hours unless individually
                  customized
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name, email, or title..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={filterStatus === 'configured' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('configured')}
              >
                Configured ({stats.configured})
              </Button>
              <Button
                variant={
                  filterStatus === 'unconfigured' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setFilterStatus('unconfigured')}
              >
                Needs Setup ({stats.unconfigured})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Click the calendar icon to configure individual staff member
            availability and booking preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {staff.length === 0
                  ? 'No Staff Members Found'
                  : 'No Matching Staff Found'}
              </h3>
              <p className="text-gray-600">
                {staff.length === 0
                  ? 'Add staff members in the Staff Management section first.'
                  : 'Try adjusting your search terms or filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStaff.map(member => {
                const configStatus = getConfigurationStatus(member.id);
                const config = calendarConfigs[member.id];

                return (
                  <div
                    key={member.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {member.first_name} {member.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {member.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.email}
                            </p>
                          </div>
                          <Badge className={configStatus.color}>
                            {configStatus.label}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Phone:</span>
                            <p className="font-medium">
                              {member.phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium">
                              {member.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>

                          {config && (
                            <>
                              <div>
                                <span className="text-gray-600">
                                  Working Hours:
                                </span>
                                <p className="font-medium">
                                  {config.default_start_time.substring(0, 5)} -{' '}
                                  {config.default_end_time.substring(0, 5)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Working Days:
                                </span>
                                <p className="font-medium">
                                  {getWorkingDaysDisplay(config.working_days)}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Max Advance Booking:
                                </span>
                                <p className="font-medium">
                                  {config.max_advance_days} days
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Last Updated:
                                </span>
                                <p className="font-medium">
                                  {new Date(
                                    config.updated_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {member.specialties &&
                          member.specialties.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm text-gray-600">
                                Specialties:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.specialties.map((specialty, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        <Button
                          onClick={() => handleCalendarConfiguration(member)}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Calendar Config
                        </Button>

                        {config && config.is_configured && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCalendarConfiguration(member)}
                            className="flex items-center gap-2"
                          >
                            <EditIcon className="h-4 w-4" />
                            Edit Calendar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Setup Guide */}
      {stats.unconfigured > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900">Quick Setup Guide</CardTitle>
            <CardDescription className="text-orange-700">
              Get your staff calendars configured quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Click Calendar Config for each staff member
                  </p>
                  <p className="text-orange-700">
                    This opens their individual calendar configuration page
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Set working hours and days
                  </p>
                  <p className="text-orange-700">
                    Configure when each staff member is available for
                    appointments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Generate default calendar
                  </p>
                  <p className="text-orange-700">
                    Auto-create availability based on business hours and
                    holidays
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Customize as needed
                  </p>
                  <p className="text-orange-700">
                    Override specific dates for vacations, meetings, or schedule
                    changes
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
