require('dotenv').config();

async function testDeploymentService() {
  try {
    console.log('🔍 Testing RetellDeploymentService...\n');

    // Use dynamic import for ES module
    const { RetellDeploymentService } = await import(
      '../src/lib/services/retell-deployment-service.ts'
    );

    console.log('✅ Successfully imported RetellDeploymentService');

    // Test service initialization
    const service = new RetellDeploymentService();
    console.log('✅ Service initialized successfully');

    // Test a simple function call
    console.log('📋 Service name:', service.name);

    return {
      success: true,
      message: 'RetellDeploymentService is working correctly',
    };
  } catch (error) {
    console.error('❌ Error testing deployment service:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    return {
      success: false,
      error: error.message,
    };
  }
}

// Also test a simple agent creation to verify the core functionality
async function testAgentCreation() {
  try {
    console.log('\n🧪 Testing simple agent creation...');

    const Retell = require('retell-sdk').default;
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    // Create minimal test agent
    const agentConfig = {
      agent_name: `Service Test Agent - ${Date.now()}`,
      response_engine: {
        type: 'retell-llm',
        llm_id: process.env.RETELL_LLM_ID,
      },
      voice_id: '11labs-Adrian',
      language: 'en-US',
      webhook_url: 'http://localhost:19080/api/retell/webhook',
      voice_temperature: 1,
      voice_speed: 1.28,
      volume: 1,
      enable_backchannel: true,
      backchannel_words: ['mhm', 'uh-huh'],
      max_call_duration_ms: 1800000,
      interruption_sensitivity: 0.9,
      normalize_for_speech: true,
      begin_message_delay_ms: 200,
      post_call_analysis_model: 'gpt-4o-mini',
    };

    const agent = await retell.agent.create(agentConfig);
    console.log('✅ Test agent created:', agent.agent_id);

    // Clean up
    await retell.agent.delete(agent.agent_id);
    console.log('✅ Test agent cleaned up');

    return { success: true };
  } catch (error) {
    console.error('❌ Agent creation test failed:', error.message);
    if (error.status) {
      console.error('   Status:', error.status);
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('RETELL DEPLOYMENT SERVICE TEST');
  console.log('='.repeat(60));

  const serviceTest = await testDeploymentService();
  const agentTest = await testAgentCreation();

  console.log('\n📊 Test Summary:');
  console.log(
    '   Service Import:',
    serviceTest.success ? '✅ PASSED' : '❌ FAILED'
  );
  console.log(
    '   Agent Creation:',
    agentTest.success ? '✅ PASSED' : '❌ FAILED'
  );

  if (!serviceTest.success) {
    console.log('\n🔧 Service Issues:');
    console.log('  ', serviceTest.error);
  }

  if (!agentTest.success) {
    console.log('\n🔧 Agent Issues:');
    console.log('  ', agentTest.error);
  }

  if (serviceTest.success && agentTest.success) {
    console.log(
      '\n✨ All tests passed! The deployment service should be working.'
    );
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

runTests();
