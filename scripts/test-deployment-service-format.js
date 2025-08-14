const Retell = require('retell-sdk');
require('dotenv').config();

class TestDeploymentService {
  constructor() {
    const apiKey = process.env.RETELL_API_KEY;
    console.log('Environment check:', {
      hasRetellApiKey: !!apiKey,
      hasLlmId: !!process.env.RETELL_LLM_ID,
      hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL
    });
    
    if (!apiKey) {
      throw new Error('RETELL_API_KEY environment variable is required');
    }
    
    this.retell = new Retell({
      apiKey: apiKey
    });
  }

  async deployRouterAgent(businessId) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:19080';
      const webhookUrl = `${baseUrl}/api/retell/functions/appointment`;

      // Create comprehensive agent config based on sample working agent
      const agentConfig = {
        agent_name: "Test Router Agent " + Date.now(),
        response_engine: {
          type: 'retell-llm',
          llm_id: process.env.RETELL_LLM_ID || 'llm_ba444ac5590c17ac478b7dcfdde2'
        },
        voice_id: '11labs-Adrian',
        language: 'en-US',
        webhook_url: webhookUrl,
        voice_temperature: 1,
        voice_speed: 1.28,
        volume: 1,
        enable_backchannel: true,
        backchannel_words: ['mhm', 'uh-huh'],
        max_call_duration_ms: 1800000, // 30 minutes
        interruption_sensitivity: 0.9,
        normalize_for_speech: true,
        begin_message_delay_ms: 200,
        post_call_analysis_model: 'gpt-4o-mini'
      };

      console.log('Creating router agent with config:', JSON.stringify(agentConfig, null, 2));

      // Check if agent already exists (skip for test)
      // const existingAgents = await this.retell.agent.list();

      // Create new agent exactly like the service does
      const agent = await this.retell.agent.create(agentConfig);
      console.log('SUCCESS! Agent created:', agent.agent_id);
      
      // Clean up
      await this.retell.agent.delete(agent.agent_id);
      console.log('Test agent deleted');

      return agent;
    } catch (error) {
      console.error('Error deploying router agent:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        error: error.error
      });
      return null;
    }
  }
}

async function testDeploymentServiceFormat() {
  try {
    console.log('Testing deployment service format...');
    
    const service = new TestDeploymentService();
    const result = await service.deployRouterAgent('test-business-id');
    
    if (result) {
      console.log('✓ Deployment service format works!');
    } else {
      console.log('❌ Deployment service format failed');
    }
    
  } catch (error) {
    console.error('Error testing deployment service format:', error.message);
    console.error('Full error:', error);
  }
}

testDeploymentServiceFormat();