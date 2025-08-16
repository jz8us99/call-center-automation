import { NextRequest } from 'next/server';

/**
 * Context passed to all function handlers
 */
export interface FunctionContext {
  userId: string;
  agentId: string;
  request?: NextRequest;
  call?: any;
  services?: FunctionServices;
}

/**
 * Available services for function handlers
 */
export interface FunctionServices {
  metaDataService?: any;
  appointmentService?: any;
  patientService?: any;
}

/**
 * Standard function handler type
 * All handlers must conform to this signature
 */
export type FunctionHandler = (
  args: Record<string, any>,
  context: FunctionContext
) => Promise<Record<string, any>>;

/**
 * Function registry entry
 */
export interface FunctionEntry {
  name: string;
  handler: FunctionHandler;
  description?: string;
  requiredServices?: string[];
}
