/**
 * 业务服务基类
 * 提供统一的服务生命周期管理和消息处理能力
 */

import {
  MessageType,
  MessageHandler,
  CallAnalyzedData,
  CallStartedData,
  CallEndedData,
  BaseMessage,
} from '../message-system/message-types';
import {
  messageDispatcher,
  type ServiceCapabilities as IServiceCapabilities,
  EnhancedMessageHandler,
} from '../message-system/message-dispatcher';

/**
 * 业务服务抽象基类
 */
export abstract class BaseBusinessService {
  /** 服务名称 */
  abstract readonly name: string;

  /** 服务能力声明 */
  protected capabilities: IServiceCapabilities = {};

  /** 服务状态 */
  private _initialized = false;
  private _registrationTime?: Date;

  constructor() {
    // 从装饰器中读取能力配置
    const decoratorCapabilities = getServiceCapabilities(
      this.constructor as new () => BaseBusinessService
    );
    if (decoratorCapabilities) {
      this.capabilities = { ...this.capabilities, ...decoratorCapabilities };
    }

    // 子类构造完成后自动注册到消息分发器
    setTimeout(() => this.autoRegister(), 0);
  }

  /**
   * 服务初始化（子类必须实现）
   */
  abstract initialize(): Promise<void>;

  /**
   * 处理通话分析完成消息（可选实现）
   */
  handleCallAnalyzed?(data: CallAnalyzedData): Promise<void>;

  /**
   * 自定义消息过滤器（可选实现）
   * @param data 消息数据
   * @returns 是否应该处理该消息
   */
  shouldHandle?(data: CallAnalyzedData): boolean;

  /**
   * 处理通话开始消息（可选实现）
   */
  handleCallStarted?(data: CallStartedData): Promise<void>;

  /**
   * 处理通话结束消息（可选实现）
   */
  handleCallEnded?(data: CallEndedData): Promise<void>;

  /**
   * 自动注册到消息分发器
   */
  private autoRegister(): void {
    try {
      // 注册服务
      messageDispatcher.registerService(this.name, this.capabilities);

      // 自动订阅支持的消息类型
      this.subscribeToMessages();

      this._registrationTime = new Date();
      console.log(
        `Service ${this.name} automatically registered to message dispatcher`
      );
    } catch (error) {
      console.error(`服务 ${this.name} 自动注册失败:`, error);
    }
  }

  /**
   * 自动订阅支持的消息类型
   */
  private subscribeToMessages(): void {
    // 订阅通话分析完成消息
    if (this.handleCallAnalyzed) {
      this.subscribe(MessageType.CALL_ANALYZED, {
        name: 'handleCallAnalyzed',
        handler: this.handleCallAnalyzed.bind(this),
        shouldHandle: this.shouldHandle
          ? this.shouldHandle.bind(this)
          : undefined,
      });
    }

    // 订阅通话开始消息
    if (this.handleCallStarted) {
      this.subscribe(MessageType.CALL_STARTED, {
        name: 'handleCallStarted',
        handler: this.handleCallStarted.bind(this),
      });
    }

    // 订阅通话结束消息
    if (this.handleCallEnded) {
      this.subscribe(MessageType.CALL_ENDED, {
        name: 'handleCallEnded',
        handler: this.handleCallEnded.bind(this),
      });
    }
  }

  /**
   * 订阅消息类型（高级用法）
   */
  protected subscribe<T extends BaseMessage>(
    messageType: MessageType,
    handlerConfig: EnhancedMessageHandler<T> | MessageHandler<T>
  ): void {
    messageDispatcher.subscribe(this.name, messageType, handlerConfig);
  }

  /**
   * 设置服务能力
   */
  protected setCapabilities(capabilities: IServiceCapabilities): void {
    this.capabilities = { ...this.capabilities, ...capabilities };

    // 如果已注册，需要重新注册以更新能力
    if (this._registrationTime) {
      messageDispatcher.registerService(this.name, this.capabilities);
    }
  }

  /**
   * 执行初始化
   */
  async performInitialization(): Promise<void> {
    if (this._initialized) {
      console.log(`Service ${this.name} already initialized`);
      return;
    }

    try {
      console.log(`Starting initialization for service: ${this.name}`);
      await this.initialize();
      this._initialized = true;
      console.log(`Service ${this.name} initialization completed`);
    } catch (error) {
      console.error(`服务 ${this.name} 初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    name: string;
    initialized: boolean;
    registrationTime?: string;
    capabilities: IServiceCapabilities;
  } {
    return {
      name: this.name,
      initialized: this._initialized,
      registrationTime: this._registrationTime?.toISOString(),
      capabilities: this.capabilities,
    };
  }

  /**
   * 服务清理（可选实现）
   */
  cleanup?(): Promise<void>;

  /**
   * 销毁服务
   */
  async destroy(): Promise<void> {
    try {
      if (this.cleanup) {
        await this.cleanup();
      }

      messageDispatcher.unregisterService(this.name);
      this._initialized = false;

      console.log(`Service ${this.name} destroyed`);
    } catch (error) {
      console.error(`服务 ${this.name} 销毁失败:`, error);
    }
  }
}

/**
 * 业务服务装饰器 - 用于声明服务能力
 * 简化实现，直接修改类的原型
 */
export function ServiceCapabilities(capabilities: IServiceCapabilities) {
  return function <T extends new (...args: any[]) => BaseBusinessService>(
    constructor: T
  ): T {
    // 存储能力到类的元数据中
    (constructor as any)._serviceCapabilities = capabilities;

    // 返回原构造函数
    return constructor;
  };
}

/**
 * 辅助函数：从类中获取服务能力
 */
export function getServiceCapabilities(
  constructor: new () => BaseBusinessService
): IServiceCapabilities | undefined {
  return (constructor as any)._serviceCapabilities;
}

/**
 * 兼容旧版本的业务服务接口
 */
export interface LegacyBusinessService {
  name: string;
  initialize(): Promise<void>;
  handleCallAnalyzed(eventData: CallAnalyzedData): Promise<void>;
}

/**
 * 旧版本服务适配器
 */
export class LegacyServiceAdapter extends BaseBusinessService {
  readonly name: string;
  private legacyService: LegacyBusinessService;

  constructor(legacyService: LegacyBusinessService) {
    super();
    this.name = legacyService.name;
    this.legacyService = legacyService;
  }

  async initialize(): Promise<void> {
    await this.legacyService.initialize();
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    // 直接传递CallAnalyzedData，因为现在旧接口也使用了正确的类型
    await this.legacyService.handleCallAnalyzed(data);
  }
}
