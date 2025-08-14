const Retell = require('retell-sdk').default;
require('dotenv').config();

async function testCreateAgent() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('Testing agent creation with correct format...');
    
    // Use the exact format that works from existing agents
    const agentConfig = {
      agent_name: "Test Agent - " + Date.now(),
      response_engine: {
        type: 'retell-llm',
        llm_id: process.env.RETELL_LLM_ID
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
    
    console.log('Agent config:', JSON.stringify(agentConfig, null, 2));
    console.log('\nCreating agent...');
    
    const agent = await retell.agent.create(agentConfig);
    console.log('\n✅ Agent created successfully!');
    console.log('- Agent ID:', agent.agent_id);
    console.log('- Agent Name:', agent.agent_name);
    console.log('- LLM ID:', agent.response_engine?.llm_id);
    
    // Clean up by deleting the test agent
    console.log('\nCleaning up test agent...');
    await retell.agent.delete(agent.agent_id);
    console.log('✅ Test agent deleted successfully');
    
    return true;
  } catch (error) {
    console.error('\n❌ Error creating agent:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.error) {
      console.error('Error details:', JSON.stringify(error.error, null, 2));
    }
    if (error.response) {
      console.error('Response:', error.response);
    }
    return false;
  }
}

testCreateAgent();