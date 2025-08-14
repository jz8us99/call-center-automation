import { NextRequest, NextResponse } from 'next/server';
import {
  getUserIdByAgentId,
  verifyRetellWebhook,
} from '@/lib/retell-webhook-utils';
import { PatientService } from '@/lib/services/patient-service';
import { MetaDataService } from '@/lib/services/metadata-service';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  PatientSearchParams,
  ErrorResponse,
  RetellFunctionCall,
  RetellFunctionResponse,
  CreatePatientRequest,
  UpdatePatientRequest,
  MetaDataRequest,
} from '@/types/clinic';

/**
 * Clinic function route handler
 */
async function handlePOST(
  request: NextRequest
): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
  try {
    // Verify webhook and get payload
    const verification = await verifyRetellWebhook(request);
    if (!verification.success) {
      return verification.error! as NextResponse<
        RetellFunctionResponse | ErrorResponse
      >;
    }

    const retellCall: RetellFunctionCall =
      verification.payload as unknown as RetellFunctionCall;

    // Get user_id from agent_id
    const agent_id = retellCall.call.agent_id!;

    let user_id: string;
    try {
      user_id = await getUserIdByAgentId(agent_id);
      console.log(` user_id ${user_id}`);
    } catch (error) {
      console.error('Failed to get user_id:', error);
      return NextResponse.json(
        { error: 'Failed to get user configuration' },
        { status: 400 }
      );
    }

    // Create services with admin Supabase client (no JWT auth needed for webhook)
    const patientService = new PatientService(user_id, supabaseAdmin);
    const metaDataService = new MetaDataService(
      user_id,
      agent_id,
      supabaseAdmin
    );

    // Route function call to appropriate handler
    switch (retellCall.name) {
      case 'get_patient_by_phone':
        return await patientService.searchByPhone(
          retellCall.args as PatientSearchParams
        );

      case 'create_or_update_patient':
        return await patientService.createOrUpdate(
          retellCall.args as CreatePatientRequest | UpdatePatientRequest
        );

      case 'get_meta_data':
        return await metaDataService.getMetaData(
          retellCall.args as MetaDataRequest,
          request
        );

      default:
        return NextResponse.json(
          {
            error: `Invalid function name: ${retellCall.name}. Supported functions: get_patient_by_phone, create_or_update_patient, get_meta_data`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Function execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handlePOST(request);
}
