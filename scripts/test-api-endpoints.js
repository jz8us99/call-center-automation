const Retell = require('retell-sdk');
require('dotenv').config();

async function testAPIEndpoints() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('1. Testing agent.list()...');
    const agents = await retell.agent.list();
    console.log(`✓ SUCCESS: Found ${agents.length} agents`);

    console.log('\n2. Testing llm.list()...');
    const llms = await retell.llm.list();
    console.log(`✓ SUCCESS: Found ${llms.length} LLMs`);

    console.log('\n3. Testing phoneNumber.list()...');
    try {
      const phoneNumbers = await retell.phoneNumber.list();
      console.log(`✓ SUCCESS: Found ${phoneNumbers.length} phone numbers`);
    } catch (phoneError) {
      console.log(`⚠ Phone numbers error (might be normal):`, phoneError.message);
    }

    console.log('\n4. Testing specific agent retrieval...');
    if (agents.length > 0) {
      const firstAgent = await retell.agent.retrieve(agents[0].agent_id);
      console.log(`✓ SUCCESS: Retrieved agent ${firstAgent.agent_id}`);
    }

    console.log('\n5. Testing SDK version and methods...');
    console.log('Available methods on retell.agent:', Object.getOwnPropertyNames(retell.agent));

    return true;
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Status:', error.status);
    console.error('Error details:', error.error);
    return false;
  }
}

testAPIEndpoints();