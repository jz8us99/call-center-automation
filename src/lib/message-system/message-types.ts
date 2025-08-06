/**
 * 消息类型定义
 * 定义系统中所有消息的类型和数据结构
 */

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 通话开始 */
  CALL_STARTED = 'call.started',
  /** 通话结束 */
  CALL_ENDED = 'call.ended',
  /** 通话分析完成 */
  CALL_ANALYZED = 'call.analyzed',
}

/**
 * 基础消息接口
 */
export interface BaseMessage {
  /** 消息类型 */
  type: MessageType;
  /** 时间戳 */
  timestamp: Date;
  /** 消息ID（可选） */
  messageId?: string;
}

/**
 * 通话相关基础数据
 */
export interface CallData {
  call_id?: string;
  agent_id?: string;
  call_type?: string;
  agent_name?: string;
  start_timestamp?: string | number;
  end_timestamp?: string | number;
  duration_ms?: number;
  transcript?: string;
  recording_url?: string;
  public_log_url?: string;
  disconnection_reason?: string;
  call_cost?: unknown;
  call_analysis?: {
    call_summary?: string;
    custom_analysis_data?: {
      appointment_made_flag?: number;
      appointment_date_time?: string;
      reason_for_visit?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  from_number?: string;
  to_number?: string;
  direction?: string;
  telephony_identifier?: string | null;
}

/**
 * 通话开始消息数据
 */
export interface CallStartedData extends BaseMessage {
  type: MessageType.CALL_STARTED;
  call: Pick<CallData, 'call_id' | 'agent_id' | 'start_timestamp'>;
  userId: string;
}

/**
 * 通话结束消息数据
 */
export interface CallEndedData extends BaseMessage {
  type: MessageType.CALL_ENDED;
  call: Pick<
    CallData,
    'call_id' | 'agent_id' | 'end_timestamp' | 'duration_ms'
  >;
  userId: string;
}

/**
 * 通话分析完成消息数据
 */
export interface CallAnalyzedData extends BaseMessage {
  type: MessageType.CALL_ANALYZED;
  call: CallData;
  userId: string;
  callLogId?: string;
}

/**
 * 所有消息类型的联合类型
 */
export type MessageData = CallStartedData | CallEndedData | CallAnalyzedData;

/**
 * 消息处理器类型
 */
export type MessageHandler<T extends BaseMessage = BaseMessage> = (
  data: T
) => Promise<void> | void;

/**
 * 消息处理结果
 */
export interface MessageProcessResult {
  success: boolean;
  error?: string;
  handlerResults?: Array<{
    handlerName?: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * 消息分发器配置
 */
export interface MessageDispatcherConfig {
  /** 是否启用错误隔离（单个处理器失败不影响其他） */
  errorIsolation?: boolean;
  /** 处理器执行超时时间（毫秒） */
  timeout?: number;
  /** 是否记录详细日志 */
  verbose?: boolean;
}
