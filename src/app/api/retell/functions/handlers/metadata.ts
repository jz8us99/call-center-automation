import { FunctionContext } from '../types';
import { MetaDataService } from './metadata/service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Handle get_meta_data function
 */
export async function handleGetMetaData(
  args: Record<string, any>,
  context: FunctionContext
): Promise<Record<string, any>> {
  const metaDataService = new MetaDataService(
    context.userId,
    context.agentId,
    supabaseAdmin
  );

  const response = await metaDataService.getMetaData(args, context.request);
  const data = await response.json();

  // Return the result directly without NextResponse wrapper
  return data.result || data;
}
