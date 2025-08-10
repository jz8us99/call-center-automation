/**
 * Clinic business service
 * Specifically handles clinic-related business logic and appointment management
 */

import { BaseBusinessService } from './base-service';
import { CallAnalyzedData, MessageType } from '../message-system/message-types';
import { supabaseAdmin } from '../supabase-admin';

/**
 * Clinic appointment service - Handles clinic-related appointments and business logic
 */
export class ClinicAppointmentService extends BaseBusinessService {
  readonly name = 'Clinic Appointment Service';

  constructor() {
    super();
    // Set service capabilities
    this.setCapabilities({
      businessTypes: ['clinic'], // Only handle clinic business
      messageTypes: [MessageType.CALL_ANALYZED],
    });
  }

  async initialize(): Promise<void> {
    console.log('Initializing clinic appointment service...');
    // Initialize appointment system connection
    console.log('Clinic appointment service initialization completed');
  }

  // Custom filter: only handle calls with appointment information
  shouldHandle(data: CallAnalyzedData): boolean {
    const appointmentFlag =
      data.call.call_analysis?.custom_analysis_data?.appointment_made_flag ?? 0;
    console.log(`shouldHandle ${appointmentFlag}`);
    return appointmentFlag === 1;
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    console.log(
      `Clinic appointment service processing call: ${data.call.call_id}`
    );

    const analysisData = data.call.call_analysis?.custom_analysis_data;
    if (analysisData) {
      const appointmentDateTime = analysisData.appointment_date_time;
      const reasonForVisit = analysisData.reason_for_visit;

      console.log(
        `Creating clinic appointment: time=${appointmentDateTime}, reason=${reasonForVisit}`
      );

      try {
        // Actual appointment creation logic
        await this.saveAppointment({
          user_id: data.userId,
          call_log_id: data.callLogId,
          date_time: appointmentDateTime,
          reason_for_visit: reasonForVisit,
          status: 'scheduled',
        });

        console.log(
          `Successfully created appointment for call: ${data.call.call_id}`
        );
      } catch (error) {
        console.error(
          `Failed to create appointment for call ${data.call.call_id}:`,
          error
        );
      }
    }
  }

  private async saveAppointment(appointmentData: {
    user_id: string;
    call_log_id?: string;
    date_time?: string;
    reason_for_visit?: string;
    status: string;
  }): Promise<void> {
    const { data, error } = await supabaseAdmin
      .schema('clinic')
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      console.error('Failed to save appointment to database:', error);
      throw error;
    }

    console.log('Appointment saved successfully:', data);
  }
}

// Auto-instantiate service (this will trigger auto-registration)
export const clinicAppointmentService = new ClinicAppointmentService();
