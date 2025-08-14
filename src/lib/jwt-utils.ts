import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export interface SupabaseJWTPayload {
  sub: string; // This is the auth user id, not necessarily the user_id we want
  email?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  role?: string;
  user_metadata?: {
    sub?: string; // This is the actual user_id we need
    email?: string;
    email_verified?: boolean;
    full_name?: string;
    phone_verified?: boolean;
    [key: string]: any;
  };
  app_metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

/**
 * Extract user_id from Supabase JWT token
 * @param request Next.js request object
 * @returns user_id string or null if not found/invalid
 */
export async function extractUserIdFromJWT(
  request: NextRequest
): Promise<string | null> {
  try {
    // Get token from Authorization header
    const authorization = request.headers.get('authorization');
    console.log(`Authorization header present: ${!!authorization}`);
    if (!authorization) {
      console.log('No authorization header found');
      return null;
    }

    const token = authorization.replace('Bearer ', '');
    if (!token) {
      console.log('No token found in authorization header');
      return null;
    }

    // Get Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET environment variable is missing');
      return null;
    }

    // Verify and decode JWT
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Extract user_id from user_metadata.sub (the actual user_id we need)
    // Fallback to top-level sub if user_metadata.sub is not available
    const supabasePayload = payload as unknown as SupabaseJWTPayload;
    const userId =
      supabasePayload.user_metadata?.sub || supabasePayload.sub || null;

    console.log(`JWT payload sub: ${supabasePayload.sub}`);
    console.log(`JWT user_metadata.sub: ${supabasePayload.user_metadata?.sub}`);
    console.log(`Extracted user_id from JWT: ${userId}`);

    return userId;
  } catch (error) {
    console.error('Failed to extract user_id from JWT:', error);
    return null;
  }
}

/**
 * Extract full JWT payload from Supabase JWT token
 * @param request Next.js request object
 * @returns JWT payload or null if invalid
 */
export async function extractJWTPayload(
  request: NextRequest
): Promise<SupabaseJWTPayload | null> {
  try {
    // Get token from Authorization header
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return null;
    }

    const token = authorization.replace('Bearer ', '');
    if (!token) {
      return null;
    }

    // Get Supabase JWT secret
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET environment variable is missing');
      return null;
    }

    // Verify and decode JWT
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    return payload as unknown as SupabaseJWTPayload;
  } catch (error) {
    console.error('Failed to extract JWT payload:', error);
    return null;
  }
}

/**
 * Check if user has permission to access resource
 * @param userIdFromJWT user_id from JWT token
 * @param resourceUserId user_id of the resource being accessed
 * @returns true if user can access the resource
 */
export function hasPermission(
  userIdFromJWT: string,
  resourceUserId?: string
): boolean {
  // If no resource user ID specified, allow access (for global resources)
  if (!resourceUserId) {
    return true;
  }

  // User can only access their own resources
  return userIdFromJWT === resourceUserId;
}
