'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  PhoneIcon,
} from '@/components/icons';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  title: string;
  notes: string;
  customer_notes: string;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'rescheduled';
  booking_source: string;
  total_amount: number;
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  appointment_types: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    color_code: string;
  };
  staff_id: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
}

interface AppointmentManagementDashboardProps {
  user: User;
  businessId: string;
}

export function AppointmentManagementDashboard({
  user,
  businessId,
}: AppointmentManagementDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [user, businessId]);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, selectedStaff, selectedStatus, searchTerm]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStaff(), loadAppointments()]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await fetch(`/api/staff?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const params = new URLSearchParams({
        user_id: user.id,
        start_date: selectedDate,
        end_date: selectedDate,
      });

      if (selectedStaff) {
        params.append('staff_id', selectedStaff);
      }

      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/appointments?${params}`);
      if (response.ok) {
        const data = await response.json();
        let filteredAppointments = data.appointments || [];

        // Apply search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredAppointments = filteredAppointments.filter(
            (apt: Appointment) =>
              apt.customers.first_name.toLowerCase().includes(term) ||
              apt.customers.last_name.toLowerCase().includes(term) ||
              apt.customers.email.toLowerCase().includes(term) ||
              apt.customers.phone.includes(term) ||
              apt.title.toLowerCase().includes(term)
          );
        }

        setAppointments(filteredAppointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: string,
    reason?: string
  ) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointmentId,
          user_id: user.id,
          status,
          changed_by: user.id,
          change_reason: reason,
        }),
      });

      if (response.ok) {
        await loadAppointments();
        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment(null);
          setShowDetailsDialog(false);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember
      ? `${staffMember.first_name} ${staffMember.last_name}`
      : 'Unknown';
  };

  const getTodayStats = () => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const scheduled = appointments.filter(
      a => a.status === 'scheduled' || a.status === 'confirmed'
    ).length;
    const cancelled = appointments.filter(
      a => a.status === 'cancelled' || a.status === 'no_show'
    ).length;

    return { total, completed, scheduled, cancelled };
  };

  const stats = getTodayStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
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
            <CalendarIcon className="h-5 w-5" />
            Appointment Management
          </CardTitle>
          <CardDescription>
            Manage and track your daily appointments
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.scheduled}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
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
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.cancelled}
                </p>
              </div>
              <XIcon className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="staff">Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All staff</SelectItem>
                  {staff.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                  setSelectedStaff('');
                  setSelectedStatus('');
                  setSearchTerm('');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Appointments for {formatDate(selectedDate)}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                Calendar View
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600">
                No appointments match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowDetailsDialog(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatTime(appointment.start_time)} -{' '}
                            {formatTime(appointment.end_time)}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {appointment.customers.first_name}{' '}
                            {appointment.customers.last_name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <PhoneIcon className="h-3 w-3" />
                            {appointment.customers.phone}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.appointment_types.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.duration_minutes} minutes
                          </p>
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {getStaffName(appointment.staff_id)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.booking_source}
                          </p>
                        </div>
                      </div>

                      {(appointment.notes || appointment.customer_notes) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {appointment.customer_notes && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">
                                Customer notes:
                              </span>{' '}
                              {appointment.customer_notes}
                            </p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Staff notes:</span>{' '}
                              {appointment.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {appointment.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            updateAppointmentStatus(
                              appointment.id,
                              'confirmed'
                            );
                          }}
                        >
                          Confirm
                        </Button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            updateAppointmentStatus(
                              appointment.id,
                              'in_progress'
                            );
                          }}
                        >
                          Start
                        </Button>
                      )}
                      {appointment.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            updateAppointmentStatus(
                              appointment.id,
                              'completed'
                            );
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              View and manage appointment information
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">
                      {selectedAppointment.customers.first_name}{' '}
                      {selectedAppointment.customers.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">
                      {selectedAppointment.customers.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">
                      {selectedAppointment.customers.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div>
                <h4 className="font-semibold mb-2">Appointment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <p className="font-medium">
                      {selectedAppointment.appointment_types.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">
                      {selectedAppointment.duration_minutes} minutes
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium">
                      {new Date(
                        selectedAppointment.appointment_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-medium">
                      {formatTime(selectedAppointment.start_time)} -{' '}
                      {formatTime(selectedAppointment.end_time)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Staff:</span>
                    <p className="font-medium">
                      {getStaffName(selectedAppointment.staff_id)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      className={getStatusColor(selectedAppointment.status)}
                    >
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedAppointment.customer_notes ||
                selectedAppointment.notes) && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  {selectedAppointment.customer_notes && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">
                        Customer notes:
                      </span>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedAppointment.customer_notes}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <span className="text-sm text-gray-600">
                        Staff notes:
                      </span>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <Button
                      onClick={() =>
                        updateAppointmentStatus(
                          selectedAppointment.id,
                          'confirmed'
                        )
                      }
                      className="flex-1"
                    >
                      Confirm Appointment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateAppointmentStatus(
                          selectedAppointment.id,
                          'cancelled',
                          'Cancelled by staff'
                        )
                      }
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {selectedAppointment.status === 'confirmed' && (
                  <>
                    <Button
                      onClick={() =>
                        updateAppointmentStatus(
                          selectedAppointment.id,
                          'in_progress'
                        )
                      }
                      className="flex-1"
                    >
                      Start Appointment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateAppointmentStatus(
                          selectedAppointment.id,
                          'no_show',
                          'Customer did not show up'
                        )
                      }
                      className="flex-1"
                    >
                      Mark No Show
                    </Button>
                  </>
                )}

                {selectedAppointment.status === 'in_progress' && (
                  <Button
                    onClick={() =>
                      updateAppointmentStatus(
                        selectedAppointment.id,
                        'completed'
                      )
                    }
                    className="w-full"
                  >
                    Complete Appointment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
