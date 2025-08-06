/**
 * 示例业务服务
 * 演示如何创建和使用消息分发器的业务服务
 */

import { BaseBusinessService } from './base-service';
import { CallAnalyzedData, MessageType } from '../message-system/message-types';

/**
 * CRM服务示例 - 处理所有通话的客户数据更新
 */
export class CRMService extends BaseBusinessService {
  readonly name = 'CRM客户管理服务';

  constructor() {
    super();
    // 设置服务能力
    this.setCapabilities({
      businessTypes: ['dental', 'legal', 'general'], // 支持所有业务类型
      messageTypes: [MessageType.CALL_ANALYZED],
      global: true, // 全局服务，处理所有消息
    });
  }

  async initialize(): Promise<void> {
    console.log('Initializing CRM service...');
    // 这里可以初始化数据库连接、配置等
    console.log('CRM service initialization completed');
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    console.log(`CRM service processing call analysis: ${data.call.call_id}`);

    // 示例：更新客户通话记录
    const customerPhone = data.call.from_number || data.call.to_number;
    if (customerPhone) {
      console.log(`Updating call record for customer ${customerPhone}`);
      // 这里实现实际的CRM更新逻辑
    }

    // 示例：提取通话摘要
    const summary = data.call.call_analysis?.call_summary;
    if (summary) {
      console.log(`Call summary: ${summary}`);
    }
  }
}

/**
 * 牙科预约服务示例 - 只处理牙科相关的预约
 */
export class DentalAppointmentService extends BaseBusinessService {
  readonly name = '牙科预约服务';

  constructor() {
    super();
    // 设置服务能力
    this.setCapabilities({
      businessTypes: ['dental'], // 只处理牙科业务
      messageTypes: [MessageType.CALL_ANALYZED],
    });
  }

  async initialize(): Promise<void> {
    console.log('Initializing dental appointment service...');
    // 初始化预约系统连接
    console.log('Dental appointment service initialization completed');
  }

  // 自定义过滤器：只处理有预约信息的通话
  shouldHandle(data: CallAnalyzedData): boolean {
    const appointmentFlag =
      data.call.call_analysis?.custom_analysis_data?.appointment_made_flag;
    console.log(`shouldHandle ${appointmentFlag}`);
    return appointmentFlag === 1;
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    console.log(
      `Dental appointment service processing call: ${data.call.call_id}`
    );

    const analysisData = data.call.call_analysis?.custom_analysis_data;
    if (analysisData) {
      const appointmentDateTime = analysisData.appointment_date_time;
      const reasonForVisit = analysisData.reason_for_visit;

      console.log(
        `Creating dental appointment: time=${appointmentDateTime}, reason=${reasonForVisit}`
      );

      // 这里实现实际的预约创建逻辑
      console.log(`going to create appointment ${JSON.stringify(data)}`);
    }
  }
}

/**
 * 通知服务示例 - 发送各种通知
 */
export class NotificationService extends BaseBusinessService {
  readonly name = '通知服务';

  constructor() {
    super();
    // 设置服务能力
    this.setCapabilities({
      global: true, // 全局服务
      messageTypes: [MessageType.CALL_ANALYZED],
    });
  }

  async initialize(): Promise<void> {
    console.log('Initializing notification service...');
    // 初始化邮件/短信服务
    console.log('Notification service initialization completed');
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    console.log(`Notification service processing call: ${data.call.call_id}`);

    // 示例：发送通话完成通知
    const summary = data.call.call_analysis?.call_summary;
    if (summary) {
      console.log(`Sending call summary notification to user ${data.userId}`);
      // await this.sendNotification(data.userId, '通话完成', summary);
    }

    // 示例：如果是预约，发送确认邮件
    const appointmentFlag =
      data.call.call_analysis?.custom_analysis_data?.appointment_made_flag;
    if (appointmentFlag === 1) {
      console.log(
        `Sending appointment confirmation email to user ${data.userId}`
      );
      // await this.sendAppointmentConfirmation(data.userId, data.call);
    }
  }
}

// 自动实例化服务（这将触发自动注册）
export const crmService = new CRMService();
export const dentalAppointmentService = new DentalAppointmentService();
export const notificationService = new NotificationService();
