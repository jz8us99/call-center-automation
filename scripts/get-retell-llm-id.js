const Retell = require('retell-sdk');
require('dotenv').config();

async function getRetellLLMId() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY
    });

    console.log('Checking for existing LLM engines...');
    
    // First, try to list existing LLM engines
    try {
      const llms = await retell.llm.list();
      console.log('Found existing LLM engines:', llms.length);
      
      if (llms.length > 0) {
        console.log('Available LLM engines:');
        llms.forEach((llm, index) => {
          console.log(`${index + 1}. LLM ID: ${llm.llm_id}`);
          console.log(`   Model: ${llm.general_prompt || 'N/A'}`);
          console.log(`   Created: ${llm.last_modification_timestamp || 'N/A'}`);
        });
        
        // Use the first available LLM
        const llmId = llms[0].llm_id;
        console.log(`\nRecommended RETELL_LLM_ID: ${llmId}`);
        return llmId;
      }
    } catch (listError) {
      console.log('Could not list existing LLMs:', listError.message);
    }

    // If no existing LLMs found, create a new one
    console.log('Creating new LLM engine...');
    
    const newLLM = await retell.llm.create({
      general_prompt: "You are a helpful AI assistant for a call center. Be professional, concise, and helpful.",
      general_tools: [],
      inbound_dynamic_variables_webhook_url: null,
      states: []
    });
    
    console.log('Created new LLM engine:');
    console.log(`LLM ID: ${newLLM.llm_id}`);
    console.log(`\nAdd this to your .env file:`);
    console.log(`RETELL_LLM_ID=${newLLM.llm_id}`);
    
    return newLLM.llm_id;
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.error) {
      console.error('Details:', error.error);
    }
  }
}

getRetellLLMId();