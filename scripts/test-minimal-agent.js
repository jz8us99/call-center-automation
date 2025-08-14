const Retell = require('retell-sdk');
require('dotenv').config();

async function testMinimalAgent() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('Testing minimal agent creation...');
    
    // Try creating the absolute minimal agent possible
    const agentConfig = {
      agent_name: "Minimal Test Agent",
      response_engine: {
        type: 'retell-llm',
        llm_id: process.env.RETELL_LLM_ID
      },
      voice_id: 'nova'
    };
    
    console.log('Creating agent with config:', JSON.stringify(agentConfig, null, 2));
    
    const agent = await retell.agent.create(agentConfig);
    console.log('SUCCESS! Agent created:', agent.agent_id);
    
    // Clean up
    await retell.agent.delete(agent.agent_id);
    console.log('Test agent deleted');
    
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Status:', error.status);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return false;
  }
}

testMinimalAgent();