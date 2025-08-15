import { NextRequest, NextResponse } from 'next/server';
import { RetellDeploymentService } from '@/lib/services/retell-deployment-service';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function POST(request: NextRequest) {
  let businessId: string | undefined;
  let agents: any[] | undefined;

  try {
    // Authenticate request
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user } = authResult;

    // Parse request body
    const body = await request.json();
    businessId = body.businessId;
    agents = body.agents;

    // Check environment variables
    const retellApiKey = process.env.RETELL_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasRetellApiKey: !!retellApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      businessId,
      agentCount: agents?.length || 0,
    });

    if (!retellApiKey) {
      return NextResponse.json(
        { error: 'RETELL_API_KEY not configured' },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    console.log('🔧 Creating deployment service...');
    let deploymentService;
    try {
      deploymentService = new RetellDeploymentService();
      console.log('✅ Deployment service created successfully');
    } catch (serviceError) {
      console.error('❌ Failed to create deployment service:', serviceError);
      console.error(
        'Service error stack:',
        serviceError instanceof Error ? serviceError.stack : 'No stack'
      );
      console.error('Service error details:', {
        name: serviceError instanceof Error ? serviceError.name : 'Unknown',
        message:
          serviceError instanceof Error ? serviceError.message : serviceError,
        cause: serviceError instanceof Error ? serviceError.cause : undefined,
      });
      return NextResponse.json(
        {
          error: 'Failed to initialize deployment service',
          details:
            serviceError instanceof Error
              ? serviceError.message
              : 'Unknown error',
          stack: serviceError instanceof Error ? serviceError.stack : undefined,
        },
        { status: 500 }
      );
    }

    console.log('🚀 Starting agent deployment...');
    // Deploy agents to Retell
    let deploymentResult;
    try {
      deploymentResult = await deploymentService.deployAgents(businessId);
      console.log('✅ deployAgents completed:', deploymentResult);
    } catch (deployError) {
      console.error('❌ deployAgents failed:', deployError);
      console.error(
        'Deploy error stack:',
        deployError instanceof Error ? deployError.stack : 'No stack'
      );
      return NextResponse.json(
        {
          error: 'Agent deployment failed',
          details:
            deployError instanceof Error
              ? deployError.message
              : 'Unknown error',
          stack: deployError instanceof Error ? deployError.stack : undefined,
        },
        { status: 500 }
      );
    }

    if (!deploymentResult.success) {
      console.error(
        '❌ Deployment result indicates failure:',
        deploymentResult
      );
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
    try {
      console.log('📞 Starting phone number assignment...');
      const phoneResult = await deploymentService.assignPhoneNumber(businessId);
      console.log('📞 Phone assignment result:', phoneResult);
      if (phoneResult.success) {
        phoneNumber = phoneResult.phoneNumber;
      }
    } catch (phoneError) {
      console.error('❌ Phone assignment failed:', phoneError);
      // Don't fail the entire deployment for phone assignment issues
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
      businessId: businessId || 'undefined',
      agentCount: agents?.length || 0,
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
