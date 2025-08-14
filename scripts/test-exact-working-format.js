const Retell = require('retell-sdk');
require('dotenv').config();

async function testExactWorkingFormat() {
  try {
    const client = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    console.log('Testing with exact working format from sample...');
    
    // Exact minimal working config that succeeded before
    const agentConfig = {
      agent_name: "Test Agent " + Date.now(),
      response_engine: {
        type: 'retell-llm',
        llm_id: process.env.RETELL_LLM_ID
      },
      voice_id: '11labs-Adrian',
      language: 'en-US',
      webhook_url: 'https://demo1492.ddns.net/api/retell-webhook',
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
    
    const agentResponse = await client.agent.create(agentConfig);
    console.log('SUCCESS! Agent created:', agentResponse.agent_id);
    console.log('Full response:', JSON.stringify(agentResponse, null, 2));
    
    // Store the created agent ID
    const createdAgentId = agentResponse.agent_id;
    
    // Now update the agent to make sure update works too
    const updateConfig = {
      agent_name: agentConfig.agent_name + " - Updated"
    };
    
    const updateResponse = await client.agent.update(createdAgentId, updateConfig);
    console.log('Update successful:', updateResponse.agent_id);
    
    // Clean up
    await client.agent.delete(createdAgentId);
    console.log('Test agent deleted');
    
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Status:', error.status);
    console.error('Error details:', error.error || error);
    
    // If this fails, try even simpler version
    console.log('\nTrying simplest possible config...');
    try {
      const client = new Retell({
        apiKey: process.env.RETELL_API_KEY,
      });
      
      const simpleConfig = {
        response_engine: {
          type: 'retell-llm',
          llm_id: process.env.RETELL_LLM_ID
        },
        voice_id: '11labs-Adrian'
      };
      
      console.log('Simple config:', JSON.stringify(simpleConfig, null, 2));
      const agentResponse = await client.agent.create(simpleConfig);
      console.log('SUCCESS with simple config! Agent:', agentResponse.agent_id);
      
      // Clean up
      await client.agent.delete(agentResponse.agent_id);
      console.log('Simple test agent deleted');
      
    } catch (simpleError) {
      console.error('Simple config also failed:', simpleError.message);
      console.error('Simple error details:', simpleError.error || simpleError);
    }
    
    return false;
  }
}

testExactWorkingFormat();