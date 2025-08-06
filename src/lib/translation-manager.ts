// Translation Manager
// Handles automatic translation and multi-language agent duplication

import {
  SupportedLanguage,
  AIAgent,
  AgentConfiguration,
  AgentTranslation,
  DuplicateAgentRequest,
  SUPPORTED_LANGUAGES,
} from '@/types/ai-agent-types';
import { supabase } from './supabase-admin';

export interface TranslationService {
  translate(
    text: string,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<string>;
  detectLanguage(text: string): Promise<SupportedLanguage>;
  getBatchTranslation(
    texts: string[],
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<string[]>;
}

export class TranslationManager {
  private static instance: TranslationManager;
  private translationService: TranslationService;

  private constructor(translationService: TranslationService) {
    this.translationService = translationService;
  }

  public static getInstance(
    translationService?: TranslationService
  ): TranslationManager {
    if (!TranslationManager.instance) {
      if (!translationService) {
        throw new Error(
          'TranslationService is required for first instantiation'
        );
      }
      TranslationManager.instance = new TranslationManager(translationService);
    }
    return TranslationManager.instance;
  }

  /**
   * Duplicate an agent for a different language
   */
  public async duplicateAgentForLanguage(
    request: DuplicateAgentRequest
  ): Promise<AIAgent> {
    try {
      console.log(
        `Starting agent duplication for language: ${request.target_language}`
      );

      // 1. Get source agent with full configuration
      const sourceAgent = await this.getAgentWithConfiguration(
        request.source_agent_id
      );
      if (!sourceAgent) {
        throw new Error('Source agent not found');
      }

      // 2. Check if translation already exists
      const existingTranslation = await this.checkExistingTranslation(
        request.source_agent_id,
        request.target_language
      );

      if (existingTranslation) {
        throw new Error(
          `Agent translation already exists for language: ${request.target_language}`
        );
      }

      // 3. Get target language configuration
      const targetLanguageConfig = await this.getLanguageConfig(
        request.target_language
      );
      if (!targetLanguageConfig) {
        throw new Error(
          `Unsupported target language: ${request.target_language}`
        );
      }

      // 4. Create translated agent
      const translatedAgent = await this.createTranslatedAgent(
        sourceAgent,
        request.target_language,
        targetLanguageConfig,
        request.name,
        request.auto_translate !== false
      );

      // 5. Create agent configuration for translated agent
      if (sourceAgent.configuration) {
        await this.createTranslatedConfiguration(
          translatedAgent.id!,
          sourceAgent.configuration,
          sourceAgent.language_code!,
          request.target_language
        );
      }

      // 6. Create translation record
      await this.createTranslationRecord(
        request.source_agent_id,
        translatedAgent.id!,
        sourceAgent.language_code!,
        request.target_language
      );

      console.log(
        `Agent duplication completed for language: ${request.target_language}`
      );
      return translatedAgent;
    } catch (error) {
      console.error('Error in duplicateAgentForLanguage:', error);
      throw error;
    }
  }

  /**
   * Detect customer language from conversation
   */
  public async detectCustomerLanguage(
    conversationText: string
  ): Promise<SupportedLanguage> {
    try {
      const detectedLanguage =
        await this.translationService.detectLanguage(conversationText);

      // Validate against supported languages
      if (Object.values(SupportedLanguage).includes(detectedLanguage)) {
        return detectedLanguage;
      }

      // Default to English if unsupported language detected
      return SupportedLanguage.ENGLISH;
    } catch (error) {
      console.error('Error detecting language:', error);
      return SupportedLanguage.ENGLISH;
    }
  }

  /**
   * Auto-duplicate agent when language is detected
   */
  public async handleLanguageDetection(
    callId: string,
    sourceAgentId: string,
    detectedLanguage: SupportedLanguage
  ): Promise<string | null> {
    try {
      // Skip if already in detected language
      const sourceAgent = await this.getAgentWithConfiguration(sourceAgentId);
      if (sourceAgent?.language_code === detectedLanguage) {
        return sourceAgentId;
      }

      // Check if translation already exists
      const existingTranslation = await this.findTranslatedAgent(
        sourceAgentId,
        detectedLanguage
      );
      if (existingTranslation) {
        console.log(
          `Using existing translated agent: ${existingTranslation.id}`
        );
        return existingTranslation.id;
      }

      // Create new translation
      const duplicateRequest: DuplicateAgentRequest = {
        source_agent_id: sourceAgentId,
        target_language: detectedLanguage,
        auto_translate: true,
      };

      const translatedAgent =
        await this.duplicateAgentForLanguage(duplicateRequest);

      // Log the auto-duplication event
      await this.logAutoDuplication(
        callId,
        sourceAgentId,
        translatedAgent.id!,
        detectedLanguage
      );

      console.log(
        `Auto-created translated agent: ${translatedAgent.id} for language: ${detectedLanguage}`
      );
      return translatedAgent.id!;
    } catch (error) {
      console.error('Error in handleLanguageDetection:', error);
      return null;
    }
  }

  /**
   * Update translated agents when source agent changes
   */
  public async syncTranslatedAgents(
    sourceAgentId: string,
    updatedFields: Partial<AIAgent>
  ): Promise<void> {
    try {
      // Get all translated agents
      const { data: translations, error } = await supabase
        .from('agent_translations')
        .select(
          `
          target_agent_id,
          target_language_id,
          supported_languages!target_language_id(code)
        `
        )
        .eq('source_agent_id', sourceAgentId);

      if (error) throw error;

      if (!translations || translations.length === 0) {
        console.log('No translations found for agent:', sourceAgentId);
        return;
      }

      // Update each translated agent
      for (const translation of translations) {
        await this.updateTranslatedAgent(
          translation.target_agent_id,
          updatedFields,
          translation.supported_languages.code
        );
      }

      console.log(`Synced ${translations.length} translated agents`);
    } catch (error) {
      console.error('Error syncing translated agents:', error);
      throw error;
    }
  }

  /**
   * Get translation quality score
   */
  public async getTranslationQuality(
    sourceText: string,
    translatedText: string,
    targetLanguage: SupportedLanguage
  ): Promise<number> {
    try {
      // This would typically use a translation quality assessment service
      // For now, return a basic score based on text length similarity
      const lengthRatio = translatedText.length / sourceText.length;
      const baseScore = Math.min(1, lengthRatio) * 0.8;

      // Add language-specific adjustments
      const languageAdjustments: Record<SupportedLanguage, number> = {
        [SupportedLanguage.ENGLISH]: 0.0,
        [SupportedLanguage.SPANISH]: 0.1,
        [SupportedLanguage.CHINESE_SIMPLIFIED]: -0.1,
        [SupportedLanguage.ITALIAN]: 0.05,
      };

      const adjustment = languageAdjustments[targetLanguage] || 0;
      return Math.max(0, Math.min(1, baseScore + adjustment));
    } catch (error) {
      console.error('Error calculating translation quality:', error);
      return 0.5; // Default to medium quality
    }
  }

  // Private helper methods

  private async getAgentWithConfiguration(agentId: string): Promise<
    | (AIAgent & {
        configuration?: AgentConfiguration;
        language_code?: SupportedLanguage;
      })
    | null
  > {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select(
          `
          *,
          agent_configurations(*),
          supported_languages!language_id(code)
        `
        )
        .eq('id', agentId)
        .single();

      if (error) throw error;

      return {
        ...data,
        configuration: data.agent_configurations?.[0] || null,
        language_code:
          data.supported_languages?.code || SupportedLanguage.ENGLISH,
      };
    } catch (error) {
      console.error('Error getting agent with configuration:', error);
      return null;
    }
  }

  private async checkExistingTranslation(
    sourceAgentId: string,
    targetLanguage: SupportedLanguage
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agent_translations')
        .select('id')
        .eq('source_agent_id', sourceAgentId)
        .eq('target_language_id', await this.getLanguageId(targetLanguage))
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking existing translation:', error);
      return false;
    }
  }

  private async getLanguageConfig(language: SupportedLanguage) {
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('code', language)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting language config:', error);
      return null;
    }
  }

  private async getLanguageId(
    language: SupportedLanguage
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('id')
        .eq('code', language)
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error getting language ID:', error);
      return null;
    }
  }

  private async createTranslatedAgent(
    sourceAgent: AIAgent & {
      configuration?: AgentConfiguration;
      language_code?: SupportedLanguage;
    },
    targetLanguage: SupportedLanguage,
    targetLanguageConfig: any,
    customName?: string,
    autoTranslate: boolean = true
  ): Promise<AIAgent> {
    try {
      // Translate text fields
      const translatedFields = autoTranslate
        ? await this.translateAgentFields(
            sourceAgent,
            sourceAgent.language_code || SupportedLanguage.ENGLISH,
            targetLanguage
          )
        : {};

      // Create new agent data
      const newAgentData = {
        client_id: sourceAgent.client_id,
        agent_type_id: sourceAgent.agent_type_id,
        language_id: targetLanguageConfig.id,
        parent_agent_id: sourceAgent.id,
        name:
          customName ||
          translatedFields.name ||
          `${sourceAgent.name} (${targetLanguageConfig.native_name})`,
        description: translatedFields.description || sourceAgent.description,
        status: 'draft', // Always start as draft
        personality: sourceAgent.personality,
        voice_settings: this.adaptVoiceSettingsForLanguage(
          sourceAgent.voice_settings,
          targetLanguage
        ),
        business_context: sourceAgent.business_context,
        greeting_message:
          translatedFields.greeting_message || sourceAgent.greeting_message,
        prompt_template:
          translatedFields.prompt_template || sourceAgent.prompt_template,
        variables: sourceAgent.variables,
        integrations: sourceAgent.integrations,
      };

      const { data: newAgent, error } = await supabase
        .from('ai_agents')
        .insert(newAgentData)
        .select()
        .single();

      if (error) throw error;
      return newAgent;
    } catch (error) {
      console.error('Error creating translated agent:', error);
      throw error;
    }
  }

  private async translateAgentFields(
    agent: AIAgent,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<Partial<AIAgent>> {
    try {
      const fieldsToTranslate = [
        agent.name,
        agent.description || '',
        agent.greeting_message || '',
        agent.prompt_template || '',
      ].filter(Boolean);

      const translatedTexts = await this.translationService.getBatchTranslation(
        fieldsToTranslate,
        sourceLanguage,
        targetLanguage
      );

      return {
        name: translatedTexts[0] || agent.name,
        description: translatedTexts[1] || agent.description,
        greeting_message: translatedTexts[2] || agent.greeting_message,
        prompt_template: translatedTexts[3] || agent.prompt_template,
      };
    } catch (error) {
      console.error('Error translating agent fields:', error);
      return {};
    }
  }

  private adaptVoiceSettingsForLanguage(
    sourceVoiceSettings: any,
    targetLanguage: SupportedLanguage
  ): any {
    const languageSettings = SUPPORTED_LANGUAGES[targetLanguage];

    return {
      ...sourceVoiceSettings,
      ...languageSettings?.voice_settings,
      // Adjust speed for different languages
      speed: this.getLanguageSpeedAdjustment(
        targetLanguage,
        sourceVoiceSettings.speed || 1.0
      ),
    };
  }

  private getLanguageSpeedAdjustment(
    language: SupportedLanguage,
    baseSpeed: number
  ): number {
    const speedAdjustments: Record<SupportedLanguage, number> = {
      [SupportedLanguage.ENGLISH]: 1.0,
      [SupportedLanguage.SPANISH]: 0.95,
      [SupportedLanguage.CHINESE_SIMPLIFIED]: 0.9,
      [SupportedLanguage.ITALIAN]: 1.05,
    };

    return baseSpeed * (speedAdjustments[language] || 1.0);
  }

  private async createTranslatedConfiguration(
    translatedAgentId: string,
    sourceConfiguration: AgentConfiguration,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<void> {
    try {
      // Translate configuration text fields
      const translatedConfig = await this.translateConfigurationFields(
        sourceConfiguration,
        sourceLanguage,
        targetLanguage
      );

      const configData = {
        agent_id: translatedAgentId,
        ...sourceConfiguration,
        ...translatedConfig,
        id: undefined, // Remove ID to create new record
        created_at: undefined,
        updated_at: undefined,
      };

      const { error } = await supabase
        .from('agent_configurations')
        .insert(configData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating translated configuration:', error);
      throw error;
    }
  }

  private async translateConfigurationFields(
    config: AgentConfiguration,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<Partial<AgentConfiguration>> {
    try {
      // Extract translatable text from configuration
      const translatableTexts: string[] = [];
      const fieldMap: Array<{ path: string; index: number }> = [];

      // Add after hours message
      if (config.after_hours_message) {
        translatableTexts.push(config.after_hours_message);
        fieldMap.push({
          path: 'after_hours_message',
          index: translatableTexts.length - 1,
        });
      }

      // Add response templates
      if (config.response_templates) {
        Object.entries(config.response_templates).forEach(([key, template]) => {
          if (template.template) {
            translatableTexts.push(template.template);
            fieldMap.push({
              path: `response_templates.${key}.template`,
              index: translatableTexts.length - 1,
            });
          }
        });
      }

      // Add confirmation messages
      if (config.confirmation_messages) {
        Object.entries(config.confirmation_messages).forEach(
          ([key, message]) => {
            translatableTexts.push(message);
            fieldMap.push({
              path: `confirmation_messages.${key}`,
              index: translatableTexts.length - 1,
            });
          }
        );
      }

      if (translatableTexts.length === 0) {
        return {};
      }

      // Translate all texts
      const translatedTexts = await this.translationService.getBatchTranslation(
        translatableTexts,
        sourceLanguage,
        targetLanguage
      );

      // Build translated configuration
      const translatedConfig: any = {
        response_templates: { ...config.response_templates },
        confirmation_messages: { ...config.confirmation_messages },
      };

      // Apply translations
      fieldMap.forEach(({ path, index }) => {
        const translation = translatedTexts[index];
        if (translation) {
          if (path === 'after_hours_message') {
            translatedConfig.after_hours_message = translation;
          } else if (path.startsWith('response_templates.')) {
            const templateKey = path.split('.')[1];
            if (translatedConfig.response_templates[templateKey]) {
              translatedConfig.response_templates[templateKey].template =
                translation;
            }
          } else if (path.startsWith('confirmation_messages.')) {
            const messageKey = path.split('.')[1];
            translatedConfig.confirmation_messages[messageKey] = translation;
          }
        }
      });

      return translatedConfig;
    } catch (error) {
      console.error('Error translating configuration fields:', error);
      return {};
    }
  }

  private async createTranslationRecord(
    sourceAgentId: string,
    targetAgentId: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<void> {
    try {
      const sourceLanguageId = await this.getLanguageId(sourceLanguage);
      const targetLanguageId = await this.getLanguageId(targetLanguage);

      const translationData = {
        source_agent_id: sourceAgentId,
        target_agent_id: targetAgentId,
        source_language_id: sourceLanguageId,
        target_language_id: targetLanguageId,
        translation_method: 'automatic',
        translation_quality_score: 0.8, // Default score
        field_translations: {},
        template_translations: {},
      };

      const { error } = await supabase
        .from('agent_translations')
        .insert(translationData);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating translation record:', error);
      throw error;
    }
  }

  private async findTranslatedAgent(
    sourceAgentId: string,
    targetLanguage: SupportedLanguage
  ): Promise<{ id: string } | null> {
    try {
      const targetLanguageId = await this.getLanguageId(targetLanguage);

      const { data, error } = await supabase
        .from('agent_translations')
        .select(
          `
          target_agent_id,
          ai_agents!target_agent_id(id, status)
        `
        )
        .eq('source_agent_id', sourceAgentId)
        .eq('target_language_id', targetLanguageId)
        .single();

      if (error || !data) return null;

      return { id: data.target_agent_id };
    } catch (error) {
      console.error('Error finding translated agent:', error);
      return null;
    }
  }

  private async updateTranslatedAgent(
    targetAgentId: string,
    updatedFields: Partial<AIAgent>,
    targetLanguage: SupportedLanguage
  ): Promise<void> {
    try {
      // Only sync certain fields that should be kept in sync
      const syncableFields = [
        'status',
        'business_context',
        'variables',
        'integrations',
        'voice_settings',
      ];

      const fieldsToUpdate: any = {};

      syncableFields.forEach(field => {
        if (updatedFields[field as keyof AIAgent] !== undefined) {
          fieldsToUpdate[field] = updatedFields[field as keyof AIAgent];
        }
      });

      // Adapt voice settings for target language
      if (fieldsToUpdate.voice_settings) {
        fieldsToUpdate.voice_settings = this.adaptVoiceSettingsForLanguage(
          fieldsToUpdate.voice_settings,
          targetLanguage
        );
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        return;
      }

      const { error } = await supabase
        .from('ai_agents')
        .update(fieldsToUpdate)
        .eq('id', targetAgentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating translated agent:', error);
      throw error;
    }
  }

  private async logAutoDuplication(
    callId: string,
    sourceAgentId: string,
    targetAgentId: string,
    detectedLanguage: SupportedLanguage
  ): Promise<void> {
    try {
      // Log to call logs for tracking
      const { error } = await supabase
        .from('ai_call_logs')
        .update({
          custom_data: {
            auto_duplication: {
              source_agent_id: sourceAgentId,
              target_agent_id: targetAgentId,
              detected_language: detectedLanguage,
              timestamp: new Date().toISOString(),
            },
          },
        })
        .eq('call_id', callId);

      if (error) {
        console.error('Error logging auto-duplication:', error);
      }
    } catch (error) {
      console.error('Error in logAutoDuplication:', error);
    }
  }
}

// Mock Translation Service for development/testing
export class MockTranslationService implements TranslationService {
  async translate(
    text: string,
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<string> {
    // Mock translation - in production, use Google Translate, AWS Translate, etc.
    const translations: Record<string, Record<SupportedLanguage, string>> = {
      Hello: {
        [SupportedLanguage.SPANISH]: 'Hola',
        [SupportedLanguage.CHINESE_SIMPLIFIED]: '你好',
        [SupportedLanguage.ITALIAN]: 'Ciao',
        [SupportedLanguage.ENGLISH]: 'Hello',
      },
      'How can I help you?': {
        [SupportedLanguage.SPANISH]: '¿Cómo puedo ayudarte?',
        [SupportedLanguage.CHINESE_SIMPLIFIED]: '我能如何帮助您？',
        [SupportedLanguage.ITALIAN]: 'Come posso aiutarti?',
        [SupportedLanguage.ENGLISH]: 'How can I help you?',
      },
    };

    // Simple mock: add language prefix
    const languagePrefixes = {
      [SupportedLanguage.SPANISH]: '[ES]',
      [SupportedLanguage.CHINESE_SIMPLIFIED]: '[ZH]',
      [SupportedLanguage.ITALIAN]: '[IT]',
      [SupportedLanguage.ENGLISH]: '[EN]',
    };

    return (
      translations[text]?.[toLanguage] ||
      `${languagePrefixes[toLanguage]} ${text}`
    );
  }

  async detectLanguage(text: string): Promise<SupportedLanguage> {
    // Mock language detection
    if (text.includes('hola') || text.includes('español')) {
      return SupportedLanguage.SPANISH;
    }
    if (text.includes('你好') || text.includes('中文')) {
      return SupportedLanguage.CHINESE_SIMPLIFIED;
    }
    if (text.includes('ciao') || text.includes('italiano')) {
      return SupportedLanguage.ITALIAN;
    }
    return SupportedLanguage.ENGLISH;
  }

  async getBatchTranslation(
    texts: string[],
    fromLanguage: SupportedLanguage,
    toLanguage: SupportedLanguage
  ): Promise<string[]> {
    return Promise.all(
      texts.map(text => this.translate(text, fromLanguage, toLanguage))
    );
  }
}
