import { kv } from '@vercel/kv';
import { MetaDataResponse } from '@/types/clinic';

/**
 * 元数据缓存管理类
 * 使用Vercel KV进行缓存存储
 * 使用Hash结构：一个user一个key，agent_id作为field
 */
export class MetaDataCache {
  private static readonly CACHE_PREFIX = 'metadata';
  private static readonly DEFAULT_TTL = 900; // 15分钟
  private static readonly DEFAULT_AGENT_ID = 'default'; // 默认agent ID

  /**
   * 生成用户缓存键
   */
  private static getUserCacheKey(userId: string): string {
    return `${this.CACHE_PREFIX}:${userId}`;
  }

  /**
   * 获取agent field名称
   */
  private static getAgentField(agentId?: string): string {
    return agentId || this.DEFAULT_AGENT_ID;
  }

  /**
   * 获取缓存的元数据
   */
  static async get(
    userId: string,
    agentId?: string
  ): Promise<MetaDataResponse | null> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const field = this.getAgentField(agentId);

      const cached = await kv.hget<MetaDataResponse>(cacheKey, field);

      if (cached) {
        console.log(`Cache hit for metadata: ${cacheKey}[${field}]`);
        return cached;
      }

      console.log(`Cache miss for metadata: ${cacheKey}[${field}]`);
      return null;
    } catch (error) {
      console.error('Error getting metadata from cache:', error);
      return null;
    }
  }

  /**
   * 设置元数据缓存
   */
  static async set(
    userId: string,
    metadata: MetaDataResponse,
    agentId?: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<boolean> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const field = this.getAgentField(agentId);

      // 使用HSET设置数据
      await kv.hset(cacheKey, { [field]: metadata });

      // 设置整个hash的TTL
      await kv.expire(cacheKey, ttl);

      console.log(`Metadata cached: ${cacheKey}[${field}] (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('Error setting metadata cache:', error);
      return false;
    }
  }

  /**
   * 删除特定agent的元数据缓存
   */
  static async invalidate(userId: string, agentId?: string): Promise<boolean> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const field = this.getAgentField(agentId);

      const result = await kv.hdel(cacheKey, field);

      console.log(
        `Metadata cache invalidated: ${cacheKey}[${field}] (deleted: ${result})`
      );
      return result > 0;
    } catch (error) {
      console.error('Error invalidating metadata cache:', error);
      return false;
    }
  }

  /**
   * 删除用户的所有元数据缓存（包括所有agent）
   */
  static async invalidateAll(userId: string): Promise<boolean> {
    try {
      const cacheKey = this.getUserCacheKey(userId);

      // 直接删除整个hash
      const result = await kv.del(cacheKey);

      console.log(
        `Invalidated all metadata cache for user: ${userId} (deleted: ${result})`
      );

      return result > 0;
    } catch (error) {
      console.error('Error invalidating all metadata cache for user:', error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在
   */
  static async exists(userId: string, agentId?: string): Promise<boolean> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const field = this.getAgentField(agentId);

      const exists = await kv.hexists(cacheKey, field);
      return exists === 1;
    } catch (error) {
      console.error('Error checking metadata cache existence:', error);
      return false;
    }
  }

  /**
   * 获取用户缓存的剩余TTL
   */
  static async getTTL(userId: string): Promise<number> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const ttl = await kv.ttl(cacheKey);
      return ttl;
    } catch (error) {
      console.error('Error getting metadata cache TTL:', error);
      return -1;
    }
  }

  /**
   * 获取用户的所有agent数据
   */
  static async getAllAgents(
    userId: string
  ): Promise<Record<string, MetaDataResponse> | null> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const allData =
        await kv.hgetall<Record<string, MetaDataResponse>>(cacheKey);

      if (allData && Object.keys(allData).length > 0) {
        console.log(`Retrieved all agents data for user: ${userId}`);
        return allData;
      }

      return null;
    } catch (error) {
      console.error('Error getting all agents metadata from cache:', error);
      return null;
    }
  }

  /**
   * 批量获取多个用户的缓存状态
   */
  static async getStats(
    userIds: string[]
  ): Promise<
    Record<string, { exists: boolean; ttl: number; agentCount: number }>
  > {
    const stats: Record<
      string,
      { exists: boolean; ttl: number; agentCount: number }
    > = {};

    try {
      const promises = userIds.map(async userId => {
        const cacheKey = this.getUserCacheKey(userId);
        const [exists, ttl, agentCount] = await Promise.all([
          kv.exists(cacheKey),
          this.getTTL(userId),
          kv.hlen(cacheKey),
        ]);

        stats[userId] = {
          exists: exists === 1,
          ttl,
          agentCount: agentCount || 0,
        };
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error getting metadata cache stats:', error);
    }

    return stats;
  }

  /**
   * 获取用户缓存中的agent列表
   */
  static async getAgentList(userId: string): Promise<string[]> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const fields = await kv.hkeys(cacheKey);
      return fields || [];
    } catch (error) {
      console.error('Error getting agent list from cache:', error);
      return [];
    }
  }

  /**
   * 获取用户缓存中的agent数量
   */
  static async getAgentCount(userId: string): Promise<number> {
    try {
      const cacheKey = this.getUserCacheKey(userId);
      const count = await kv.hlen(cacheKey);
      return count || 0;
    } catch (error) {
      console.error('Error getting agent count from cache:', error);
      return 0;
    }
  }

  /**
   * 健康检查 - 验证缓存连接
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const testKey = `${this.CACHE_PREFIX}:health:${Date.now()}`;
      const testField = 'test';
      const testValue = 'ok';

      // 使用HSET设置测试值
      await kv.hset(testKey, { [testField]: testValue });
      await kv.expire(testKey, 5);

      // 使用HGET读取测试值
      const retrieved = await kv.hget(testKey, testField);

      // 清理测试值
      await kv.del(testKey);

      return retrieved === testValue;
    } catch (error) {
      console.error('Metadata cache health check failed:', error);
      return false;
    }
  }
}

/**
 * HTTP缓存响应头工具类
 */
export class HttpCacheHeaders {
  /**
   * 生成元数据的HTTP缓存头
   */
  static getMetaDataHeaders(
    maxAge: number = 180,
    sMaxAge: number = 300
  ): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge}`,
      Vary: 'Authorization',
      'X-Cache-Info': 'metadata-service',
    };
  }

  /**
   * 生成无缓存的HTTP头
   */
  static getNoCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    };
  }

  /**
   * 生成错误响应的HTTP头
   */
  static getErrorHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'no-cache, no-store',
      'X-Cache-Info': 'error-response',
    };
  }
}
