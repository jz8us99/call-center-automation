const Retell = require('retell-sdk');
require('dotenv').config();

async function testCorrectEndpoint() {
  try {
    // Based on Retell docs, the correct endpoint should be /agent, not /create-agent
    console.log('Testing correct Retell API endpoint...');
    
    const response = await fetch('https://api.retellai.com/agent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_name: "Correct Endpoint Test",
        response_engine: {
          type: 'retell-llm',
          llm_id: process.env.RETELL_LLM_ID
        },
        voice_id: 'nova',
        language: 'en-US'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✓ SUCCESS! Agent created:', result.agent_id);
      
      // Clean up - delete the test agent
      const deleteResponse = await fetch(`https://api.retellai.com/agent/${result.agent_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.RETELL_API_KEY}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('✓ Test agent cleaned up');
      }
    } else {
      console.log('❌ API call failed');
      
      // Try to get more info about the error
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }

  } catch (error) {
    console.error('Error testing correct endpoint:', error.message);
    console.error('Full error:', error);
  }
}

testCorrectEndpoint();