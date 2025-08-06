/**
 * 业务服务注册中心
 * 管理所有业务服务的注册和初始化
 * 支持新的消息分发器系统和向后兼容
 */

import { messageDispatcher } from '../message-system/message-dispatcher';
import { MessageType, CallAnalyzedData } from '../message-system/message-types';
import { BaseBusinessService, LegacyServiceAdapter } from './base-service';

/**
 * 业务服务接口（向后兼容）
 */
export interface BusinessService {
  name: string;
  initialize(): Promise<void>;
  handleCallAnalyzed(eventData: CallAnalyzedData): Promise<void>;
}

/**
 * 服务注册信息
 */
interface ServiceRegistration {
  service: BusinessService | BaseBusinessService;
  type: 'legacy' | 'modern';
  adapter?: LegacyServiceAdapter;
  initialized: boolean;
  lastError?: Error;
}

/**
 * 已注册的业务服务
 */
const registeredServices = new Map<string, ServiceRegistration>();

/**
 * 注册业务服务（支持新旧两种类型）
 * @param service 业务服务实例
 */
export function registerBusinessService(
  service: BusinessService | BaseBusinessService
): void {
  const serviceName = service.name;

  // 检查是否重复注册
  if (registeredServices.has(serviceName)) {
    console.warn(`服务 ${serviceName} 已存在，将覆盖现有注册`);
  }

  // 判断服务类型
  const isModernService = service instanceof BaseBusinessService;
  let registration: ServiceRegistration;

  if (isModernService) {
    // 现代服务，直接注册
    registration = {
      service,
      type: 'modern',
      initialized: false,
    };
  } else {
    // 旧版服务，使用适配器
    const adapter = new LegacyServiceAdapter(service as BusinessService);
    registration = {
      service,
      type: 'legacy',
      adapter,
      initialized: false,
    };
  }

  registeredServices.set(serviceName, registration);
  console.log(
    `Registering business service: ${serviceName} (${registration.type})`
  );
}

/**
 * 初始化所有业务服务
 * 在每个API调用开始时调用（serverless环境）
 */
export async function initializeBusinessServices(): Promise<void> {
  console.log('Starting business services initialization...');

  if (registeredServices.size === 0) {
    console.log('No registered business services');
    return;
  }

  // 并行初始化所有服务
  const initPromises = Array.from(registeredServices.values()).map(
    async registration => {
      const serviceName = registration.service.name;

      try {
        console.log(
          `Initializing service: ${serviceName} (${registration.type})`
        );

        if (registration.type === 'modern') {
          // 现代服务自动处理注册和订阅
          const modernService = registration.service as BaseBusinessService;
          await modernService.performInitialization();
        } else {
          // 旧版服务通过适配器处理
          if (registration.adapter) {
            await registration.adapter.performInitialization();
          } else {
            // 兼容模式：直接初始化并手动注册处理器
            await registration.service.initialize();
            await registerLegacyServiceHandlers(
              registration.service as BusinessService
            );
          }
        }

        registration.initialized = true;
        registration.lastError = undefined;
        console.log(`Service ${serviceName} initialization successful`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        registration.lastError = err;
        console.error(
          `Service ${serviceName} initialization failed:`,
          err.message
        );

        // 不抛出错误，允许其他服务继续初始化
      }
    }
  );

  await Promise.allSettled(initPromises);

  const successCount = Array.from(registeredServices.values()).filter(
    reg => reg.initialized
  ).length;

  console.log(
    `Business services initialization completed: ${successCount}/${registeredServices.size} services successful`
  );
}

/**
 * 为旧版服务手动注册消息处理器
 */
async function registerLegacyServiceHandlers(
  service: BusinessService
): Promise<void> {
  try {
    // 注册到消息分发器
    messageDispatcher.registerService(service.name, { global: true });

    // 订阅通话分析完成消息
    messageDispatcher.subscribe(service.name, MessageType.CALL_ANALYZED, {
      name: 'handleCallAnalyzed',
      handler: async (data: CallAnalyzedData) => {
        await service.handleCallAnalyzed(data);
      },
    });

    console.log(
      `Message handlers registered for legacy service ${service.name}`
    );
  } catch (error) {
    console.error(
      `Failed to register handlers for service ${service.name}:`,
      error
    );
    throw error;
  }
}

/**
 * 获取已注册的服务列表
 */
export function getRegisteredServices(): string[] {
  return Array.from(registeredServices.keys());
}

/**
 * 获取服务详细状态
 */
export function getServicesStatus(): Record<
  string,
  {
    name: string;
    type: 'legacy' | 'modern';
    initialized: boolean;
    lastError?: string;
  }
> {
  const status: Record<
    string,
    {
      name: string;
      type: 'legacy' | 'modern';
      initialized: boolean;
      lastError?: string;
    }
  > = {};

  registeredServices.forEach((registration, name) => {
    status[name] = {
      name,
      type: registration.type,
      initialized: registration.initialized,
      lastError: registration.lastError?.message,
    };
  });

  return status;
}

/**
 * 重置所有服务注册（主要用于测试）
 */
export function resetServices(): void {
  registeredServices.clear();
  messageDispatcher.clear();
  console.log('All business service registrations have been reset');
}

/**
 * 取消注册指定服务
 */
export function unregisterService(serviceName: string): boolean {
  const registration = registeredServices.get(serviceName);
  if (!registration) {
    return false;
  }

  // 从消息分发器中注销
  messageDispatcher.unregisterService(serviceName);

  // 从注册表中移除
  registeredServices.delete(serviceName);

  console.log(`Service unregistered: ${serviceName}`);
  return true;
}
