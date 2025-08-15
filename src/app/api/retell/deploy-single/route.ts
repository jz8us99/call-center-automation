import { NextRequest, NextResponse } from 'next/server';
import { RetellDeploymentService } from '@/lib/services/retell-deployment-service';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request and verify signature
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const userId = user.id;
    console.log('Authenticated user ID:', userId);

    // Get business_id from business_profiles table using user_id
    console.log('Querying business_profiles with user_id:', userId);

    // Use authenticated client to query business profiles
    const { data: businessProfile, error: businessError } =
      await supabaseWithAuth
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId);

    console.log('Business profiles query result:', {
      data: businessProfile,
      error: businessError,
      count: businessProfile?.length,
    });

    if (businessError) {
      console.error('Database error:', businessError);
      return NextResponse.json(
        { error: 'Database query failed', details: businessError },
        { status: 500 }
      );
    }

    if (!businessProfile || businessProfile.length === 0) {
      console.error('No business profile found for user_id:', userId);
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const businessId = businessProfile[0].id;
    console.log('Business ID from profile:', businessId);

    const { agentConfig } = await request.json();

    if (!agentConfig) {
      return NextResponse.json(
        { error: 'Agent configuration is required' },
        { status: 400 }
      );
    }

    const deploymentService = new RetellDeploymentService();

    // Deploy single agent to Retell
    const deploymentResult = await deploymentService.deploySingleAgent(
      businessId,
      agentConfig,
      userId,
      supabaseWithAuth
    );

    if (!deploymentResult.success) {
      return NextResponse.json(
        {
          error: 'Deployment failed',
          details: deploymentResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: deploymentResult.agent,
      message: `Successfully deployed agent: ${agentConfig.agent_name}`,
    });
  } catch (error) {
    console.error('Error deploying single agent to Retell:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
