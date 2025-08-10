import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RetellCall, verifyRetellWebhook } from '@/lib/retell-webhook-utils';
import { messageDispatcher } from '@/lib/message-system/message-dispatcher';
import {
  MessageType,
  CallAnalyzedData,
  CallStartedData,
  CallEndedData,
  MessageProcessResult,
} from '@/lib/message-system/message-types';
import { initializeBusinessServices } from '@/lib/services/business-registry';

// 导入示例服务以激活自动注册

/**
 * 从agent_id获取user_id
 */
async function getUserIdFromAgent(agentId?: string): Promise<string | null> {
  if (!agentId) {
    console.error(
      'No agent_id provided - cannot process webhook without valid agent'
    );
    return null;
  }

  try {
    const { data: agentConfig, error: agentError } = await supabaseAdmin
      .from('agent_configs')
      .select('user_id')
      .eq('agent_id', agentId)
      .single();

    if (!agentError && agentConfig?.user_id) {
      console.log(
        `Found user_id for agent_id ${agentId}: ${agentConfig.user_id}`
      );
      return agentConfig.user_id;
    } else {
      console.error(
        `No configuration found for agent_id ${agentId} - webhook cannot be processed`
      );
      return null;
    }
  } catch (error) {
    console.error('查询agent配置失败:', error);
    return null;
  }
}

/**
 * 处理通话开始事件
 */
async function handleCallStarted(
  call: RetellCall,
  userId: string
): Promise<void> {
  try {
    console.log('Starting call started message dispatch...', {
      callId: call?.call_id,
      userId,
    });

    const messageData: CallStartedData = {
      type: MessageType.CALL_STARTED,
      timestamp: new Date(),
      call: {
        call_id: call?.call_id,
        agent_id: call?.agent_id,
        start_timestamp: call?.start_timestamp,
      },
      userId,
    };

    const result = await messageDispatcher.dispatch(
      MessageType.CALL_STARTED,
      messageData
    );
    logDispatchResult(result, 'call_started');
  } catch (error) {
    console.error('处理通话开始事件异常:', error);
  }
}

/**
 * 处理通话结束事件
 */
async function handleCallEnded(
  call: RetellCall,
  userId: string
): Promise<void> {
  try {
    console.log('Starting call ended message dispatch...', {
      callId: call?.call_id,
      userId,
    });

    const messageData: CallEndedData = {
      type: MessageType.CALL_ENDED,
      timestamp: new Date(),
      call: {
        call_id: call?.call_id,
        agent_id: call?.agent_id,
        end_timestamp: call?.end_timestamp,
        duration_ms: call?.duration_ms,
      },
      userId,
    };

    const result = await messageDispatcher.dispatch(
      MessageType.CALL_ENDED,
      messageData
    );
    logDispatchResult(result, 'call_ended');
  } catch (error) {
    console.error('处理通话结束事件异常:', error);
  }
}

/**
 * 记录分发结果
 */
function logDispatchResult(
  result: MessageProcessResult,
  eventType: string
): void {
  if (result.success) {
    const successCount =
      result.handlerResults?.filter(r => r.success).length || 0;
    const totalCount = result.handlerResults?.length || 0;
    console.log(
      `${eventType} message dispatch completed: ${successCount}/${totalCount} handlers processed successfully`
    );

    // 记录处理详情
    if (result.handlerResults) {
      result.handlerResults.forEach(handlerResult => {
        if (handlerResult.success) {
          console.log(
            `✅ Handler ${handlerResult.handlerName} processed successfully`
          );
        } else {
          console.error(
            `❌ 处理器 ${handlerResult.handlerName} 处理失败: ${handlerResult.error}`
          );
        }
      });
    }
  } else {
    console.error(`${eventType} 消息分发失败:`, result.error);
  }
}

/**
 * 处理通话分析完成业务逻辑
 * 通过消息分发器分发给各个业务服务
 */
async function handleCallAnalyzed(
  call: RetellCall,
  userId: string,
  callLogId: string
): Promise<void> {
  try {
    console.log('Starting call analyzed message dispatch...', {
      callId: call?.call_id,
      userId,
      callLogId,
    });

    // 构造消息数据
    const messageData: CallAnalyzedData = {
      type: MessageType.CALL_ANALYZED,
      timestamp: new Date(),
      call: {
        call_id: call?.call_id,
        agent_id: call?.agent_id,
        call_type: call?.call_type,
        agent_name: call?.agent_name,
        start_timestamp: call?.start_timestamp,
        end_timestamp: call?.end_timestamp,
        duration_ms: call?.duration_ms,
        transcript: call?.transcript,
        recording_url: call?.recording_url,
        public_log_url: call?.public_log_url,
        disconnection_reason: call?.disconnection_reason,
        call_cost: call?.call_cost,
        call_analysis: call?.call_analysis,
        from_number: call?.from_number,
        to_number: call?.to_number,
        direction: call?.direction,
        telephony_identifier:
          typeof call?.telephony_identifier === 'string'
            ? call.telephony_identifier
            : null,
      },
      userId,
      callLogId,
    };

    // 通过消息分发器分发消息
    const result = await messageDispatcher.dispatch(
      MessageType.CALL_ANALYZED,
      messageData
    );
    logDispatchResult(result, 'call_analyzed');
  } catch (error) {
    console.error('处理通话分析完成事件异常:', error);
    // 处理失败不影响webhook的正常响应
  }
}

export async function POST(request: NextRequest) {
  try {
    // 初始化业务服务（serverless环境每次请求都需要重新初始化）
    console.log('Starting business services initialization...');
    await initializeBusinessServices();
    console.log('Business services initialization completed');

    // 验证 webhook 签名并解析请求体
    const verification = await verifyRetellWebhook(request);

    if (!verification.success) {
      return verification.error!;
    }

    // 解析 webhook payload
    if (!verification.payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { event, call } = verification.payload;

    console.log('Received Retell webhook:', { event, callId: call?.call_id });

    // Process different webhook events
    switch (event) {
      case 'call_started':
        console.log('Call started:', call?.call_id);
        try {
          // 获取用户ID
          const userId = await getUserIdFromAgent(call?.agent_id);
          if (userId) {
            await handleCallStarted(call, userId);
          } else {
            console.error(
              'Cannot process call_started - no valid user ID found'
            );
          }
        } catch (error) {
          console.error('处理call_started事件失败:', error);
        }
        break;

      case 'call_ended':
        console.log('Call ended:', call?.call_id);
        try {
          // 获取用户ID
          const userId = await getUserIdFromAgent(call?.agent_id);
          if (userId) {
            await handleCallEnded(call, userId);
          } else {
            console.error('Cannot process call_ended - no valid user ID found');
          }
        } catch (error) {
          console.error('处理call_ended事件失败:', error);
        }
        break;

      case 'call_analyzed':
        console.log(`call_analysis ${JSON.stringify(call?.call_analysis)}`);
        console.log(`webhook body ${verification.body}`);

        try {
          // 获取用户ID
          const userId = await getUserIdFromAgent(call?.agent_id);
          if (!userId) {
            console.error(
              'Cannot process call_analyzed - no valid user ID found'
            );
            break;
          }
          console.log(`userId ${userId}`);

          // 准备插入数据库的数据
          const callLogData = {
            call_id: call?.call_id,
            agent_id: call?.agent_id,
            call_type: call?.call_type,
            agent_name: call?.agent_name,
            start_timestamp: call?.start_timestamp
              ? new Date(call.start_timestamp).toISOString()
              : null,
            end_timestamp: call?.end_timestamp
              ? new Date(call.end_timestamp).toISOString()
              : null,
            duration_ms: call?.duration_ms,
            transcript: call?.transcript,
            call_record_url: call?.recording_url,
            public_log_url: call?.public_log_url,
            disconnection_reason: call?.disconnection_reason,
            call_cost: call?.call_cost || null,
            call_analysis: call?.call_analysis || {},
            from_number: call?.from_number,
            to_number: call?.to_number,
            direction: call?.direction,
            telephony_identifier: call?.telephony_identifier || null,
            user_id: userId,
          };

          const { data, error } = await supabaseAdmin
            .from('customer_call_logs')
            .insert(callLogData)
            .select();

          let callLogId: string | undefined;

          if (error) {
            console.error('数据库插入错误:', error);
          } else {
            const insertedRecord = data?.[0];
            callLogId = insertedRecord?.id;
            console.log('Successfully inserted call record:', callLogId);
          }

          // 无论数据库插入是否成功，都处理业务逻辑
          // 这样业务服务可以自行决定如何处理
          await handleCallAnalyzed(call, userId, callLogId || '');
        } catch (dbError) {
          console.error('处理 call_analyzed 事件时发生错误:', dbError);
        }
        break;

      default:
        console.log('Unknown event type:', event);
    }

    // Acknowledge receipt of the webhook
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Retell webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
