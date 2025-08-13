'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@/components/icons';

interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  color_code: string;
  booking_instructions: string;
}

interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  staff_id: string;
  staff_name: string;
  staff_title: string;
  appointment_type_id: string;
  price: number;
}

interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  note?: string;
}

interface AppointmentBookingInterfaceProps {
  businessId: string;
  businessName: string;
  onBookingComplete?: (appointmentId: string) => void;
  onBookingCancel?: () => void;
}

type BookingStep =
  | 'service'
  | 'datetime'
  | 'customer'
  | 'confirmation'
  | 'complete';

export function AppointmentBookingInterface({
  businessId,
  businessName,
  onBookingComplete,
  onBookingCancel,
}: AppointmentBookingInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [loading, setLoading] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    []
  );
  const [availableSlots, setAvailableSlots] = useState<{
    [date: string]: TimeSlot[];
  }>({});
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string>('');

  const [customerForm, setCustomerForm] = useState<Customer>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    note: '',
  });

  useEffect(() => {
    loadAppointmentTypes();
  }, [businessId]);

  useEffect(() => {
    if (selectedType && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedType, selectedDate, businessId]);

  const loadAppointmentTypes = async () => {
    setLoading(true);
    try {
      const response = await AuthenticatedApiClient.get(
        `/api/appointment-types?business_id=${businessId}&is_active=true&online_booking_enabled=true`
      );
      if (response.ok) {
        const data = await response.json();
        setAppointmentTypes(data.appointment_types || []);
      }
    } catch (error) {
      console.error('Failed to load appointment types:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedType || !selectedDate) return;

    setLoading(true);
    try {
      const response = await AuthenticatedApiClient.get(
        `/api/business/available-time-slots?business_id=${businessId}&date=${selectedDate}&appointment_type_id=${selectedType.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots_by_date || {});
      }
    } catch (error) {
      console.error('Failed to load available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDates = (startDate: Date) => {
    const dates = [];
    const start = new Date(startDate);
    // Get Monday of the week
    const monday = new Date(
      start.setDate(start.getDate() - start.getDay() + 1)
    );

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleServiceSelect = (type: AppointmentType) => {
    setSelectedType(type);
    setCurrentStep('datetime');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('customer');
  };

  const handleCustomerSubmit = async () => {
    if (!selectedSlot || !selectedType) return;

    setLoading(true);
    try {
      // First, create or find the customer
      let customerId = '';

      // Try to find existing customer by email (if provided)
      if (customerForm.email) {
        const customerSearchResponse = await AuthenticatedApiClient.get(
          `/api/customers?business_id=${businessId}&search=${customerForm.email}`
        );

        if (customerSearchResponse.ok) {
          const customerData = await customerSearchResponse.json();
          const existingCustomer = customerData.customers.find(
            (c: any) =>
              c.email?.toLowerCase() === customerForm.email?.toLowerCase()
          );

          if (existingCustomer) {
            customerId = existingCustomer.id;
          }
        }
      }

      if (!customerId) {
        // Create new customer
        const createCustomerResponse = await AuthenticatedApiClient.post(
          '/api/customers',
          {
            business_id: businessId,
            user_id: businessId, // Assuming business_id maps to user_id
            ...customerForm,
          }
        );

        if (createCustomerResponse.ok) {
          const customerData = await createCustomerResponse.json();
          customerId = customerData.customer.id;
        } else {
          throw new Error('Failed to create customer');
        }
      }

      // Create the appointment
      const appointmentResponse = await AuthenticatedApiClient.post(
        '/api/appointments',
        {
          business_id: businessId,
          user_id: businessId, // Assuming business_id maps to user_id
          customer_id: customerId,
          staff_id: selectedSlot.staff_id,
          appointment_type_id: selectedType.id,
          appointment_date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          duration_minutes: selectedSlot.duration_minutes,
          title: `${selectedType.name} - ${customerForm.first_name} ${customerForm.last_name}`,
          customer_notes: customerForm.note || '',
          booking_source: 'online',
        }
      );

      if (appointmentResponse.ok) {
        const appointmentData = await appointmentResponse.json();
        setCreatedAppointmentId(appointmentData.appointment.id);
        setCurrentStep('complete');

        if (onBookingComplete) {
          onBookingComplete(appointmentData.appointment.id);
        }
      } else {
        const errorData = await appointmentResponse.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Failed to create appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setCurrentStep('service');
    setSelectedType(null);
    setSelectedSlot(null);
    setSelectedDate('');
    setCustomerForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      note: '',
    });
    setCreatedAppointmentId('');
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'service', label: 'Service', icon: '1' },
      { key: 'datetime', label: 'Date & Time', icon: '2' },
      { key: 'customer', label: 'Your Info', icon: '3' },
      { key: 'complete', label: 'Complete', icon: '✓' },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted =
            (step.key === 'service' && currentStep !== 'service') ||
            (step.key === 'datetime' &&
              !['service', 'datetime'].includes(currentStep)) ||
            (step.key === 'customer' && currentStep === 'complete');

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.icon}
              </div>
              <span className={`ml-2 text-sm ${isActive ? 'font-bold' : ''}`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 mx-4" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && appointmentTypes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking options...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Book an Appointment</CardTitle>
          <CardDescription>
            Schedule your appointment with {businessName}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {renderStepIndicator()}

          {currentStep === 'service' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select a Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointmentTypes.map(type => (
                  <Card
                    key={type.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                    onClick={() => handleServiceSelect(type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{type.name}</h4>
                        {type.price && (
                          <Badge variant="secondary">${type.price}</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {type.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {type.duration_minutes} minutes
                      </div>
                      {type.booking_instructions && (
                        <p className="text-xs text-blue-600 mt-2">
                          {type.booking_instructions}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'datetime' && selectedType && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Select Date & Time for {selectedType.name}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('service')}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentWeek(
                      new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
                    )
                  }
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {currentWeek.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentWeek(
                      new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
                    )
                  }
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {getWeekDates(currentWeek).map((date, index) => {
                  const dateStr = formatDate(date);
                  const isSelected = selectedDate === dateStr;
                  const isPast = date < new Date();

                  return (
                    <Button
                      key={index}
                      variant={isSelected ? 'default' : 'outline'}
                      className="h-16 flex flex-col"
                      disabled={isPast}
                      onClick={() => handleDateSelect(dateStr)}
                    >
                      <span className="text-xs">
                        {formatDisplayDate(date).split(' ')[0]}
                      </span>
                      <span className="text-lg font-bold">
                        {formatDisplayDate(date).split(' ')[2]}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h4 className="font-medium mb-3">
                    Available Times for {selectedDate}
                  </h4>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">
                        Loading available times...
                      </p>
                    </div>
                  ) : availableSlots[selectedDate] &&
                    availableSlots[selectedDate].length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {availableSlots[selectedDate].map((slot, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-12 text-sm"
                          onClick={() => handleSlotSelect(slot)}
                        >
                          <div className="text-center">
                            <div className="font-medium">
                              {slot.start_time.substring(0, 5)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {slot.staff_name.split(' ')[0]}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No available times for this date</p>
                      <p className="text-sm">Please select a different date</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 'customer' && selectedSlot && selectedType && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep('datetime')}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>

              {/* Appointment Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Appointment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium">{selectedType.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">
                        {new Date(selectedSlot.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">
                        {selectedSlot.start_time.substring(0, 5)} -{' '}
                        {selectedSlot.end_time.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff:</span>
                      <span className="font-medium">
                        {selectedSlot.staff_name}
                      </span>
                    </div>
                    {selectedSlot.price && (
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">
                          ${selectedSlot.price}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={customerForm.first_name}
                    onChange={e =>
                      setCustomerForm(prev => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={customerForm.last_name}
                    onChange={e =>
                      setCustomerForm(prev => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerForm.phone}
                    onChange={e =>
                      setCustomerForm(prev => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerForm.email || ''}
                    onChange={e =>
                      setCustomerForm(prev => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={customerForm.note || ''}
                  onChange={e =>
                    setCustomerForm(prev => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Any additional information or notes"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCustomerSubmit}
                disabled={
                  loading ||
                  !customerForm.first_name ||
                  !customerForm.last_name ||
                  !customerForm.phone
                }
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Booking Appointment...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Appointment Booked Successfully!
                </h3>
                <p className="text-gray-600">
                  Your appointment has been confirmed. You will receive a
                  confirmation email shortly.
                </p>
              </div>

              {selectedSlot && selectedType && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Appointment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Confirmation #:</span>
                        <span className="font-mono font-medium">
                          {createdAppointmentId.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-medium">{selectedType.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">
                          {new Date(selectedSlot.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">
                          {selectedSlot.start_time.substring(0, 5)} -{' '}
                          {selectedSlot.end_time.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Staff:</span>
                        <span className="font-medium">
                          {selectedSlot.staff_name}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 justify-center">
                <Button onClick={resetBooking} variant="outline">
                  Book Another Appointment
                </Button>
                {onBookingCancel && (
                  <Button onClick={onBookingCancel}>Close</Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
