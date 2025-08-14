import { NextRequest, NextResponse } from 'next/server';
import { RetellDeploymentService } from '@/lib/services/retell-deployment-service';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { businessId, agentConfig } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    if (!agentConfig) {
      return NextResponse.json(
        { error: 'Agent configuration is required' },
        { status: 400 }
      );
    }

    const deploymentService = new RetellDeploymentService();

    // Deploy single agent to Retell
    const deploymentResult = await deploymentService.deploySingleAgent(businessId, agentConfig);

    if (!deploymentResult.success) {
      return NextResponse.json(
        { 
          error: 'Deployment failed',
          details: deploymentResult.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: deploymentResult.agent,
      message: `Successfully deployed agent: ${agentConfig.agent_name}`
    });
  } catch (error) {
    console.error('Error deploying single agent to Retell:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}