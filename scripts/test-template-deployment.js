/**
 * Test script for template-based Retell agent deployment
 * Usage: node scripts/test-template-deployment.js
 */

require('dotenv').config();
const {
  RetellTemplateService,
} = require('../src/lib/services/retell-template-service');
const {
  RetellDeploymentService,
} = require('../src/lib/services/retell-deployment-service');

async function testTemplateLoading() {
  console.log('\n=== Testing Template Loading ===\n');

  const templateService = new RetellTemplateService();

  try {
    // First, list available templates
    console.log('Listing available templates...');
    const availableTemplates = await templateService.listAvailableTemplates();
    console.log('Available templates:', availableTemplates);

    if (availableTemplates.length === 0) {
      console.error('❌ No templates found in src/agent-template/');
      return false;
    }

    // Test parsing template filename
    const firstTemplate = availableTemplates[0];
    const parsed = templateService.parseTemplateFilename(firstTemplate);
    console.log('Parsed template info:', parsed);

    // Test loading template from local file
    const template = await templateService.loadTemplate(
      parsed.businessType,
      parsed.agentRole,
      parsed.version
    );

    console.log('✅ Template loaded successfully');
    console.log('Template structure:', {
      filename: firstTemplate,
      hasAgentConfig: !!template.agent_name,
      hasLlmData: !!template.retellLlmData,
      toolsCount: template.retellLlmData?.general_tools?.length || 0,
      postCallFieldsCount: template.post_call_analysis_data?.length || 0,
      agentName: template.agent_name,
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to load template:', error.message);
    return false;
  }
}

async function testTemplateDeployment() {
  console.log('\n=== Testing Template Deployment ===\n');

  const deploymentService = new RetellDeploymentService();

  // Test business ID (you may need to update this)
  const testBusinessId = process.env.TEST_BUSINESS_ID || 'test-business-id';

  try {
    // Test configuration
    const testConfig = {
      id: 'test-agent-001',
      agent_name: 'Test Agent',
      client_id: testBusinessId,
      basic_info_prompt: 'This is a test agent for template deployment',
      call_scripts: {
        greeting_script: 'Hello! This is a test greeting.',
        closing_script: 'Thank you for testing our template system.',
      },
      voice_settings: {
        voice_id: '11labs-Adrian',
        speed: 1.28,
      },
    };

    console.log('Deploying agent with template...');
    const result = await deploymentService.deploySingleAgentWithTemplate(
      testBusinessId,
      testConfig,
      testBusinessId // userId
    );

    if (result.success) {
      console.log('✅ Agent deployed successfully');
      console.log('Agent details:', {
        agent_id: result.agent?.agent_id,
        agent_name: result.agent?.agent_name,
        response_engine: result.agent?.response_engine,
      });
    } else {
      console.error('❌ Deployment failed:', result.error);
    }

    return result.success;
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    return false;
  }
}

async function testMultipleAgentDeployment() {
  console.log('\n=== Testing Multiple Agent Deployment ===\n');

  const deploymentService = new RetellDeploymentService();
  const testBusinessId = process.env.TEST_BUSINESS_ID || 'test-business-id';

  try {
    console.log('Deploying all agents with templates...');
    const result =
      await deploymentService.deployAgentsWithTemplate(testBusinessId);

    if (result.success) {
      console.log('✅ All agents deployed successfully');
      console.log(`Deployed ${result.agents.length} agents`);
      result.agents.forEach((agent, index) => {
        console.log(`  ${index + 1}. ${agent.agent_name} (${agent.agent_id})`);
      });
    } else {
      console.error('❌ Some deployments failed:');
      result.errors?.forEach(error => {
        console.error(`  - ${error}`);
      });
    }

    return result.success;
  } catch (error) {
    console.error('❌ Multiple deployment error:', error.message);
    return false;
  }
}

async function main() {
  console.log('Starting Retell Template Service Tests...');
  console.log('=====================================\n');

  // Check environment variables
  if (!process.env.RETELL_API_KEY) {
    console.error('❌ RETELL_API_KEY is not set in environment variables');
    process.exit(1);
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      '❌ Supabase credentials are not set in environment variables'
    );
    process.exit(1);
  }

  console.log('Environment check passed ✅');

  // Run tests
  const tests = [
    { name: 'Template Loading', fn: testTemplateLoading },
    { name: 'Single Agent Deployment', fn: testTemplateDeployment },
    { name: 'Multiple Agent Deployment', fn: testMultipleAgentDeployment },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\nRunning: ${test.name}`);
    console.log('-'.repeat(40));

    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`Test failed with error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Print summary
  console.log('\n=====================================');
  console.log('Test Summary:');
  console.log('=====================================\n');

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${result.name}: ${status}`);
  });

  const allPassed = results.every(r => r.passed);

  if (allPassed) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
