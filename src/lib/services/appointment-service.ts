import { BaseBusinessService } from './base-service';
import { supabaseAdmin } from '../supabase-admin';
import { format, addMinutes, parseISO } from 'date-fns';

export interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id?: string;
  business_id?: string;
  user_id?: string;
  customer_id: string;
  staff_id: string;
  appointment_type_id?: string;
  appointment_date: string; // Date in YYYY-MM-DD format
  start_time: string; // Time in HH:MM:SS format
  end_time: string; // Time in HH:MM:SS format
  duration_minutes?: number;
  title?: string;
  notes?: string;
  customer_notes?: string;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'rescheduled';
  booking_source?: string;
  booked_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffMember {
  id: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  job_types: string[];
  calendar_provider?: 'google' | 'outlook' | 'calendly' | 'none';
  provider_account_id?: string;
  working_hours?: any;
  timezone?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  staffId?: string;
  staffName?: string;
}

export class AppointmentService extends BaseBusinessService {
  readonly name = 'Appointment Service';

  protected logger = {
    info: (message: string, ...args: any[]) =>
      console.log(`[${this.name}]`, message, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[${this.name}]`, message, ...args),
    warn: (message: string, ...args: any[]) =>
      console.warn(`[${this.name}]`, message, ...args),
  };

  /**
   * Look up a customer by phone
   */
  async lookupCustomer(
    phone: string,
    userId?: string
  ): Promise<Customer | null> {
    try {
      // Normalize phone to E.164 format if not already
      const normalizedPhone = this.normalizePhone(phone);
      console.log(
        `[lookupCustomer] normalizedPhone: ${normalizedPhone}, userId: ${userId}`
      );

      let query = supabaseAdmin
        .from('customers')
        .select('*')
        .eq('phone', normalizedPhone);

      // Add user_id filter if provided
      if (userId) {
        console.log(`[lookupCustomer] Adding user_id filter: ${userId}`);
        query = query.eq('user_id', userId);
      } else {
        console.log(
          `[lookupCustomer] No userId provided, searching all customers`
        );
      }

      console.log(`[lookupCustomer] Executing query...`);
      const { data, error } = await query.single();

      if (error) {
        console.log(`[lookupCustomer] Query error:`, error);
        if (error.code !== 'PGRST116') {
          // PGRST116 = no rows found
          throw error;
        }
        console.log(`[lookupCustomer] No customer found (PGRST116)`);
        return null;
      }

      console.log(`[lookupCustomer] Found customer:`, data);
      return data;
    } catch (error) {
      this.logger.error('Error looking up customer:', error);
      throw error;
    }
  }

  /**
   * Create or update a customer record
   */
  async upsertCustomer(customer: Customer, userId?: string): Promise<Customer> {
    try {
      // First, get business_id from business_profiles table
      let business_id = null;
      if (userId) {
        console.log(
          `[upsertCustomer] Looking up business_id for user_id: ${userId}`
        );
        const { data: businessProfile, error: businessError } =
          await supabaseAdmin
            .from('business_profiles')
            .select('id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (businessError) {
          console.error(
            `[upsertCustomer] Error getting business_id:`,
            businessError
          );
          throw new Error(
            `Failed to get business profile: ${businessError.message}`
          );
        }

        business_id = businessProfile?.id;
        console.log(`[upsertCustomer] Found business_id: ${business_id}`);
      }

      // Normalize phone to E.164 format
      const normalizedCustomer = {
        ...customer,
        phone: this.normalizePhone(customer.phone),
        updated_at: new Date().toISOString(),
        user_id: userId, // Add user_id to customer record
        business_id: business_id, // Add business_id to customer record
      };

      // Check if customer exists by phone
      const existing = await this.lookupCustomer(
        normalizedCustomer.phone,
        userId
      );

      if (existing) {
        // Update existing customer
        const { data, error } = await supabaseAdmin
          .from('customers')
          .update({
            first_name: normalizedCustomer.first_name,
            last_name: normalizedCustomer.last_name,
            email: normalizedCustomer.email || existing.email,
            updated_at: normalizedCustomer.updated_at,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new customer
        const { data, error } = await supabaseAdmin
          .from('customers')
          .insert({
            ...normalizedCustomer,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      this.logger.error('Error upserting customer:', error);
      throw error;
    }
  }

  /**
   * Check if a customer has an existing appointment
   */
  async checkExistingAppointment(
    customerId: string
  ): Promise<Appointment | null> {
    try {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');

      const { data, error } = await supabaseAdmin
        .from('appointments')
        .select(
          `
          *,
          staff:staff_members(display_name),
          customer:customers(first_name, last_name)
        `
        )
        .eq('customer_id', customerId)
        .or(
          `appointment_date.gt.${today},and(appointment_date.eq.${today},start_time.gte.${currentTime})`
        )
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error checking existing appointment:', error);
      throw error;
    }
  }

  /**
   * Get staff members who can perform a specific job type
   */
  async getStaffForJobType(jobType: string): Promise<StaffMember[]> {
    try {
      console.log(
        `[getStaffForJobType] Looking for staff with job type: ${jobType}`
      );

      // First approach: Get all active staff and filter in application
      const { data: allStaff, error: staffError } = await supabaseAdmin
        .from('staff_members')
        .select('id, first_name, last_name, job_types')
        .eq('is_active', true);

      if (staffError) {
        console.error('[getStaffForJobType] Error fetching staff:', staffError);
        throw staffError;
      }

      // Filter staff who have this job type in their job_types array
      const filteredStaff = (allStaff || [])
        .filter(staff => {
          if (!staff.job_types || !Array.isArray(staff.job_types)) {
            return false;
          }
          return staff.job_types.includes(jobType);
        })
        .map(staff => ({
          ...staff,
          display_name:
            `${staff.first_name || ''} ${staff.last_name || ''}`.trim() ||
            'Staff Member',
        }));

      console.log(
        `[getStaffForJobType] Found ${filteredStaff.length} staff members`
      );

      // Log the first staff member to debug name fields
      if (filteredStaff.length > 0) {
        console.log('[getStaffForJobType] Sample staff data:', {
          id: filteredStaff[0].id,
          display_name: filteredStaff[0].display_name,
          first_name: filteredStaff[0].first_name,
          last_name: filteredStaff[0].last_name,
        });
      }

      return filteredStaff;
    } catch (error) {
      this.logger.error('Error getting staff for job type:', error);
      throw error;
    }
  }

  /**
   * Find available appointment openings
   */
  async findOpenings(params: {
    staffId?: string;
    jobType: string;
    durationMins?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TimeSlot[]> {
    try {
      const duration = params.durationMins || 30;
      const startDate = params.dateFrom
        ? parseISO(params.dateFrom)
        : new Date();
      const endDate = params.dateTo
        ? parseISO(params.dateTo)
        : addMinutes(startDate, 60 * 24 * 7); // Default to 7 days ahead

      // Get staff members
      let staffMembers: StaffMember[];
      if (params.staffId) {
        const { data, error } = await supabaseAdmin
          .from('staff_members')
          .select('id, first_name, last_name, job_types')
          .eq('id', params.staffId)
          .single();

        if (error) throw error;
        // Add display_name to the staff member
        const staffWithDisplayName = {
          ...data,
          display_name:
            `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
            'Staff Member',
        };
        staffMembers = [staffWithDisplayName];
      } else {
        staffMembers = await this.getStaffForJobType(params.jobType);
      }

      if (staffMembers.length === 0) {
        return [];
      }

      // Get existing appointments for these staff members
      const staffIds = staffMembers.map(s => s.id);
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data: appointments, error } = await supabaseAdmin
        .from('appointments')
        .select('staff_id, appointment_date, start_time, end_time')
        .in('staff_id', staffIds)
        .gte('appointment_date', startDateStr)
        .lte('appointment_date', endDateStr)
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      // Generate available time slots
      const slots: TimeSlot[] = [];

      for (const staff of staffMembers) {
        const staffAppointments =
          appointments?.filter(a => a.staff_id === staff.id) || [];
        const staffSlots = this.generateTimeSlots(
          staff,
          staffAppointments,
          startDate,
          endDate,
          duration
        );

        slots.push(...staffSlots);
      }

      // Sort by start time and limit to first 10 slots
      return slots.sort((a, b) => a.start.localeCompare(b.start)).slice(0, 10);
    } catch (error) {
      this.logger.error('Error finding openings:', error);
      throw error;
    }
  }

  /**
   * Book an appointment
   */
  async bookAppointment(params: {
    customerId: string;
    staffId: string;
    jobType: string;
    startsAt: string;
    durationMins?: number;
    userId?: string;
    businessId?: string;
  }): Promise<Appointment> {
    try {
      const duration = params.durationMins || 30;
      const startsAt = parseISO(params.startsAt);
      const endsAt = addMinutes(startsAt, duration);

      const appointmentDate = format(startsAt, 'yyyy-MM-dd');
      const startTime = format(startsAt, 'HH:mm:ss');
      const endTime = format(endsAt, 'HH:mm:ss');

      // Check if slot is still available
      const { data: conflicting, error: conflictError } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('staff_id', params.staffId)
        .eq('appointment_date', appointmentDate)
        .in('status', ['scheduled', 'confirmed'])
        .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

      if (conflictError) throw conflictError;

      if (conflicting && conflicting.length > 0) {
        throw new Error('This time slot is no longer available');
      }

      // Create the appointment
      const { data, error } = await supabaseAdmin
        .from('appointments')
        .insert({
          business_id: params.businessId,
          user_id: params.userId,
          customer_id: params.customerId,
          staff_id: params.staffId,
          appointment_type_id: params.jobType, // Using jobType as appointment_type_id
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration,
          status: 'scheduled',
          booking_source: 'retell',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Sync to calendar provider if configured
      await this.syncToCalendar(data);

      return data;
    } catch (error) {
      this.logger.error('Error booking appointment:', error);
      throw error;
    }
  }

  /**
   * Sync appointment to external calendar
   */
  private async syncToCalendar(appointment: Appointment): Promise<void> {
    try {
      // TODO: Implement calendar sync when calendar_provider field is available
      // For now, skip calendar sync as the fields don't exist in the database
      return;

      /* Future implementation when calendar fields are added:
      const { data: staff, error } = await supabaseAdmin
        .from('staff_members')
        .select('calendar_provider, provider_account_id, oauth_tokens')
        .eq('id', appointment.staff_id)
        .single();

      if (
        error ||
        !staff?.calendar_provider ||
        staff.calendar_provider === 'none'
      ) {
        return; // No calendar sync configured
      }

      switch (staff.calendar_provider) {
        case 'google':
          // await this.syncToGoogleCalendar(appointment, staff);
          break;
        case 'outlook':
          // await this.syncToOutlookCalendar(appointment, staff);
          break;
        case 'calendly':
          // await this.syncToCalendly(appointment, staff);
          break;
      }
      */
    } catch (error) {
      this.logger.error('Error syncing to calendar:', error);
      // Don't throw - calendar sync failure shouldn't fail the booking
    }
  }

  /**
   * Generate available time slots for a staff member
   */
  private generateTimeSlots(
    staff: StaffMember,
    appointments: any[],
    startDate: Date,
    endDate: Date,
    durationMins: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const workingHours = staff.working_hours || {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: null,
      sunday: null,
    };

    // Generate slots for each day
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayName = format(currentDate, 'EEEE').toLowerCase();
      const dayHours = workingHours[dayName];

      if (dayHours && dayHours.start && dayHours.end) {
        const [startHour, startMin] = dayHours.start.split(':').map(Number);
        const [endHour, endMin] = dayHours.end.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMin, 0, 0);

        while (slotStart < dayEnd) {
          const slotEnd = addMinutes(slotStart, durationMins);

          if (slotEnd <= dayEnd) {
            // Check if slot conflicts with existing appointments
            const slotDateStr = format(slotStart, 'yyyy-MM-dd');
            const slotStartTime = format(slotStart, 'HH:mm:ss');
            const slotEndTime = format(slotEnd, 'HH:mm:ss');

            const hasConflict = appointments.some(apt => {
              // Only check appointments on the same date
              if (apt.appointment_date !== slotDateStr) {
                return false;
              }

              // Compare times
              const aptStartTime = apt.start_time;
              const aptEndTime = apt.end_time;

              return (
                (slotStartTime >= aptStartTime && slotStartTime < aptEndTime) ||
                (slotEndTime > aptStartTime && slotEndTime <= aptEndTime) ||
                (slotStartTime <= aptStartTime && slotEndTime >= aptEndTime)
              );
            });

            if (!hasConflict && slotStart > new Date()) {
              slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                available: true,
                staffId: staff.id,
                staffName: staff.display_name,
              });
            }
          }

          slotStart = addMinutes(slotStart, 30); // Move to next 30-minute slot
        }
      }

      currentDate = addMinutes(currentDate, 60 * 24); // Next day
    }

    return slots;
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if missing (assuming US)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    // Add + prefix
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }
}
