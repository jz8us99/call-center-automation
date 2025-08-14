const Retell = require('retell-sdk');
require('dotenv').config();

async function testCreateAgent() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('Testing agent creation with minimal config...');
    
    const agentConfig = {
      agent_name: "Test Agent - " + Date.now(),
      system_prompt: "You are a helpful AI assistant.",
      response_engine: {
        type: 'retell-llm',
        llm_id: process.env.RETELL_LLM_ID
      },
      voice_id: 'nova',
      enable_voicemail: false,
      max_call_duration: 1800,
      enable_call_analysis: true
    };
    
    console.log('Agent config:', JSON.stringify(agentConfig, null, 2));
    
    const agent = await retell.agent.create(agentConfig);
    console.log('Agent created successfully:');
    console.log('- Agent ID:', agent.agent_id);
    console.log('- Agent Name:', agent.agent_name);
    
    // Clean up by deleting the test agent
    await retell.agent.delete(agent.agent_id);
    console.log('Test agent deleted successfully');
    
    return true;
  } catch (error) {
    console.error('Error creating agent:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.error) {
      console.error('Error details:', JSON.stringify(error.error, null, 2));
    }
    return false;
  }
}

testCreateAgent();