/**
 * 元数据服务日志和监控工具
 */

export interface MetaDataMetrics {
  userId: string;
  agentId: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  cacheHit: boolean;
  dataCompleteness: number; // 0-1之间，表示数据完整性
  warnings: string[];
  error?: string;
}

export interface PerformanceMetrics {
  totalRequests: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastError?: string;
  lastErrorTime?: string;
}

/**
 * 元数据日志记录器
 */
export class MetaDataLogger {
  private static metrics: MetaDataMetrics[] = [];
  private static readonly MAX_METRICS = 1000; // 保留最近1000条记录

  /**
   * 记录操作指标
   */
  static logMetrics(metrics: MetaDataMetrics): void {
    // 添加时间戳
    const timestamp = new Date().toISOString();

    // 记录到控制台
    const logLevel = metrics.error
      ? 'error'
      : metrics.warnings.length > 0
        ? 'warn'
        : 'info';
    const message = `[${timestamp}] MetaData ${metrics.operation} - User: ${metrics.userId}, Duration: ${metrics.duration}ms, Cache: ${metrics.cacheHit ? 'HIT' : 'MISS'}, Completeness: ${(metrics.dataCompleteness * 100).toFixed(1)}%`;

    switch (logLevel) {
      case 'error':
        console.error(message, {
          error: metrics.error,
          warnings: metrics.warnings,
        });
        break;
      case 'warn':
        console.warn(message, { warnings: metrics.warnings });
        break;
      default:
        console.log(message);
    }

    // 存储到内存（在生产环境中应该发送到监控系统）
    this.metrics.push({
      ...metrics,
      startTime: metrics.startTime,
      endTime: metrics.endTime,
    });

    // 保持数组大小限制
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // 在生产环境中，这里应该发送到监控系统
    // 例如：DataDog, New Relic, CloudWatch等
    this.sendToMonitoringSystem(metrics);
  }

  /**
   * 获取性能统计
   */
  static getPerformanceStats(
    timeRangeMinutes: number = 60
  ): PerformanceMetrics {
    const cutoffTime = Date.now() - timeRangeMinutes * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.endTime >= cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }

    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const errors = recentMetrics.filter(m => m.error).length;
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const lastError = recentMetrics.find(m => m.error);

    return {
      totalRequests: recentMetrics.length,
      cacheHitRate: cacheHits / recentMetrics.length,
      averageResponseTime: totalDuration / recentMetrics.length,
      errorRate: errors / recentMetrics.length,
      lastError: lastError?.error,
      lastErrorTime: lastError
        ? new Date(lastError.endTime).toISOString()
        : undefined,
    };
  }

  /**
   * 获取用户级别的统计
   */
  static getUserStats(
    userId: string,
    timeRangeMinutes: number = 60
  ): PerformanceMetrics {
    const cutoffTime = Date.now() - timeRangeMinutes * 60 * 1000;
    const userMetrics = this.metrics.filter(
      m => m.userId === userId && m.endTime >= cutoffTime
    );

    if (userMetrics.length === 0) {
      return {
        totalRequests: 0,
        cacheHitRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }

    const cacheHits = userMetrics.filter(m => m.cacheHit).length;
    const errors = userMetrics.filter(m => m.error).length;
    const totalDuration = userMetrics.reduce((sum, m) => sum + m.duration, 0);
    const lastError = userMetrics.find(m => m.error);

    return {
      totalRequests: userMetrics.length,
      cacheHitRate: cacheHits / userMetrics.length,
      averageResponseTime: totalDuration / userMetrics.length,
      errorRate: errors / userMetrics.length,
      lastError: lastError?.error,
      lastErrorTime: lastError
        ? new Date(lastError.endTime).toISOString()
        : undefined,
    };
  }

  /**
   * 检查是否存在性能问题
   */
  static detectPerformanceIssues(): {
    hasIssues: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getPerformanceStats(30); // 最近30分钟
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查错误率
    if (stats.errorRate > 0.05) {
      // 5%以上的错误率
      issues.push(`High error rate: ${(stats.errorRate * 100).toFixed(1)}%`);
      recommendations.push('Check database connectivity and query performance');
    }

    // 检查响应时间
    if (stats.averageResponseTime > 2000) {
      // 超过2秒
      issues.push(
        `Slow response time: ${stats.averageResponseTime.toFixed(0)}ms`
      );
      recommendations.push('Consider database query optimization or scaling');
    }

    // 检查缓存命中率
    if (stats.cacheHitRate < 0.7 && stats.totalRequests > 10) {
      // 缓存命中率低于70%
      issues.push(
        `Low cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`
      );
      recommendations.push('Review cache TTL settings or data update patterns');
    }

    return {
      hasIssues: issues.length > 0,
      issues,
      recommendations,
    };
  }

  /**
   * 清除旧的指标数据
   */
  static cleanup(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.endTime >= cutoffTime);
    console.log(
      `Cleaned up old metrics, ${this.metrics.length} entries remaining`
    );
  }

  /**
   * 发送到监控系统（占位实现）
   */
  private static sendToMonitoringSystem(_metrics: MetaDataMetrics): void {
    // 在实际生产环境中，这里应该发送到您选择的监控系统
    // 例如：
    // 发送到 DataDog
    // datadog.increment('metadata.request.count', 1, [`user:${metrics.userId}`, `operation:${metrics.operation}`]);
    // datadog.histogram('metadata.response.time', metrics.duration, [`user:${metrics.userId}`]);
    // 发送到 CloudWatch
    // await cloudwatch.putMetricData({
    //   Namespace: 'CallCenter/MetaData',
    //   MetricData: [{
    //     MetricName: 'ResponseTime',
    //     Value: metrics.duration,
    //     Unit: 'Milliseconds',
    //     Dimensions: [{ Name: 'UserId', Value: metrics.userId }]
    //   }]
    // });
    // 发送到自定义监控端点
    // fetch('/api/internal/metrics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metrics)
    // });
  }

  /**
   * 导出指标数据（用于调试和分析）
   */
  static exportMetrics(timeRangeMinutes: number = 60): MetaDataMetrics[] {
    const cutoffTime = Date.now() - timeRangeMinutes * 60 * 1000;
    return this.metrics.filter(m => m.endTime >= cutoffTime);
  }
}

/**
 * 性能监控装饰器
 */
export function MonitorPerformance(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      let cacheHit = false;
      const warnings: string[] = [];
      let error: string | undefined;

      try {
        const result = await originalMethod.apply(this, args);

        // 检查结果中是否有缓存命中信息
        if (result && result.headers && result.headers['X-Cache-Info']) {
          cacheHit = result.headers['X-Cache-Info'].includes('cache-hit');
        }

        return result;
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        const endTime = Date.now();

        MetaDataLogger.logMetrics({
          userId: this.userId || 'unknown',
          agentId: this.agentId || 'unknown',
          operation,
          startTime,
          endTime,
          duration: endTime - startTime,
          cacheHit,
          dataCompleteness: 1.0, // 需要根据实际情况计算
          warnings,
          error,
        });
      }
    };

    return descriptor;
  };
}
