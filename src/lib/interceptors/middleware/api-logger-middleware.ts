import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '../api-logger';
import { interceptorConfig } from '../config';

/**
 * API logger middleware
 * Logs API requests in middleware layer (response logging requires route-level integration)
 */
export async function apiLoggerMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Log request in middleware
    await logApiRequest(request);
    return NextResponse.next();
  } catch (error) {
    console.error('API logger middleware error:', error);
    // If logging fails, don't affect request execution
    return NextResponse.next();
  }
}

/**
 * Determine if API logging should be performed
 */
export function shouldLogApi(pathname: string): boolean {
  const config = interceptorConfig.apiLogger;

  // Check if API logging is enabled
  if (!config.enabled) {
    return false;
  }

  // Check excluded paths
  if (config.excludePaths.some(path => pathname.startsWith(path))) {
    return false;
  }

  // Check if path matches included paths
  return config.includePaths.some(path => pathname.startsWith(path));
}

/**
 * Enhanced API request logging
 * Used to log detailed request information in middleware
 */
export async function logApiRequest(request: NextRequest): Promise<void> {
  try {
    const config = interceptorConfig.apiLogger;
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;

    console.log(`[API Logger] ${timestamp} ${method} ${url}`);

    // Log headers (excluding sensitive information)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (
        !key.toLowerCase().includes('authorization') &&
        !key.toLowerCase().includes('cookie') &&
        !key.toLowerCase().includes('token')
      ) {
        headers[key] = value;
      }
    });

    if (config.logLevel === 'detailed') {
      console.log(`[API Logger] Headers:`, headers);

      // Log request body for detailed logging
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const clonedRequest = request.clone();
          const contentType = request.headers.get('content-type') || '';

          let body: unknown = null;
          if (contentType.includes('application/json')) {
            body = await clonedRequest.json();
          } else if (
            contentType.includes('application/x-www-form-urlencoded')
          ) {
            const formData = await clonedRequest.formData();
            body = Object.fromEntries(formData.entries());
          } else if (contentType.includes('text/')) {
            body = await clonedRequest.text();
          }

          if (body !== null) {
            console.log(
              `[API Logger] Request Body:`,
              typeof body === 'object' ? JSON.stringify(body, null, 2) : body
            );
          }
        } catch {
          console.log(`[API Logger] Request Body: [Unable to parse]`);
        }
      }
    } else {
      // Basic logging - just show main headers
      console.log(
        `[API Logger] Content-Type: ${headers['content-type'] || 'N/A'}`
      );
      console.log(`[API Logger] User-Agent: ${headers['user-agent'] || 'N/A'}`);
    }
  } catch (error) {
    console.error('Error logging API request:', error);
  }
}

/**
 * Log API response (to be called manually in route handlers)
 */
export function logApiResponse(
  response: NextResponse,
  startTime?: number
): NextResponse {
  try {
    const config = interceptorConfig.apiLogger;
    if (config.logLevel !== 'detailed') return response;

    const timestamp = new Date().toISOString();
    const responseTime = startTime ? Date.now() - startTime : 0;

    console.log(
      `[API Logger] Response ${timestamp} - Status: ${response.status}`
    );
    console.log(`[API Logger] Response Time: ${responseTime}ms`);

    // Clone response to read body
    if (response.body) {
      response
        .clone()
        .text()
        .then(body => {
          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const jsonBody = JSON.parse(body);
              console.log(
                `[API Logger] Response Body:`,
                JSON.stringify(jsonBody, null, 2)
              );
            } else {
              console.log(`[API Logger] Response Body:`, body);
            }
          } catch {
            console.log(`[API Logger] Response Body: [Unable to parse]`);
          }
        })
        .catch(() => {
          console.log(`[API Logger] Response Body: [Unable to read]`);
        });
    }

    return response;
  } catch (error) {
    console.error('Error logging API response:', error);
    return response;
  }
}
