import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  PatientSearchParams,
  PatientResponse,
  ErrorResponse,
  RetellFunctionResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
} from '@/types/clinic';

/**
 * Patient service for handling clinic patient operations
 */
export class PatientService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Search for individual patient by phone number
   */
  async searchByPhone(
    args: PatientSearchParams
  ): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
    // Only support querying individual patient by phone number
    if (!args.phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .schema('clinic')
      .from('patients')
      .select()
      .eq('phone', args.phone)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Database error:', error);

      // If no record found error, return 404 status code
      if (error.code === 'PGRST116') {
        return NextResponse.json({ result: { data: null } }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to query patient' },
        { status: 500 }
      );
    }

    const patientResponse: PatientResponse = { data };
    return NextResponse.json({
      result: patientResponse,
    });
  }

  /**
   * Create or update patient
   */
  async createOrUpdate(
    args: CreatePatientRequest | UpdatePatientRequest
  ): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
    // Check if patient ID is included, if so, it's an update operation
    const isUpdate = 'id' in args && args.id;

    console.log(`isUpdate ${isUpdate}`);
    if (isUpdate) {
      return this.updatePatient(args as UpdatePatientRequest & { id: string });
    } else {
      return this.createPatient(args as CreatePatientRequest);
    }
  }

  /**
   * Update existing patient
   */
  private async updatePatient(
    args: UpdatePatientRequest & { id: string }
  ): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
    const { id, ...updateData } = args;

    const { data, error } = await supabaseAdmin
      .schema('clinic')
      .from('patients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update patient' },
        { status: 500 }
      );
    }

    const patientResponse: PatientResponse = { data };
    return NextResponse.json({
      result: patientResponse,
    });
  }

  /**
   * Create new patient
   */
  private async createPatient(
    args: CreatePatientRequest
  ): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
    const createData = { ...args };
    delete createData.id;

    const patientData = {
      ...createData,
      user_id: this.userId,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .schema('clinic')
      .from('patients')
      .insert(patientData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create patient' },
        { status: 500 }
      );
    }

    const patientResponse: PatientResponse = { data };
    return NextResponse.json({
      result: patientResponse,
    });
  }
}
