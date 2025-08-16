import { functionRegistry } from '../registry';
import { handleGetMetaData } from './metadata';
import {
  handleCheckExistingAppointment,
  handleGetStaffOptions,
  handleFindOpenings,
  handleBookAppointment,
  handleHandoffToAgent,
} from './appointment';
import { handleLookupCustomer, handleUpsertCustomer } from './customer';
import {
  handleGetPatientByPhone,
  handleCreateOrUpdatePatient,
} from './patient';

/**
 * Initialize and register all function handlers
 */
export function initializeFunctions(): void {
  // Register metadata functions
  functionRegistry.register({
    name: 'get_meta_data',
    handler: handleGetMetaData,
    description: 'Get business metadata information',
  });

  // Register customer functions
  functionRegistry.register({
    name: 'lookup_customer',
    handler: handleLookupCustomer,
    description: 'Look up customer by phone number',
  });

  functionRegistry.register({
    name: 'upsert_customer',
    handler: handleUpsertCustomer,
    description: 'Create or update customer profile',
  });

  // Register appointment functions
  functionRegistry.register({
    name: 'check_existing_appointment',
    handler: handleCheckExistingAppointment,
    description: 'Check for existing appointments',
  });

  functionRegistry.register({
    name: 'get_staff_options_for_job_type',
    handler: handleGetStaffOptions,
    description: 'Get available staff for a service type',
  });

  functionRegistry.register({
    name: 'find_openings',
    handler: handleFindOpenings,
    description: 'Find available appointment slots',
  });

  functionRegistry.register({
    name: 'book_appointment',
    handler: handleBookAppointment,
    description: 'Book an appointment',
  });

  functionRegistry.register({
    name: 'handoff_to_agent',
    handler: handleHandoffToAgent,
    description: 'Transfer call to another agent',
  });

  // Register patient functions
  functionRegistry.register({
    name: 'get_patient_by_phone',
    handler: handleGetPatientByPhone,
    description: 'Get patient information by phone number',
  });

  functionRegistry.register({
    name: 'create_or_update_patient',
    handler: handleCreateOrUpdatePatient,
    description: 'Create or update patient information',
  });
}

// Initialize on module load
initializeFunctions();
