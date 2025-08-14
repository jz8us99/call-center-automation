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

    const { businessId, agentId, fromNumber, toNumber } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    const deploymentService = new RetellDeploymentService();

    // Create test call
    const testResult = await deploymentService.createTestCall(
      businessId,
      agentId,
      fromNumber,
      toNumber
    );

    if (!testResult.success) {
      return NextResponse.json(
        {
          error: 'Test call failed',
          details: testResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      callId: testResult.callId,
      callUrl: testResult.callUrl,
      message: 'Test call created successfully',
    });
  } catch (error) {
    console.error('Error creating test call:', error);
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

    // Get test deployment status
    const testResult = await deploymentService.testDeployment(businessId);

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error getting test status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
