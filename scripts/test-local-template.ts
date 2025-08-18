/**
 * Test script for local template loading
 * Usage: npx tsx scripts/test-local-template.ts
 */

import { RetellTemplateService } from '../src/lib/services/retell-template-service';

async function testLocalTemplateLoading() {
  console.log('=== Testing Local Template Loading ===\n');

  const templateService = new RetellTemplateService();

  try {
    // List available templates
    console.log('📁 Listing available templates...');
    const availableTemplates = await templateService.listAvailableTemplates();
    console.log('Available templates:', availableTemplates);

    if (availableTemplates.length === 0) {
      console.error('❌ No templates found in src/agent-template/');
      return false;
    }

    // Test parsing template filename
    const firstTemplate = availableTemplates[0];
    const parsed = templateService.parseTemplateFilename(firstTemplate);
    console.log('\n🔍 Parsed template info:', parsed);

    if (!parsed) {
      console.error('❌ Failed to parse template filename:', firstTemplate);
      return false;
    }

    // Test loading template from local file
    console.log('\n📖 Loading template from local file...');
    const template = await templateService.loadTemplate(
      parsed.businessType,
      parsed.agentRole,
      parsed.version
    );

    console.log('✅ Template loaded successfully!');
    console.log('\n📋 Template structure:');
    console.log({
      filename: firstTemplate,
      agentName: template.agent_name,
      hasAgentConfig: !!template.agent_name,
      hasLlmData: !!template.retellLlmData,
      hasTools: !!template.retellLlmData?.general_tools,
      toolsCount: template.retellLlmData?.general_tools?.length || 0,
      postCallFieldsCount: template.post_call_analysis_data?.length || 0,
      voiceId: template.voice_id,
      language: template.language,
    });

    // Test LLM data structure
    if (template.retellLlmData) {
      console.log('\n🤖 LLM Data structure:');
      console.log({
        model: template.retellLlmData.model,
        hasPrompt: !!template.retellLlmData.general_prompt,
        promptLength: template.retellLlmData.general_prompt?.length || 0,
        beginMessage: template.retellLlmData.begin_message,
        startSpeaker: template.retellLlmData.start_speaker,
      });
    }

    return true;
  } catch (error) {
    console.error(
      '❌ Failed to load template:',
      error instanceof Error ? error.message : error
    );
    console.error('Error details:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Local Template Loading Test...\n');

  const success = await testLocalTemplateLoading();

  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ All tests passed! Local template loading works correctly.');
  } else {
    console.log('❌ Tests failed. Please check the output above.');
  }

  process.exit(success ? 0 : 1);
}

// Run the test
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
