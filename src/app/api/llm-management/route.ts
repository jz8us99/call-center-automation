import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import { llmManagementService } from '@/lib/services/llm-management-service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const clientId = searchParams.get('clientId');

    switch (action) {
      case 'sync':
        // Sync LLMs from Retell
        const syncResult = await llmManagementService.syncLLMsFromRetell();
        return NextResponse.json(syncResult);

      case 'list':
        // Get all available LLMs
        const llms = await llmManagementService.getAvailableLLMs();
        return NextResponse.json({ success: true, llms });

      case 'default':
        // Get default LLM
        const defaultLLM = await llmManagementService.getDefaultLLM();
        return NextResponse.json({ success: true, llm: defaultLLM });

      case 'agent-configs':
        // Get agent configurations with their LLMs
        if (!clientId) {
          return NextResponse.json(
            { error: 'clientId is required' },
            { status: 400 }
          );
        }
        const configs =
          await llmManagementService.getAgentConfigurationsWithLLMs(clientId);
        return NextResponse.json({ success: true, configurations: configs });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('LLM management GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'assign':
        // Assign LLM to agent
        if (!params.agentConfigId || !params.llmId) {
          return NextResponse.json(
            { error: 'agentConfigId and llmId are required' },
            { status: 400 }
          );
        }
        const assignResult = await llmManagementService.assignLLMToAgent(
          params.agentConfigId,
          params.llmId
        );
        return NextResponse.json(assignResult);

      case 'bulk-assign':
        // Bulk assign LLM to multiple agents
        if (!params.agentConfigIds || !params.llmId) {
          return NextResponse.json(
            { error: 'agentConfigIds array and llmId are required' },
            { status: 400 }
          );
        }
        const bulkResult = await llmManagementService.bulkAssignLLM(
          params.agentConfigIds,
          params.llmId
        );
        return NextResponse.json(bulkResult);

      case 'set-default':
        // Set default LLM
        if (!params.llmId) {
          return NextResponse.json(
            { error: 'llmId is required' },
            { status: 400 }
          );
        }
        const defaultResult = await llmManagementService.setDefaultLLM(
          params.llmId
        );
        return NextResponse.json(defaultResult);

      case 'upsert':
        // Create or update LLM config
        if (!params.llmConfig) {
          return NextResponse.json(
            { error: 'llmConfig is required' },
            { status: 400 }
          );
        }
        const upsertResult = await llmManagementService.upsertLLMConfig(
          params.llmConfig
        );
        return NextResponse.json(upsertResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('LLM management POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process LLM management request' },
      { status: 500 }
    );
  }
}
