require('dotenv').config();

async function testDeployEndpoint() {
  try {
    console.log('🔍 Testing /api/retell/deploy-single endpoint directly...\n');

    // Create a test JWT token (you'll need to replace this with a real token)
    // For now, let's test without auth to see the basic functionality
    const testPayload = {
      businessId: 'test-business-id',
      agentConfig: {
        id: 'test-agent-id',
        agent_name: 'Direct Test Agent',
        agent_type: 'receptionist',
        basic_info_prompt: 'You are a helpful AI receptionist.',
        call_scripts_prompt: 'Greet callers warmly.',
        call_scripts: { greeting_script: 'Hello! How can I help you?' },
        voice_settings: { speed: 1.0, pitch: 1.0 },
        retell_llm_id: process.env.RETELL_LLM_ID,
      },
    };

    console.log('📦 Request payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log(
      '\n🌐 Making request to localhost:19080/api/retell/deploy-single...'
    );

    const response = await fetch(
      'http://localhost:19080/api/retell/deploy-single',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token', // This will fail auth but we can see the error
        },
        body: JSON.stringify(testPayload),
      }
    );

    console.log('📊 Response status:', response.status);
    console.log(
      '📊 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    const responseText = await response.text();
    console.log('📊 Response body:', responseText);

    if (response.status === 500) {
      console.log('\n❌ 500 Internal Server Error detected!');
      try {
        const errorJson = JSON.parse(responseText);
        console.log('Error details:', errorJson);
      } catch (e) {
        console.log('Raw error text:', responseText);
      }
    }

    return {
      status: response.status,
      body: responseText,
    };
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return {
      error: error.message,
    };
  }
}

async function testWithCurl() {
  console.log('\n🔧 Also testing with curl for comparison...\n');

  const { exec } = require('child_process');

  return new Promise(resolve => {
    const curlCommand = `curl -X POST http://localhost:19080/api/retell/deploy-single -H "Content-Type: application/json" -H "Authorization: Bearer test-token" -d "{\\"businessId\\":\\"test-business\\",\\"agentConfig\\":{\\"agent_name\\":\\"Curl Test Agent\\",\\"retell_llm_id\\":\\"${process.env.RETELL_LLM_ID}\\"}}" -v`;

    exec(curlCommand, (error, stdout, stderr) => {
      console.log('Curl stdout:', stdout);
      console.log('Curl stderr:', stderr);
      if (error) {
        console.log('Curl error:', error.message);
      }
      resolve();
    });
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('DEPLOY ENDPOINT TEST');
  console.log('='.repeat(60));

  await testDeployEndpoint();
  await testWithCurl();
}

runTests();
