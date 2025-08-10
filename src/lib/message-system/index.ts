/**
 * 消息系统统一入口
 * 导出所有消息系统相关的类型和实例
 */

// 核心消息分发器
export {
  MessageDispatcher,
  messageDispatcher,
  type ServiceCapabilities as IServiceCapabilities,
  type EnhancedMessageHandler,
} from './message-dispatcher';

// 消息类型定义
export {
  MessageType,
  type BaseMessage,
  type MessageData,
  type MessageHandler,
  type MessageProcessResult,
  type MessageDispatcherConfig,
  type CallAnalyzedData,
  type CallStartedData,
  type CallEndedData,
  type CallData,
} from './message-types';

// 业务服务基类
export {
  BaseBusinessService,
  LegacyServiceAdapter,
  type LegacyBusinessService,
} from '../services/base-service';

// 业务服务注册中心
export {
  registerBusinessService,
  initializeBusinessServices,
  getRegisteredServices,
  getServicesStatus,
  resetServices,
  unregisterService,
  type BusinessService,
} from '../services/business-registry';

// 诊所服务
export {
  ClinicAppointmentService,
  clinicAppointmentService,
} from '../services/clinic-service';
