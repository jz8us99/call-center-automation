'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
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
}

interface StaffAvailabilityStats {
  total_days_configured: number;
  available_days: number;
  unavailable_days: number;
  last_updated: string;
}

interface CalendarConfigurationDashboardProps {
  user: User;
  businessId: string;
  businessName?: string;
}

export function CalendarConfigurationDashboard({
  user,
  businessId,
  businessName = 'Your Business',
}: CalendarConfigurationDashboardProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [availabilityStats, setAvailabilityStats] = useState<{
    [key: string]: StaffAvailabilityStats;
  }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'configured' | 'unconfigured'
  >('all');

  useEffect(() => {
    loadStaffAndStats();
  }, [user, businessId]);

  const loadStaffAndStats = async () => {
    setLoading(true);
    try {
      // Load staff members
      const staffResponse = await fetch(`/api/staff?user_id=${user.id}`);
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        const staffMembers = staffData.staff || [];
        setStaff(staffMembers);

        // Load availability stats for each staff member
        await loadAvailabilityStats(staffMembers);
      }
    } catch (error) {
      console.error('Failed to load staff and stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilityStats = async (staffMembers: StaffMember[]) => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const stats: { [key: string]: StaffAvailabilityStats } = {};

    for (const member of staffMembers) {
      try {
        const response = await fetch(
          `/api/staff-availability?staff_id=${member.id}&user_id=${user.id}&start_date=${currentYear}-01-01&end_date=${nextYear}-12-31`
        );

        if (response.ok) {
          const data = await response.json();
          const availability = data.availability || [];

          stats[member.id] = {
            total_days_configured: availability.length,
            available_days: availability.filter((a: any) => a.is_available)
              .length,
            unavailable_days: availability.filter((a: any) => !a.is_available)
              .length,
            last_updated:
              availability.length > 0
                ? availability.sort(
                    (a: any, b: any) =>
                      new Date(b.updated_at).getTime() -
                      new Date(a.updated_at).getTime()
                  )[0].updated_at
                : '',
          };
        }
      } catch (error) {
        console.error(`Failed to load stats for staff ${member.id}:`, error);
        stats[member.id] = {
          total_days_configured: 0,
          available_days: 0,
          unavailable_days: 0,
          last_updated: '',
        };
      }
    }

    setAvailabilityStats(stats);
  };

  const handleStaffCalendarConfig = (staffMember: StaffMember) => {
    router.push(`/calendar/staff/${staffMember.id}`);
  };

  const handleOfficeSetup = () => {
    router.push('/calendar/setup');
  };

  const getConfigurationStatus = (staffId: string) => {
    const stats = availabilityStats[staffId];
    if (!stats || stats.total_days_configured === 0) {
      return {
        status: 'not_configured',
        label: 'Not Configured',
        color: 'bg-red-100 text-red-800',
      };
    }
    if (stats.total_days_configured < 30) {
      return {
        status: 'partial',
        label: 'Partially Configured',
        color: 'bg-yellow-100 text-yellow-800',
      };
    }
    return {
      status: 'configured',
      label: 'Fully Configured',
      color: 'bg-green-100 text-green-800',
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
          <p className="text-gray-600">Loading calendar configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Calendar Configuration Dashboard
              </CardTitle>
              <CardDescription>
                Manage staff calendars and availability for {businessName}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleOfficeSetup} variant="outline">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Business Setup
              </Button>
              <Button
                onClick={() => router.push('/calendar/setup')}
                variant="outline"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Manage Holidays
              </Button>
            </div>
          </div>
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
          <CardTitle>Staff Calendar Configuration</CardTitle>
          <CardDescription>
            Click the calendar icon to configure individual staff member
            availability
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
                const stats = availabilityStats[member.id];

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

                        <div className="grid md:grid-cols-4 gap-4 text-sm">
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

                          {stats && (
                            <>
                              <div>
                                <span className="text-gray-600">
                                  Days Configured:
                                </span>
                                <p className="font-medium">
                                  {stats.total_days_configured}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Available Days:
                                </span>
                                <p className="font-medium text-green-600">
                                  {stats.available_days}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {stats && stats.last_updated && (
                          <div className="mt-2 text-xs text-gray-500">
                            Last updated:{' '}
                            {new Date(stats.last_updated).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        <Button
                          onClick={() => handleStaffCalendarConfig(member)}
                          className="flex items-center gap-2"
                          size="sm"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Configure Calendar
                        </Button>

                        {configStatus.status === 'configured' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStaffCalendarConfig(member)}
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
                    Set up office hours and holidays
                  </p>
                  <p className="text-orange-700">
                    Configure business-wide settings in Office Setup
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Configure individual staff calendars
                  </p>
                  <p className="text-orange-700">
                    Click "Configure Calendar" for each staff member
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Set staff availability
                  </p>
                  <p className="text-orange-700">
                    Define when each staff member is available for appointments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-orange-800 font-bold text-xs">
                  4
                </div>
                <div>
                  <p className="font-medium text-orange-900">
                    Enable online booking
                  </p>
                  <p className="text-orange-700">
                    Once configured, your calendar system is ready for customer
                    bookings
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
