const Retell = require('retell-sdk');
require('dotenv').config();

async function testLLMId() {
  try {
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    console.log('Testing LLM ID:', process.env.RETELL_LLM_ID);

    // Try to retrieve the specific LLM
    const llm = await retell.llm.retrieve(process.env.RETELL_LLM_ID);
    console.log('LLM found successfully:');
    console.log('- LLM ID:', llm.llm_id);
    console.log(
      '- General prompt:',
      llm.general_prompt ? llm.general_prompt.substring(0, 100) + '...' : 'N/A'
    );
    console.log('- Created:', llm.last_modification_timestamp);

    return true;
  } catch (error) {
    console.error('Error testing LLM ID:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }

    // Try to list all LLMs again
    console.log('\nListing all available LLMs:');
    try {
      const retell = new Retell({
        apiKey: process.env.RETELL_API_KEY,
      });

      const llms = await retell.llm.list();
      console.log(`Found ${llms.length} LLMs:`);
      llms.slice(0, 5).forEach((llm, index) => {
        console.log(`${index + 1}. ${llm.llm_id}`);
      });

      if (llms.length > 0) {
        console.log(`\nFirst available LLM ID: ${llms[0].llm_id}`);
      }
    } catch (listError) {
      console.error('Could not list LLMs:', listError.message);
    }

    return false;
  }
}

testLLMId();
