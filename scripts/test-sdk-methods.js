const Retell = require('retell-sdk');
require('dotenv').config();

async function testSDKMethods() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    console.log('Testing SDK method structure...');
    console.log('retell object keys:', Object.keys(retell));
    console.log('retell.agent object:', retell.agent);
    console.log(
      'retell.agent methods:',
      retell.agent
        ? Object.getOwnPropertyNames(Object.getPrototypeOf(retell.agent))
        : 'N/A'
    );

    // Try different method names that might exist
    const possibleMethods = ['create', 'createAgent', 'post', 'add'];

    for (const method of possibleMethods) {
      if (retell.agent && typeof retell.agent[method] === 'function') {
        console.log(`✓ Found method: retell.agent.${method}`);
      } else {
        console.log(`✗ No method: retell.agent.${method}`);
      }
    }

    // Check if there's a different way to create agents
    console.log('\nChecking for alternative creation methods...');

    // Try direct HTTP approach
    console.log('Testing direct API call approach...');

    const response = await fetch('https://api.retellai.com/create-agent', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_name: 'Direct API Test',
        response_engine: {
          type: 'retell-llm',
          llm_id: process.env.RETELL_LLM_ID,
        },
        voice_id: 'nova',
      }),
    });

    console.log('Direct API response status:', response.status);
    const responseText = await response.text();
    console.log('Direct API response:', responseText);
  } catch (error) {
    console.error('Error testing SDK methods:', error.message);
    console.error('Full error:', error);
  }
}

testSDKMethods();
