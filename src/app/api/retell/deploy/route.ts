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

    const { businessId, agents } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const deploymentService = new RetellDeploymentService();

    // Deploy agents to Retell
    const deploymentResult = await deploymentService.deployAgents(businessId);

    if (!deploymentResult.success) {
      return NextResponse.json(
        {
          error: 'Deployment failed',
          errors: deploymentResult.errors,
        },
        { status: 500 }
      );
    }

    // Assign phone number if not already assigned
    let phoneNumber;
    const phoneResult = await deploymentService.assignPhoneNumber(businessId);
    if (phoneResult.success) {
      phoneNumber = phoneResult.phoneNumber;
    }

    return NextResponse.json({
      success: true,
      agents: deploymentResult.agents,
      phoneNumber,
      message: `Successfully deployed ${deploymentResult.agents.length} agents`,
    });
  } catch (error) {
    console.error('Error deploying to Retell:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      businessId,
      agents: agents?.length || 0,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const deploymentService = new RetellDeploymentService();

    // Test deployment status
    const testResult = await deploymentService.testDeployment(businessId);

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing deployment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
