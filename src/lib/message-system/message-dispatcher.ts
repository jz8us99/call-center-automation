/**
 * 智能消息分发器
 * 支持基于业务类型、内容等维度的智能路由
 */

import {
  MessageType,
  BaseMessage,
  MessageData,
  MessageHandler,
  MessageProcessResult,
  MessageDispatcherConfig,
  CallAnalyzedData,
} from './message-types';

/**
 * 业务服务能力声明
 */
export interface ServiceCapabilities {
  /** 支持的业务类型 */
  businessTypes?: string[];
  /** 支持的消息类型 */
  messageTypes?: MessageType[];
  /** 支持的用户类型 */
  userTypes?: string[];
  /** 是否为全局服务（接收所有消息） */
  global?: boolean;
}

/**
 * 增强的消息处理器
 */
export interface EnhancedMessageHandler<T extends BaseMessage = BaseMessage> {
  /** 处理器名称 */
  name?: string;
  /** 服务能力声明 */
  capabilities?: ServiceCapabilities;
  /** 自定义过滤器 */
  shouldHandle?(data: T): boolean;
  /** 处理器函数 */
  handler: MessageHandler<T>;
}

/**
 * 服务注册信息
 */
interface ServiceRegistration {
  name: string;
  handlers: Map<MessageType, EnhancedMessageHandler[]>;
  capabilities: ServiceCapabilities;
  lastProcessed?: Date;
  errorCount: number;
}

/**
 * 消息分发器类
 */
export class MessageDispatcher {
  private static instance: MessageDispatcher;
  private services = new Map<string, ServiceRegistration>();
  private globalHandlers = new Map<MessageType, EnhancedMessageHandler[]>();
  private config: MessageDispatcherConfig;

  private constructor(config: MessageDispatcherConfig = {}) {
    this.config = {
      errorIsolation: true,
      timeout: 30000,
      verbose: false,
      ...config,
    };
  }

  static getInstance(config?: MessageDispatcherConfig): MessageDispatcher {
    if (!MessageDispatcher.instance) {
      MessageDispatcher.instance = new MessageDispatcher(config);
    }
    return MessageDispatcher.instance;
  }

  /**
   * 注册服务及其处理器
   */
  registerService(
    serviceName: string,
    capabilities: ServiceCapabilities = {}
  ): ServiceRegistration {
    if (this.services.has(serviceName)) {
      console.warn(`服务 ${serviceName} 已存在，将覆盖现有注册`);
    }

    const registration: ServiceRegistration = {
      name: serviceName,
      handlers: new Map(),
      capabilities,
      errorCount: 0,
    };

    this.services.set(serviceName, registration);

    if (this.config.verbose) {
      console.log(`Service registered: ${serviceName}`, capabilities);
    }

    return registration;
  }

  /**
   * 为服务订阅消息类型
   */
  subscribe<T extends BaseMessage>(
    serviceName: string,
    messageType: MessageType,
    handlerConfig: EnhancedMessageHandler<T> | MessageHandler<T>
  ): void {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(
        `Service ${serviceName} not registered, please call registerService first`
      );
    }

    // 标准化处理器配置
    const enhancedHandler: EnhancedMessageHandler<T> =
      typeof handlerConfig === 'function'
        ? { handler: handlerConfig }
        : handlerConfig;

    if (!service.handlers.has(messageType)) {
      service.handlers.set(messageType, []);
    }

    service.handlers
      .get(messageType)!
      .push(enhancedHandler as EnhancedMessageHandler);

    if (this.config.verbose) {
      console.log(
        `Service ${serviceName} subscribes to message type: ${messageType}`
      );
    }
  }

  /**
   * 注册全局处理器（处理所有消息）
   */
  subscribeGlobal<T extends BaseMessage>(
    messageType: MessageType,
    handler: EnhancedMessageHandler<T>
  ): void {
    if (!this.globalHandlers.has(messageType)) {
      this.globalHandlers.set(messageType, []);
    }

    this.globalHandlers
      .get(messageType)!
      .push(handler as EnhancedMessageHandler);

    if (this.config.verbose) {
      console.log(`Global handler registered: ${messageType}`);
    }
  }

  /**
   * 分发消息
   */
  async dispatch<T extends MessageData>(
    messageType: MessageType,
    data: T
  ): Promise<MessageProcessResult> {
    const startTime = Date.now();

    if (this.config.verbose) {
      console.log(`Starting message dispatch: ${messageType}`, {
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // 1. 查找符合条件的处理器
      const eligibleHandlers = this.findEligibleHandlers(messageType, data);

      if (eligibleHandlers.length === 0) {
        console.log(`No handlers found for ${messageType}`);
        return { success: true, handlerResults: [] };
      }

      // 2. 并行处理所有符合条件的处理器
      const handlerPromises = eligibleHandlers.map(({ serviceName, handler }) =>
        this.executeHandler(serviceName, handler, data)
      );

      const results = await Promise.allSettled(handlerPromises);

      // 3. 收集处理结果
      const handlerResults = results.map((result, index) => {
        const { serviceName, handler } = eligibleHandlers[index];

        if (result.status === 'fulfilled') {
          return {
            handlerName: `${serviceName}.${handler.name || 'anonymous'}`,
            success: true,
          };
        } else {
          // 记录错误但不影响其他处理器（错误隔离）
          const error =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          console.error(`Handler execution failed: ${serviceName}`, error);

          // 增加服务错误计数
          const service = this.services.get(serviceName);
          if (service) {
            service.errorCount++;
          }

          return {
            handlerName: `${serviceName}.${handler.name || 'anonymous'}`,
            success: false,
            error,
          };
        }
      });

      const successCount = handlerResults.filter(r => r.success).length;
      const totalTime = Date.now() - startTime;

      if (this.config.verbose) {
        console.log(`Message dispatch completed: ${messageType}`, {
          totalHandlers: handlerResults.length,
          success: successCount,
          failed: handlerResults.length - successCount,
          duration: `${totalTime}ms`,
        });
      }

      return {
        success: successCount > 0, // 只要有一个成功就算成功
        handlerResults,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Message dispatch error: ${messageType}`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        handlerResults: [],
      };
    }
  }

  /**
   * 查找符合条件的处理器
   */
  private findEligibleHandlers<T extends MessageData>(
    messageType: MessageType,
    data: T
  ): Array<{ serviceName: string; handler: EnhancedMessageHandler }> {
    const eligibleHandlers: Array<{
      serviceName: string;
      handler: EnhancedMessageHandler;
    }> = [];

    // 1. 添加全局处理器
    const globalHandlers = this.globalHandlers.get(messageType) || [];
    globalHandlers.forEach(handler => {
      if (this.shouldHandlerProcess(handler, data)) {
        eligibleHandlers.push({ serviceName: 'global', handler });
      }
    });

    // 2. 遍历所有服务的处理器
    this.services.forEach((service, serviceName) => {
      const serviceHandlers = service.handlers.get(messageType) || [];

      for (const handler of serviceHandlers) {
        if (
          this.shouldServiceProcess(service, messageType, data) &&
          this.shouldHandlerProcess(handler, data)
        ) {
          eligibleHandlers.push({ serviceName, handler });
        }
      }
    });

    return eligibleHandlers;
  }

  /**
   * 判断服务是否应该处理该消息
   */
  private shouldServiceProcess<T extends MessageData>(
    service: ServiceRegistration,
    messageType: MessageType,
    data: T
  ): boolean {
    const { capabilities } = service;

    // 1. 检查消息类型支持
    if (
      capabilities.messageTypes &&
      !capabilities.messageTypes.includes(messageType)
    ) {
      return false;
    }

    // 2. 检查业务类型匹配
    if (capabilities.businessTypes && !capabilities.global) {
      const businessType = this.extractBusinessType(data);
      if (businessType && !capabilities.businessTypes.includes(businessType)) {
        return false;
      }
    }

    // 3. 检查用户类型匹配
    if (capabilities.userTypes) {
      const userType = this.extractUserType(data);
      if (userType && !capabilities.userTypes.includes(userType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 判断处理器是否应该处理该消息
   */
  private shouldHandlerProcess<T extends MessageData>(
    handler: EnhancedMessageHandler,
    data: T
  ): boolean {
    // 执行自定义过滤器
    if (handler.shouldHandle && !handler.shouldHandle(data)) {
      return false;
    }

    return true;
  }

  /**
   * 执行单个处理器
   */
  private async executeHandler<T extends MessageData>(
    serviceName: string,
    handler: EnhancedMessageHandler,
    data: T
  ): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Handler timeout')),
        this.config.timeout
      );
    });

    try {
      await Promise.race([handler.handler(data), timeoutPromise]);

      // 更新服务最后处理时间
      const service = this.services.get(serviceName);
      if (service) {
        service.lastProcessed = new Date();
      }
    } catch (error) {
      if (this.config.errorIsolation) {
        throw error; // 让上层处理错误隔离
      } else {
        throw error; // 直接抛出让整个分发失败
      }
    }
  }

  /**
   * 从消息中提取业务类型
   */
  private extractBusinessType<T extends MessageData>(data: T): string | null {
    if (data.type === MessageType.CALL_ANALYZED) {
      const callData = data as CallAnalyzedData;
      return (callData.call.call_analysis?.business_type as string) || null;
    }
    return null;
  }

  /**
   * 从消息中提取用户类型
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private extractUserType<T extends MessageData>(_data: T): string | null {
    // 可以根据 userId 查询用户类型，这里简化处理
    return null;
  }

  /**
   * 获取服务统计信息
   */
  getServiceStats(): Record<
    string,
    {
      name: string;
      messageTypes: string[];
      lastProcessed?: string;
      errorCount: number;
    }
  > {
    const stats: Record<
      string,
      {
        name: string;
        messageTypes: string[];
        lastProcessed?: string;
        errorCount: number;
      }
    > = {};

    this.services.forEach((service, serviceName) => {
      stats[serviceName] = {
        name: service.name,
        messageTypes: Array.from(service.handlers.keys()),
        lastProcessed: service.lastProcessed?.toISOString(),
        errorCount: service.errorCount,
      };
    });

    return stats;
  }

  /**
   * 取消服务注册
   */
  unregisterService(serviceName: string): boolean {
    return this.services.delete(serviceName);
  }

  /**
   * 清空所有注册（主要用于测试）
   */
  clear(): void {
    this.services.clear();
    this.globalHandlers.clear();
    console.log('All message dispatcher registrations cleared');
  }
}

// 导出全局实例
export const messageDispatcher = MessageDispatcher.getInstance({
  errorIsolation: true,
  timeout: 30000,
  verbose: process.env.NODE_ENV === 'development',
});
