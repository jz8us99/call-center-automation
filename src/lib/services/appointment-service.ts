import { BaseBusinessService } from './base-service';
import { supabase } from '../supabase';
import { format, addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';

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
  customer_id: string;
  staff_id: string;
  job_type: string;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  source: 'retell' | 'web' | 'manual';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffMember {
  id: string;
  display_name: string;
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
    info: (message: string, ...args: any[]) => console.log(`[${this.name}]`, message, ...args),
    error: (message: string, ...args: any[]) => console.error(`[${this.name}]`, message, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[${this.name}]`, message, ...args),
  };

  /**
   * Look up a customer by last name and phone
   */
  async lookupCustomer(lastName: string, phone: string): Promise<Customer | null> {
    try {
      // Normalize phone to E.164 format if not already
      const normalizedPhone = this.normalizePhone(phone);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('last_name', lastName)
        .eq('phone', normalizedPhone)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error looking up customer:', error);
      throw error;
    }
  }

  /**
   * Create or update a customer record
   */
  async upsertCustomer(customer: Customer): Promise<Customer> {
    try {
      // Normalize phone to E.164 format
      const normalizedCustomer = {
        ...customer,
        phone: this.normalizePhone(customer.phone),
        updated_at: new Date().toISOString()
      };

      // Check if customer exists by phone
      const existing = await this.lookupCustomer(
        normalizedCustomer.last_name, 
        normalizedCustomer.phone
      );

      if (existing) {
        // Update existing customer
        const { data, error } = await supabase
          .from('customers')
          .update({
            first_name: normalizedCustomer.first_name,
            last_name: normalizedCustomer.last_name,
            email: normalizedCustomer.email || existing.email,
            updated_at: normalizedCustomer.updated_at
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert({
            ...normalizedCustomer,
            created_at: new Date().toISOString()
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
  async checkExistingAppointment(customerId: string): Promise<Appointment | null> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          staff:staff_members(display_name),
          customer:customers(first_name, last_name)
        `)
        .eq('customer_id', customerId)
        .gte('starts_at', now)
        .in('status', ['scheduled', 'confirmed'])
        .order('starts_at', { ascending: true })
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
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .contains('job_types', [jobType])
        .eq('is_active', true);

      if (error) throw error;

      return data || [];
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
      const startDate = params.dateFrom ? parseISO(params.dateFrom) : new Date();
      const endDate = params.dateTo 
        ? parseISO(params.dateTo) 
        : addMinutes(startDate, 60 * 24 * 7); // Default to 7 days ahead

      // Get staff members
      let staffMembers: StaffMember[];
      if (params.staffId) {
        const { data, error } = await supabase
          .from('staff_members')
          .select('*')
          .eq('id', params.staffId)
          .single();
        
        if (error) throw error;
        staffMembers = [data];
      } else {
        staffMembers = await this.getStaffForJobType(params.jobType);
      }

      if (staffMembers.length === 0) {
        return [];
      }

      // Get existing appointments for these staff members
      const staffIds = staffMembers.map(s => s.id);
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('staff_id, starts_at, ends_at')
        .in('staff_id', staffIds)
        .gte('starts_at', startDate.toISOString())
        .lte('starts_at', endDate.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) throw error;

      // Generate available time slots
      const slots: TimeSlot[] = [];
      
      for (const staff of staffMembers) {
        const staffAppointments = appointments?.filter(a => a.staff_id === staff.id) || [];
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
      return slots
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 10);
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
  }): Promise<Appointment> {
    try {
      const duration = params.durationMins || 30;
      const startsAt = parseISO(params.startsAt);
      const endsAt = addMinutes(startsAt, duration);

      // Check if slot is still available
      const { data: conflicting, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('staff_id', params.staffId)
        .in('status', ['scheduled', 'confirmed'])
        .or(`and(starts_at.lt.${endsAt.toISOString()},ends_at.gt.${startsAt.toISOString()})`);

      if (conflictError) throw conflictError;
      
      if (conflicting && conflicting.length > 0) {
        throw new Error('This time slot is no longer available');
      }

      // Create the appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          customer_id: params.customerId,
          staff_id: params.staffId,
          job_type: params.jobType,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: 'scheduled',
          source: 'retell',
          created_at: new Date().toISOString()
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
      // Get staff member's calendar configuration
      const { data: staff, error } = await supabase
        .from('staff_members')
        .select('calendar_provider, provider_account_id, oauth_tokens')
        .eq('id', appointment.staff_id)
        .single();

      if (error || !staff?.calendar_provider || staff.calendar_provider === 'none') {
        return; // No calendar sync configured
      }

      // TODO: Implement calendar sync based on provider
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
      sunday: null
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
            const hasConflict = appointments.some(apt => {
              const aptStart = parseISO(apt.starts_at);
              const aptEnd = parseISO(apt.ends_at);
              return (
                (slotStart >= aptStart && slotStart < aptEnd) ||
                (slotEnd > aptStart && slotEnd <= aptEnd) ||
                (slotStart <= aptStart && slotEnd >= aptEnd)
              );
            });

            if (!hasConflict && slotStart > new Date()) {
              slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                available: true,
                staffId: staff.id,
                staffName: staff.display_name
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