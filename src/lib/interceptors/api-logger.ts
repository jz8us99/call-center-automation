import { NextRequest, NextResponse } from 'next/server';
import { RequestLog, ResponseLog, ApiLog, ApiLoggerInterceptor } from './types';

/**
 * API logger interceptor
 * Specifically used to record detailed information of all API requests and responses
 */
export class ApiLogger implements ApiLoggerInterceptor {
  public readonly name = 'ApiLogger';
  public readonly description = 'API request and response logger';
  private static instance: ApiLogger;

  private constructor() {}

  public static getInstance(): ApiLogger {
    if (!ApiLogger.instance) {
      ApiLogger.instance = new ApiLogger();
    }
    return ApiLogger.instance;
  }

  /**
   * Log request information
   */
  private async logRequest(request: NextRequest): Promise<RequestLog> {
    const url = new URL(request.url);
    const timestamp = new Date().toISOString();

    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Extract query parameters
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    // Try to read body (only for POST, PUT, PATCH requests)
    let body: unknown = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const clonedRequest = request.clone();
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          body = await clonedRequest.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await clonedRequest.formData();
          body = Object.fromEntries(formData.entries());
        } else if (contentType.includes('text/')) {
          body = await clonedRequest.text();
        }
      } catch {
        body = '[Unable to parse request body]';
      }
    }

    const requestLog: RequestLog = {
      timestamp,
      method: request.method,
      url: request.url,
      headers,
      query,
      body,
    };

    return requestLog;
  }

  /**
   * Log response information
   */
  private async logResponse(
    response: Response,
    startTime: number
  ): Promise<ResponseLog> {
    const timestamp = new Date().toISOString();
    const responseTime = Date.now() - startTime;

    // Extract response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Try to read response body
    let body: unknown = null;
    try {
      const clonedResponse = response.clone();
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        body = await clonedResponse.json();
      } else if (contentType.includes('text/')) {
        body = await clonedResponse.text();
      }
    } catch {
      body = '[Unable to parse response body]';
    }

    const responseLog: ResponseLog = {
      timestamp,
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      responseTime,
    };

    return responseLog;
  }

  /**
   * Format and print API logs
   */
  private printApiLog(apiLog: ApiLog): void {
    const { request, response } = apiLog;

    console.log('\n================== API Request Log ==================');
    console.log(`📞 ${request.method} ${request.url}`);
    console.log(`🕒 Request time: ${request.timestamp}`);

    // Print request headers
    console.log('\n📋 Request Headers:');
    Object.entries(request.headers).forEach(([key, value]) => {
      // Sensitive information masking
      if (
        key.toLowerCase().includes('authorization') ||
        key.toLowerCase().includes('cookie') ||
        key.toLowerCase().includes('token')
      ) {
        console.log(`  ${key}: [Hidden]`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    // Print query parameters
    if (Object.keys(request.query).length > 0) {
      console.log('\n🔍 Query Parameters:');
      Object.entries(request.query).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    // Print request body
    if (request.body !== null && request.body !== undefined) {
      console.log('\n📦 Request Body:');
      if (typeof request.body === 'object') {
        console.log(JSON.stringify(request.body, null, 2));
      } else {
        console.log(request.body);
      }
    }

    console.log('\n================== API Response Log ==================');
    console.log(`🎯 Status code: ${response.status} ${response.statusText}`);
    console.log(`🕒 Response time: ${response.timestamp}`);
    console.log(`⏱️  Processing time: ${response.responseTime}ms`);

    // Print response headers
    console.log('\n📋 Response Headers:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Print response body
    if (response.body !== null && response.body !== undefined) {
      console.log('\n📦 Response Body:');
      if (typeof response.body === 'object') {
        console.log(JSON.stringify(response.body, null, 2));
      } else {
        console.log(response.body);
      }
    }

    console.log('\n================================================\n');
  }

  /**
   * Main interceptor method
   * Wraps API handler functions to automatically log requests and responses
   */
  public async intercept<T extends NextResponse>(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Log request information
      const requestLog = await this.logRequest(request);

      // Execute original handler function
      const response = await handler(request);

      // Log response information
      const responseLog = await this.logResponse(response, startTime);

      // Combine and print complete log
      const apiLog: ApiLog = {
        request: requestLog,
        response: responseLog,
      };

      this.printApiLog(apiLog);

      return response;
    } catch (error) {
      // Even if processing errors occur, log error response
      const requestLog = await this.logRequest(request);

      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );

      const responseLog = await this.logResponse(errorResponse, startTime);

      const apiLog: ApiLog = {
        request: requestLog,
        response: responseLog,
      };

      this.printApiLog(apiLog);

      // Re-throw error
      throw error;
    }
  }
}

/**
 * Convenient method to get API logger interceptor instance
 */
export const apiLogger = ApiLogger.getInstance();

/**
 * Decorator-style API logger interceptor function
 * Usage:
 * export async function GET(request: NextRequest) {
 *   return withApiLogger(request, async (req) => {
 *     // Your API logic
 *     return NextResponse.json({ message: 'Hello' });
 *   });
 * }
 */
export async function withApiLogger<T extends NextResponse>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<T>
): Promise<T> {
  return apiLogger.intercept(request, handler);
}
