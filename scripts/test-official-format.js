const Retell = require('retell-sdk');
require('dotenv').config();

async function testOfficialFormat() {
  try {
    const client = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    console.log('Testing with official documentation format...');
    
    // Exact format from Retell documentation
    const agentConfig = {
      response_engine: {
        llm_id: process.env.RETELL_LLM_ID,
        type: 'retell-llm'
      },
      voice_id: '11labs-Adrian'
    };
    
    console.log('Agent config:', JSON.stringify(agentConfig, null, 2));
    
    const agentResponse = await client.agent.create(agentConfig);
    console.log('SUCCESS! Agent created:', agentResponse.agent_id);
    
    // Clean up
    await client.agent.delete(agentResponse.agent_id);
    console.log('Test agent deleted');
    
    return true;
  } catch (error) {
    console.error('Error with official format:', error.message);
    console.error('Status:', error.status);
    console.error('Error details:', error.error || error);
    
    // Try with minimal required fields only
    console.log('\nTrying with even more minimal config...');
    try {
      const client = new Retell({
        apiKey: process.env.RETELL_API_KEY,
      });
      
      const minimalConfig = {
        response_engine: {
          type: 'retell-llm',
          llm_id: process.env.RETELL_LLM_ID
        }
      };
      
      console.log('Minimal config:', JSON.stringify(minimalConfig, null, 2));
      const agentResponse = await client.agent.create(minimalConfig);
      console.log('SUCCESS with minimal! Agent created:', agentResponse.agent_id);
      
      // Clean up
      await client.agent.delete(agentResponse.agent_id);
      console.log('Minimal test agent deleted');
      
    } catch (minimalError) {
      console.error('Minimal config also failed:', minimalError.message);
      console.error('Minimal error details:', minimalError.error || minimalError);
    }
    
    return false;
  }
}

testOfficialFormat();