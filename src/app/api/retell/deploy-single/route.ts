import { NextRequest, NextResponse } from 'next/server';
import { RetellTemplateService } from '@/lib/services/retell-template-service';
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

    const templateService = new RetellTemplateService();

    // Auto-generate templateConfig based on business profile
    const businessType = businessProfile[0].business_type || 'general';

    // Map business types to available templates
    const getTemplateConfig = (businessType: string) => {
      switch (businessType.toLowerCase()) {
        case 'dental':
          return {
            businessType: 'dental',
            agentRole: 'inbound-receptionist',
            version: 'v01',
          };
        case 'medical':
        case 'healthcare':
          return {
            businessType: 'medical',
            agentRole: 'inbound-receptionist',
            version: 'v01',
          };
        case 'restaurant':
        case 'food':
          return {
            businessType: 'restaurant',
            agentRole: 'inbound-receptionist',
            version: 'v01',
          };
        default:
          return {
            businessType: 'general',
            agentRole: 'inbound-receptionist',
            version: 'v01',
          };
      }
    };

    const templateConfig = getTemplateConfig(businessType);
    console.log('Auto-generated templateConfig:', templateConfig);

    // Deploy agent from template
    const deploymentResult = await templateService.deployFromTemplate(
      businessId,
      agentConfig,
      templateConfig,
      userId
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
      llmId: deploymentResult.llmId,
      message: `Successfully deployed agent from template: ${deploymentResult.agent.agent_name}`,
    });
  } catch (error) {
    console.error('Error deploying agent from template:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
