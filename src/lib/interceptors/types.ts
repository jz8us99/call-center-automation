import { NextRequest, NextResponse } from 'next/server';

// 请求日志类型
export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
}

// 响应日志类型
export interface ResponseLog {
  timestamp: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: unknown;
  responseTime: number;
}

// API日志类型
export interface ApiLog {
  request: RequestLog;
  response: ResponseLog;
}

// 拦截器基础接口
export interface BaseInterceptor {
  name: string;
  description: string;
}

// API日志拦截器接口
export interface ApiLoggerInterceptor extends BaseInterceptor {
  intercept<T extends NextResponse>(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<T>
  ): Promise<T>;
}

// 权限拦截器接口
export interface AuthInterceptor extends BaseInterceptor {
  checkPermission(
    request: NextRequest
  ): Promise<{ success: boolean; error?: string; status?: number }>;
}
