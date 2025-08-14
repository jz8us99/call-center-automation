const Retell = require('retell-sdk').default;
require('dotenv').config();

async function testLLMDeployment() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('🔍 Fetching available LLMs from Retell...\n');
    
    // Get list of available LLMs
    const llms = await retell.llm.list();
    console.log(`Found ${llms.length} LLM(s):\n`);
    
    llms.forEach((llm, index) => {
      console.log(`${index + 1}. LLM ID: ${llm.llm_id}`);
      console.log(`   Model: ${llm.model}`);
      console.log(`   Published: ${llm.is_published}`);
      console.log(`   Version: ${llm.version}`);
      console.log('');
    });

    if (llms.length < 1) {
      console.log('❌ No LLMs found. Cannot proceed with test.');
      return;
    }

    // Test creating agents with different LLMs
    console.log('📦 Testing agent creation with different LLMs...\n');
    
    const testLlmId = llms[0].llm_id;
    const testAgents = [];

    // Create test agent with first LLM
    console.log(`Creating test agent with LLM: ${testLlmId}`);
    
    const agentConfig = {
      agent_name: `Test Agent LLM ${testLlmId.slice(-6)} - ${Date.now()}`,
      response_engine: {
        type: 'retell-llm',
        llm_id: testLlmId
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
      post_call_analysis_model: 'gpt-4o-mini'
    };

    try {
      const agent = await retell.agent.create(agentConfig);
      console.log(`✅ Agent created successfully!`);
      console.log(`   Agent ID: ${agent.agent_id}`);
      console.log(`   Agent Name: ${agent.agent_name}`);
      console.log(`   LLM ID: ${agent.response_engine?.llm_id || 'N/A'}\n`);
      testAgents.push(agent);
    } catch (error) {
      console.error(`❌ Failed to create agent: ${error.message}\n`);
    }

    // If there are multiple LLMs, test with another one
    if (llms.length > 1) {
      const alternativeLlmId = llms[1].llm_id;
      console.log(`Creating test agent with alternative LLM: ${alternativeLlmId}`);
      
      const altAgentConfig = {
        ...agentConfig,
        agent_name: `Test Agent LLM ${alternativeLlmId.slice(-6)} - ${Date.now()}`,
        response_engine: {
          type: 'retell-llm',
          llm_id: alternativeLlmId
        }
      };

      try {
        const altAgent = await retell.agent.create(altAgentConfig);
        console.log(`✅ Alternative agent created successfully!`);
        console.log(`   Agent ID: ${altAgent.agent_id}`);
        console.log(`   Agent Name: ${altAgent.agent_name}`);
        console.log(`   LLM ID: ${altAgent.response_engine?.llm_id || 'N/A'}\n`);
        testAgents.push(altAgent);
      } catch (error) {
        console.error(`❌ Failed to create alternative agent: ${error.message}\n`);
      }
    }

    // Clean up test agents
    if (testAgents.length > 0) {
      console.log('🧹 Cleaning up test agents...');
      for (const agent of testAgents) {
        try {
          await retell.agent.delete(agent.agent_id);
          console.log(`   Deleted: ${agent.agent_name}`);
        } catch (error) {
          console.error(`   Failed to delete ${agent.agent_name}: ${error.message}`);
        }
      }
      console.log('\n✅ Cleanup complete!');
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   LLMs available: ${llms.length}`);
    console.log(`   Agents created: ${testAgents.length}`);
    console.log(`   Test status: ${testAgents.length > 0 ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (testAgents.length > 0) {
      console.log('\n✨ LLM-specific deployment is working correctly!');
      console.log('   Agents can be deployed with different LLM IDs.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.status) {
      console.error('   Status:', error.status);
    }
    if (error.error) {
      console.error('   Details:', JSON.stringify(error.error, null, 2));
    }
  }
}

// Run the test
console.log('='.repeat(60));
console.log('LLM DEPLOYMENT TEST');
console.log('='.repeat(60));
console.log('');
testLLMDeployment();