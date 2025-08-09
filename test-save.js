// Quick test script to debug the save issue
const testData = {
  client_id: "test-client-id",
  agent_type_id: "a946c78f-b5ad-4789-9457-07f7b58c32d4", // inbound_receptionist from our debug
  agent_name: "Test Agent",
  greeting_message: "Hello!",
  basic_info_prompt: "Test prompt",
  agent_personality: "professional",
  custom_instructions: "Test instructions"
};

console.log('Test payload:', JSON.stringify(testData, null, 2));

// Test the API endpoint
fetch('http://localhost:19080/api/agent-configurations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Test error:', error);
});