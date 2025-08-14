require('dotenv').config();

async function testDeploymentFix() {
  try {
    console.log('🔍 Testing agent deployment fix...\n');

    // Simulate the API call from the frontend
    const testAgentConfig = {
      id: 'test-agent-id',
      agent_name: 'Test Deployment Agent',
      agent_type: 'receptionist',
      basic_info_prompt: 'You are a helpful AI receptionist.',
      call_scripts_prompt: 'Greet callers warmly.',
      call_scripts: { greeting_script: 'Hello! How can I help you?' },
      voice_settings: { speed: 1.0, pitch: 1.0 },
      retell_llm_id: process.env.RETELL_LLM_ID, // This is the key fix
    };

    // Test the deployment service directly
    const { RetellDeploymentService } = await import(
      '../src/lib/services/retell-deployment-service.ts'
    );

    console.log('✅ Successfully imported RetellDeploymentService');

    const service = new RetellDeploymentService();
    console.log('✅ Service initialized');

    // Test single agent deployment (similar to what the UI does)
    console.log('📦 Testing deployment with config:');
    console.log('   - Agent Name:', testAgentConfig.agent_name);
    console.log('   - LLM ID:', testAgentConfig.retell_llm_id);
    console.log('   - Agent Type:', testAgentConfig.agent_type);

    const result = await service.deploySingleAgent(
      'test-business-id',
      testAgentConfig
    );

    console.log('\n📊 Deployment Result:');
    console.log('   - Success:', result.success);
    if (result.success) {
      console.log('   - Agent ID:', result.agent?.agent_id);
      console.log('   - Agent Name:', result.agent?.agent_name);
      console.log('   - LLM Used:', result.agent?.response_engine?.llm_id);

      // Clean up the test agent
      const Retell = require('retell-sdk').default;
      const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });
      await retell.agent.delete(result.agent.agent_id);
      console.log('   - Cleanup: ✅ Test agent deleted');
    } else {
      console.log('   - Error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runDeploymentTest() {
  console.log('='.repeat(60));
  console.log('AGENT DEPLOYMENT FIX TEST');
  console.log('='.repeat(60));

  const testResult = await testDeploymentFix();

  console.log('\n' + '='.repeat(60));
  if (testResult.success) {
    console.log('✅ DEPLOYMENT FIX WORKING!');
    console.log('The "Deploy Agent" button should now work correctly.');
  } else {
    console.log('❌ DEPLOYMENT FIX FAILED');
    console.log('Error:', testResult.error);
  }
  console.log('='.repeat(60));
}

runDeploymentTest();
