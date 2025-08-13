import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createAuthenticatedClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthResult {
  user: any;
  supabaseWithAuth: SupabaseClient;
}

export async function withAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  // Verify user authentication
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please provide a valid JWT token' },
      { status: 401 }
    );
  }

  // Get JWT token
  const authorization = request.headers.get('authorization');
  const token = authorization?.replace('Bearer ', '') || '';

  // Create a client with user authentication
  const supabaseWithAuth = await createAuthenticatedClient(token);

  return {
    user,
    supabaseWithAuth,
  };
}

export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
