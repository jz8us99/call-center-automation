import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  MetaDataRequest,
  MetaDataResponse,
  ErrorResponse,
  RetellFunctionResponse,
} from '@/types/clinic';
import { MetaDataQueries } from './db-queries';
import { MetaDataAggregator } from './aggregator';
import { MetaDataCache, HttpCacheHeaders } from './cache';

/**
 * MetaData service for handling clinic metadata operations
 * Enhanced with database integration and caching
 */
export class MetaDataService {
  private userId: string;
  private agentId: string;
  private supabase: SupabaseClient;
  private queries: MetaDataQueries;

  constructor(userId: string, agentId: string, supabase: SupabaseClient) {
    this.userId = userId;
    this.agentId = agentId;
    this.supabase = supabase;
    this.queries = new MetaDataQueries(supabase, userId);
  }

  /**
   * Get clinic metadata from database with caching
   */
  async getMetaData(
    _args?: MetaDataRequest,
    request?: Request
  ): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>> {
    const startTime = Date.now();

    try {
      // Validate userId before proceeding
      if (!this.userId || this.userId === 'undefined') {
        console.error('Invalid user_id provided:', this.userId);
        return NextResponse.json(
          { error: 'Invalid user configuration' },
          { status: 400 }
        );
      }

      // Check if no-cache header is present to bypass cache
      const cacheControl =
        request?.headers.get('Cache-Control') ||
        request?.headers.get('cache-control');
      const skipCache =
        cacheControl?.includes('no-cache') ||
        cacheControl?.includes('no-store');

      if (skipCache) {
        console.log(
          `Cache bypassed due to no-cache header for user: ${this.userId}`
        );
      } else {
        // Try to get from cache first
        const cacheKey = `${this.userId}-${this.agentId}`;
        const cachedData = await MetaDataCache.get(this.userId, this.agentId);

        if (cachedData) {
          console.log(`Cache hit for metadata: ${cacheKey}`);
          const responseTime = Date.now() - startTime;
          console.log(`Metadata served from cache (${responseTime}ms)`);

          return NextResponse.json(
            { result: cachedData },
            { headers: HttpCacheHeaders.getMetaDataHeaders() }
          );
        }

        console.log(
          `Cache miss for metadata: ${cacheKey}, fetching from database`
        );
      }

      const metaData = await MetaDataAggregator.aggregateMetaData(
        this.userId,
        this.agentId,
        this.queries
      );

      // Store in cache for future requests (unless skipCache is true)
      if (!skipCache) {
        await MetaDataCache.set(this.userId, metaData, this.agentId);
      }

      const responseTime = Date.now() - startTime;
      console.log(
        `Metadata generated and cached for user ${this.userId} (${responseTime}ms)`
      );

      return NextResponse.json(
        { result: metaData },
        { headers: HttpCacheHeaders.getMetaDataHeaders() }
      );
    } catch (error) {
      console.error('MetaData service error:', error);
      return this.handleError(error);
    }
  }

  /**
   * 刷新缓存的元数据
   */
  async refreshMetaData(): Promise<
    NextResponse<RetellFunctionResponse | ErrorResponse>
  > {
    try {
      // 清除缓存
      await MetaDataCache.invalidate(this.userId, this.agentId);

      // 重新获取数据
      return this.getMetaData();
    } catch (error) {
      console.error('Error refreshing metadata:', error);
      return this.handleError(error);
    }
  }

  /**
   * 获取详细的服务信息
   */
  async getDetailedServices(): Promise<NextResponse<any | ErrorResponse>> {
    try {
      const { jobTypes, businessServices, staffServices, appointmentTypes } =
        await this.queries.getAllMetaData();

      const detailedServices = MetaDataAggregator.generateDetailedServices(
        jobTypes,
        businessServices,
        staffServices,
        appointmentTypes
      );

      return NextResponse.json(
        { result: detailedServices },
        { headers: HttpCacheHeaders.getMetaDataHeaders(60, 120) } // 较短的缓存时间
      );
    } catch (error) {
      console.error('Error getting detailed services:', error);
      return this.handleError(error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<NextResponse<any | ErrorResponse>> {
    try {
      const cacheHealth = await MetaDataCache.healthCheck();
      const dbHealth = await this.testDatabaseConnection();

      const health = {
        status: cacheHealth && dbHealth ? 'healthy' : 'degraded',
        cache: cacheHealth ? 'ok' : 'error',
        database: dbHealth ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(
        { result: health },
        {
          headers: HttpCacheHeaders.getNoCacheHeaders(),
          status: health.status === 'healthy' ? 200 : 503,
        }
      );
    } catch (error) {
      console.error('Health check error:', error);
      return NextResponse.json(
        { error: 'Health check failed' },
        {
          headers: HttpCacheHeaders.getErrorHeaders(),
          status: 503,
        }
      );
    }
  }

  /**
   * 测试数据库连接
   */
  private async testDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('business_profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * 统一错误处理
   */
  private handleError(
    error: unknown
  ): NextResponse<RetellFunctionResponse | ErrorResponse> {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // 尝试提供降级数据
    const fallbackData = this.getFallbackMetaData();

    if (fallbackData) {
      console.warn('Returning fallback metadata due to error:', errorMessage);
      return NextResponse.json(
        { result: fallbackData },
        { headers: HttpCacheHeaders.getNoCacheHeaders() }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve metadata' },
      {
        headers: HttpCacheHeaders.getErrorHeaders(),
        status: 500,
      }
    );
  }

  /**
   * 获取降级数据
   */
  private getFallbackMetaData(): MetaDataResponse | null {
    // 提供基础的降级数据
    return {
      practice_name: 'Our Practice',
      location: '',
      phone: '',
      email: '',
      team: [],
      services: [{ id: 'fallback_service_1', name: 'General Services' }],
      hours: [
        'Monday: 9:00 AM to 5:00 PM',
        'Tuesday: 9:00 AM to 5:00 PM',
        'Wednesday: 9:00 AM to 5:00 PM',
        'Thursday: 9:00 AM to 5:00 PM',
        'Friday: 9:00 AM to 5:00 PM',
        'Saturday: Closed',
        'Sunday: Closed',
      ],
      insurance: [],
      emergency_info: '',
      user_id: this.userId,
      agent_id: this.agentId,
    };
  }
}
