import { supabase } from '../supabase';
import Retell from 'retell-sdk';

export interface LLMConfig {
  id?: string;
  llm_id: string;
  llm_name: string;
  description?: string;
  model?: string;
  is_active: boolean;
  is_default: boolean;
  capabilities?: Record<string, unknown>;
}

export interface AgentLLMAssignment {
  agent_config_id: string;
  llm_id: string;
}

export class LLMManagementService {
  private retell: Retell;

  constructor() {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      throw new Error('RETELL_API_KEY environment variable is required');
    }

    this.retell = new Retell({ apiKey });
  }

  /**
   * Fetch and sync LLM configurations from Retell
   */
  async syncLLMsFromRetell(): Promise<{
    success: boolean;
    llms?: any[];
    error?: string;
  }> {
    try {
      // Fetch LLMs from Retell
      const retellLLMs = await this.retell.llm.list();

      // Store/update LLMs in database
      for (const llm of retellLLMs) {
        const llmConfig: Partial<LLMConfig> = {
          llm_id: llm.llm_id,
          llm_name: `LLM ${llm.llm_id.slice(-6)} - ${llm.model}`,
          model: llm.model,
          description: llm.general_prompt?.substring(0, 200) + '...',
          is_active: llm.is_published,
          capabilities: {
            version: llm.version,
            start_speaker: llm.start_speaker,
            has_states: llm.states?.length > 0,
          },
        };

        await supabase.from('retell_llm_configs').upsert(
          {
            ...llmConfig,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'llm_id',
          }
        );
      }

      return {
        success: true,
        llms: retellLLMs,
      };
    } catch (error) {
      console.error('Error syncing LLMs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync LLMs',
      };
    }
  }

  /**
   * Get all available LLM configurations
   */
  async getAvailableLLMs(): Promise<LLMConfig[]> {
    const { data, error } = await supabase
      .from('retell_llm_configs')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('llm_name');

    if (error) {
      console.error('Error fetching LLMs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get the default LLM configuration
   */
  async getDefaultLLM(): Promise<LLMConfig | null> {
    const { data, error } = await supabase
      .from('retell_llm_configs')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Error fetching default LLM:', error);
      return null;
    }

    return data;
  }

  /**
   * Set a new default LLM
   */
  async setDefaultLLM(
    llmId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, unset current default
      await supabase
        .from('retell_llm_configs')
        .update({ is_default: false })
        .eq('is_default', true);

      // Set new default
      const { error } = await supabase
        .from('retell_llm_configs')
        .update({
          is_default: true,
          updated_at: new Date().toISOString(),
        })
        .eq('llm_id', llmId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting default LLM:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to set default LLM',
      };
    }
  }

  /**
   * Assign an LLM to a specific agent configuration
   */
  async assignLLMToAgent(
    agentConfigId: string,
    llmId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify LLM exists and is active
      const { data: llm, error: llmError } = await supabase
        .from('retell_llm_configs')
        .select('llm_id')
        .eq('llm_id', llmId)
        .eq('is_active', true)
        .single();

      if (llmError || !llm) {
        throw new Error(`LLM ${llmId} not found or not active`);
      }

      // Update agent configuration
      const { error } = await supabase
        .from('agent_configurations_scoped')
        .update({
          retell_llm_id: llmId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentConfigId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error assigning LLM to agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign LLM',
      };
    }
  }

  /**
   * Bulk assign an LLM to multiple agents
   */
  async bulkAssignLLM(
    agentConfigIds: string[],
    llmId: string
  ): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      // Verify LLM exists
      const { data: llm, error: llmError } = await supabase
        .from('retell_llm_configs')
        .select('llm_id')
        .eq('llm_id', llmId)
        .eq('is_active', true)
        .single();

      if (llmError || !llm) {
        throw new Error(`LLM ${llmId} not found or not active`);
      }

      // Update all agent configurations
      const { data, error } = await supabase
        .from('agent_configurations_scoped')
        .update({
          retell_llm_id: llmId,
          updated_at: new Date().toISOString(),
        })
        .in('id', agentConfigIds);

      if (error) {
        throw error;
      }

      return {
        success: true,
        updated: data?.length || 0,
      };
    } catch (error) {
      console.error('Error bulk assigning LLM:', error);
      return {
        success: false,
        updated: 0,
        error:
          error instanceof Error ? error.message : 'Failed to bulk assign LLM',
      };
    }
  }

  /**
   * Get agents using a specific LLM
   */
  async getAgentsByLLM(llmId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('agent_configurations_scoped')
      .select(
        `
        id,
        agent_name,
        client_id,
        agent_type_id,
        is_active,
        agent_types (
          name,
          type_code
        )
      `
      )
      .eq('retell_llm_id', llmId);

    if (error) {
      console.error('Error fetching agents by LLM:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create or update an LLM configuration
   */
  async upsertLLMConfig(llmConfig: Partial<LLMConfig>): Promise<{
    success: boolean;
    data?: LLMConfig;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('retell_llm_configs')
        .upsert(
          {
            ...llmConfig,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'llm_id',
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error upserting LLM config:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to upsert LLM config',
      };
    }
  }

  /**
   * Get agent configurations with their assigned LLMs
   */
  async getAgentConfigurationsWithLLMs(clientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('agent_configurations_scoped')
      .select(
        `
        *,
        retell_llm_configs!retell_llm_id (
          llm_id,
          llm_name,
          model,
          description
        ),
        agent_types (
          name,
          type_code
        )
      `
      )
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching agent configurations with LLMs:', error);
      return [];
    }

    return data || [];
  }
}

// Export singleton instance
export const llmManagementService = new LLMManagementService();
