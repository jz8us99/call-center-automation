const Retell = require('retell-sdk');
require('dotenv').config();

async function listAgents() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('Listing existing agents...');
    
    const agents = await retell.agent.list();
    console.log(`Found ${agents.length} existing agents:`);
    
    agents.slice(0, 5).forEach((agent, index) => {
      console.log(`${index + 1}. Agent ID: ${agent.agent_id}`);
      console.log(`   Name: ${agent.agent_name}`);
      console.log(`   Response Engine: ${agent.response_engine?.type || 'N/A'}`);
      console.log(`   LLM ID: ${agent.response_engine?.llm_id || 'N/A'}`);
      console.log('---');
    });
    
    if (agents.length > 0) {
      console.log('\nSample agent structure:');
      console.log(JSON.stringify(agents[0], null, 2));
    }
    
  } catch (error) {
    console.error('Error listing agents:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
  }
}

listAgents();