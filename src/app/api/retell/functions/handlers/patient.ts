import { FunctionContext } from '../types';
import { PatientService } from '@/lib/services/patient-service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Handle get_patient_by_phone function
 */
export async function handleGetPatientByPhone(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  const patientService = new PatientService(context.userId, supabaseAdmin);
  const response = await patientService.searchByPhone(args);
  const data = await response.json();

  // Return the result directly without NextResponse wrapper
  return data.result || data;
}

/**
 * Handle create_or_update_patient function
 */
export async function handleCreateOrUpdatePatient(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  const patientService = new PatientService(context.userId, supabaseAdmin);
  const response = await patientService.createOrUpdate(args);
  const data = await response.json();

  // Return the result directly without NextResponse wrapper
  return data.result || data;
}
