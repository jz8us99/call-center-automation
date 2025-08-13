'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { authenticatedFetch } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon,
  SettingsIcon,
  EditIcon,
  TrashIcon,
  PhoneIcon,
  UsersIcon as UserIcon,
  MicIcon,
} from '@/components/icons';
import { AgentTypeCallScripts } from '../ai-agents/AgentTypeCallScripts';
import { AgentTypeVoiceSettings } from '../ai-agents/AgentTypeVoiceSettings';
import { AgentTypeCallRouting } from '../ai-agents/AgentTypeCallRouting';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';

interface AIAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  agent_personality: 'professional' | 'friendly' | 'technical';
  greeting_message?: string;
  custom_instructions?: string;
  basic_info_prompt?: string;
  call_scripts_prompt?: string;
  status: 'draft' | 'active' | 'inactive';
  retell_agent_id?: string;
  webhook_url?: string;
  call_scripts?: Record<string, unknown>;
  voice_settings?: Record<string, unknown>;
  call_routing?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface AIAgentsStepProps {
  user: User;
  onConfigurationUpdate: (isComplete: boolean) => void;
}

const AGENT_TYPES = {
  [AgentType.INBOUND_RECEPTIONIST]: {
    name: 'Inbound Receptionist',
    description: 'Professional phone receptionist handling incoming calls',
    icon: PhoneIcon,
    capabilities: [
      'Answer calls professionally',
      'Schedule appointments',
      'Provide business information',
      'Route calls to staff',
      'Take messages',
    ],
  },
  [AgentType.INBOUND_CUSTOMER_SUPPORT]: {
    name: 'Inbound Customer Support',
    description: 'Dedicated support for customer issues and complaints',
    icon: UserIcon,
    capabilities: [
      'Technical troubleshooting',
      'Issue resolution',
      'Complaint handling',
      'Service explanations',
      'Escalation management',
    ],
  },
  [AgentType.OUTBOUND_FOLLOW_UP]: {
    name: 'Outbound Follow-up',
    description: 'Follow-up calls for appointments and customer care',
    icon: PhoneIcon,
    capabilities: [
      'Appointment confirmations',
      'Reminder calls',
      'Post-service follow-up',
      'Rescheduling assistance',
      'Customer satisfaction surveys',
    ],
  },
  [AgentType.OUTBOUND_MARKETING]: {
    name: 'Outbound Marketing',
    description: 'Marketing calls for lead generation and promotions',
    icon: PhoneIcon,
    capabilities: [
      'Lead qualification',
      'Sales presentations',
      'Promotional campaigns',
      'Consultation scheduling',
      'Market research',
    ],
  },
};

export function AIAgentsStep({
  user,
  onConfigurationUpdate,
}: AIAgentsStepProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const t = useTranslations('aiAgents');
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [activeSection, setActiveSection] = useState<
    'basic' | 'scripts' | 'voice' | 'routing'
  >('basic');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    agent_name: '',
    agent_type: '',
    agent_personality: 'professional' as
      | 'professional'
      | 'friendly'
      | 'technical',
    greeting_message: '',
    custom_instructions: '',
    basic_info_prompt: '',
    call_scripts_prompt: '',
    voice_settings: {
      speed: 1.0,
      pitch: 1.0,
      tone: 'professional',
      voice_id: 'sarah-professional',
      accent: 'american',
      gender: 'female',
    },
    call_routing: {
      default_action: 'transfer',
      escalation_number: '',
      business_hours_action: 'transfer',
      after_hours_action: 'voicemail',
      rules: [] as any[],
    },
  });

  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [savingTab, setSavingTab] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    [key: string]: 'success' | 'error' | null;
  }>({});
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    loadAgents();
    loadBusinessInfo();
  }, [user]);

  const loadBusinessInfo = async () => {
    try {
      const response = await authenticatedFetch(
        `/api/business/profile?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setBusinessInfo(data.profile);
      }
    } catch (error) {
      console.error('Failed to load business info:', error);
    }
  };

  useEffect(() => {
    onConfigurationUpdate(agents.length > 0);
  }, [agents.length, onConfigurationUpdate]);

  useEffect(() => {
    loadAgents();
  }, [user.id]);

  const loadAgents = async () => {
    try {
      setLoading(true);

      // Fetch agent configurations from API
      const response = await authenticatedFetch(
        `/api/business/agent-configurations?user_id=${user.id}`
      );

      if (response.ok) {
        const data = await response.json();
        // Transform the API response to match our AIAgent interface
        const transformedAgents = (data.configurations || []).map(
          (config: any) => ({
            id: config.id,
            agent_name: config.agent_name,
            agent_type: config.agent_types?.type_code || config.agent_type,
            agent_personality: config.agent_personality || 'professional',
            greeting_message: config.greeting_message,
            custom_instructions: config.custom_instructions,
            basic_info_prompt: config.basic_info_prompt,
            call_scripts: config.call_scripts || {},
            voice_settings: config.voice_settings || {},
            call_routing: config.call_routing || {},
            status: config.is_active ? 'active' : 'inactive',
            created_at: config.created_at,
            updated_at: config.updated_at,
          })
        );
        setAgents(transformedAgents);
      } else {
        console.warn('Failed to fetch agents, using empty array');
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to load AI agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setFormData({
      agent_name: '',
      agent_type: '',
      agent_personality: 'professional',
      greeting_message: '',
      custom_instructions: '',
      basic_info_prompt: '',
      call_scripts_prompt: '',
      voice_settings: {
        speed: 1.0,
        pitch: 1.0,
        tone: 'professional',
        voice_id: 'sarah-professional',
        accent: 'american',
        gender: 'female',
      },
      call_routing: {
        default_action: 'transfer',
        escalation_number: '',
        business_hours_action: 'transfer',
        after_hours_action: 'voicemail',
        rules: [] as any[],
      },
    });
    setActiveSection('basic');
    setShowCreateForm(true);
  };

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
    setFormData({
      agent_name: agent.agent_name,
      agent_type: agent.agent_type,
      agent_personality: agent.agent_personality,
      greeting_message: agent.greeting_message || '',
      custom_instructions: agent.custom_instructions || '',
      basic_info_prompt: agent.basic_info_prompt || '',
      call_scripts_prompt: agent.call_scripts_prompt || '',
      voice_settings: (agent.voice_settings as any) || {
        speed: 1.0,
        pitch: 1.0,
        tone: 'professional',
        voice_id: 'sarah-professional',
        accent: 'american',
        gender: 'female',
      },
      call_routing: (agent.call_routing as any) || {
        default_action: 'transfer',
        escalation_number: '',
        business_hours_action: 'transfer',
        after_hours_action: 'voicemail',
        rules: [],
      },
    });
    setActiveSection('basic');
    setShowCreateForm(true);
  };

  const generatePrompt = async () => {
    if (!formData.agent_type || !formData.agent_personality) {
      toast.error(
        'Please select agent type and personality before generating prompt'
      );
      return;
    }

    try {
      setGeneratingPrompt(true);

      // Generate both regular prompts and basic info prompt in parallel
      const [promptResponse, basicPromptResponse] = await Promise.all([
        authenticatedFetch(
          `/api/business/generate-agent-prompt?user_id=${user.id}&agent_type=${formData.agent_type}&personality=${formData.agent_personality}`
        ),
        authenticatedFetch(
          `/api/business/generate-basic-prompt?user_id=${user.id}&agent_type=${formData.agent_type}`
        ),
      ]);

      if (!promptResponse.ok || !basicPromptResponse.ok) {
        throw new Error('Failed to generate prompts');
      }

      const [promptData, basicPromptData] = await Promise.all([
        promptResponse.json(),
        basicPromptResponse.json(),
      ]);

      // Update form with all generated content
      setFormData(prev => ({
        ...prev,
        greeting_message: promptData.generated_prompt.greeting_message,
        custom_instructions: promptData.generated_prompt.custom_instructions,
        basic_info_prompt: basicPromptData.basic_info_prompt,
      }));

      // Show success message
      toast.success(
        `Generated comprehensive prompts using your business data:\n• Greeting Message\n• Basic Information Prompt\n• Custom Instructions\n\nUsing data from: ${basicPromptData.business_data_used.business_name}`
      );
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error(
        'Failed to generate prompt. Please ensure you have completed:\n\n• Business Information (Step 1)\n• Products & Services (Step 2-3) \n• Staff Management (Step 4)\n• Business Locations (if applicable)\n• Insurance Setup (for healthcare)\n\nThen try generating the prompt again.'
      );
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    const confirmed = await confirm({
      title: 'Delete AI Agent',
      description: 'Are you sure you want to delete this AI agent?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      // TODO: Delete from API
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleToggleAgentStatus = async (agentId: string) => {
    try {
      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? {
                ...agent,
                status: agent.status === 'active' ? 'inactive' : 'active',
              }
            : agent
        )
      );
      // TODO: Update status via API
    } catch (error) {
      console.error('Failed to update agent status:', error);
    }
  };

  const handleSaveAgent = async () => {
    try {
      if (editingAgent) {
        // Update existing agent
        const updatedAgent: AIAgent = {
          ...editingAgent,
          ...formData,
          updated_at: new Date().toISOString(),
        };

        setAgents(prev =>
          prev.map(agent =>
            agent.id === editingAgent.id ? updatedAgent : agent
          )
        );
      } else {
        // Create new agent
        const newAgent: AIAgent = {
          id: Date.now().toString(),
          ...formData,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setAgents(prev => [...prev, newAgent]);
      }

      setShowCreateForm(false);
      setEditingAgent(null);

      // Save to database
      await saveAgentConfiguration('all');
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const saveAgentConfiguration = async (
    section: 'basic' | 'scripts' | 'voice' | 'routing' | 'all'
  ) => {
    if (!formData.agent_type || !formData.agent_name) {
      toast.error('Please fill in agent name and type before saving');
      return;
    }

    try {
      setSavingTab(section);
      setSaveStatus(prev => ({ ...prev, [section]: null }));

      // Get business profile to get client_id
      const businessProfileResponse = await authenticatedFetch(
        `/api/business/profile?user_id=${user.id}`
      );

      if (!businessProfileResponse.ok) {
        const errorData = await businessProfileResponse
          .json()
          .catch(() => ({}));
        console.error('Business profile error:', errorData);
        throw new Error('Please complete business profile first');
      }
      const businessData = await businessProfileResponse.json();
      const clientId = businessData.profile?.id;

      if (!clientId) {
        throw new Error(
          'Business profile not found. Please complete Step 1 first.'
        );
      }

      // Get agent type ID
      const agentTypesResponse = await authenticatedFetch('/api/agent-types');
      const agentTypesData = await agentTypesResponse.json();

      const agentTypeObj = agentTypesData.agent_types?.find(
        (at: any) => at.type_code === formData.agent_type
      );

      if (!agentTypeObj) {
        throw new Error(`Agent type not found: ${formData.agent_type}`);
      }

      // Prepare data based on section
      let saveData: any = {
        client_id: clientId,
        agent_type_id: agentTypeObj.id,
        agent_name: formData.agent_name,
        greeting_message: formData.greeting_message,
      };

      if (section === 'basic' || section === 'all') {
        saveData = {
          ...saveData,
          basic_info_prompt: formData.basic_info_prompt,
          agent_personality: formData.agent_personality,
          custom_instructions: formData.custom_instructions,
        };
      }

      if (section === 'scripts' || section === 'all') {
        saveData = {
          ...saveData,
          call_scripts_prompt: formData.call_scripts_prompt,
          call_scripts: (formData as any).call_scripts || {},
        };
      }

      if (section === 'voice' || section === 'all') {
        saveData = {
          ...saveData,
          voice_settings: formData.voice_settings,
        };
      }

      if (section === 'routing' || section === 'all') {
        saveData = {
          ...saveData,
          call_routing: formData.call_routing,
        };
      }

      console.log('Saving agent configuration:', saveData);

      const response = await authenticatedFetch(
        '/api/business/agent-configurations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saveData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save configuration error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          errorData.error || errorData.details || 'Failed to save configuration'
        );
      }

      const result = await response.json();
      console.log(`${section} configuration saved:`, result);

      setSaveStatus(prev => ({ ...prev, [section]: 'success' }));

      // Refresh agents list to show the new/updated agent
      if (section === 'basic' || section === 'all') {
        await loadAgents();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: null }));
      }, 3000);
    } catch (error) {
      console.error(`Error saving ${section} configuration:`, error);
      setSaveStatus(prev => ({ ...prev, [section]: 'error' }));
      toast.error(
        `Error saving ${section} configuration: ${(error as Error).message}`
      );
    } finally {
      setSavingTab(null);
    }
  };

  const handleDeployAgent = async (agent: AIAgent) => {
    try {
      // TODO: Deploy agent to Retell AI
      const response = await authenticatedFetch('/api/create-retell-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          agentName: agent.agent_name,
          agentPersonality: agent.agent_personality,
          customPrompt: agent.greeting_message,
          voiceSettings: agent.voice_settings || {
            speed: 1.0,
            pitch: 1.0,
            tone: agent.agent_personality,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAgents(prev =>
          prev.map(a =>
            a.id === agent.id
              ? {
                  ...a,
                  status: 'active',
                  retell_agent_id: result.data.agent_id,
                  webhook_url: result.data.webhook_url,
                }
              : a
          )
        );
      }
    } catch (error) {
      console.error('Failed to deploy agent:', error);
    }
  };

  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading AI agents...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agents List */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </div>
            <Button
              onClick={handleCreateAgent}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              {t('createNewAgent')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="dark:bg-gray-800">
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No AI Agents Created
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first AI agent to start handling calls
                automatically. You can create multiple agents for different
                purposes.
              </p>
              <Button onClick={handleCreateAgent}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First AI Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 dark:bg-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <MicIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {agent.agent_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {AGENT_TYPES[agent.agent_type as AgentType]?.name ||
                              AGENT_TYPE_CONFIGS[agent.agent_type as AgentType]
                                ?.name ||
                              agent.agent_type}
                          </p>
                        </div>
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Personality
                          </p>
                          <p className="text-sm font-medium capitalize dark:text-gray-300">
                            {agent.agent_personality}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created
                          </p>
                          <p className="text-sm font-medium dark:text-gray-300">
                            {new Date(agent.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {agent.greeting_message && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Greeting Message
                          </p>
                          <p className="text-sm bg-gray-50 dark:bg-gray-600 dark:text-gray-300 p-3 rounded-lg">
                            {agent.greeting_message}
                          </p>
                        </div>
                      )}

                      {agent.retell_agent_id && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Retell Agent ID
                          </p>
                          <p className="text-sm font-mono bg-gray-50 dark:bg-gray-600 dark:text-gray-300 p-2 rounded">
                            {agent.retell_agent_id}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAgent(agent)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      {agent.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleDeployAgent(agent)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Deploy
                        </Button>
                      )}

                      {agent.status !== 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAgentStatus(agent.id)}
                        >
                          {agent.status === 'active'
                            ? 'Deactivate'
                            : 'Activate'}
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Agent Form */}
      {showCreateForm && (
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle>
              {editingAgent
                ? `Edit Agent: ${editingAgent.agent_name}`
                : 'Create New AI Agent'}
            </CardTitle>
            <CardDescription>
              Configure your AI agent's basic information, personality, and
              behavior. Use the Auto-Generate feature to create professional
              prompts based on your business information, products, services,
              and staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="dark:bg-gray-800">
            {/* Section Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { id: 'basic', label: 'Basic Info' },
                { id: 'scripts', label: 'Call Scripts' },
                { id: 'voice', label: 'Voice Settings' },
                { id: 'routing', label: 'Call Routing' },
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {/* Basic Information */}
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name *</Label>
                    <Input
                      id="agent-name"
                      value={formData.agent_name}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          agent_name: e.target.value,
                        }))
                      }
                      placeholder="Reception Assistant"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agent-type">Agent Type *</Label>
                    <Select
                      value={formData.agent_type}
                      onValueChange={value => {
                        setFormData(prev => ({ ...prev, agent_type: value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type">
                          {formData.agent_type &&
                            (AGENT_TYPES as any)[formData.agent_type] &&
                            (() => {
                              const config = (AGENT_TYPES as any)[
                                formData.agent_type
                              ];
                              return (
                                <div className="flex items-center gap-2">
                                  <config.icon className="h-4 w-4" />
                                  <span>{config.name}</span>
                                </div>
                              );
                            })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AGENT_TYPES).map(([key, type]) => {
                          // key is already the enum value (e.g., "inbound_receptionist")
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{type.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {type.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="agent-personality">Agent Personality</Label>
                  <Select
                    value={formData.agent_personality}
                    onValueChange={(value: any) => {
                      setFormData(prev => ({
                        ...prev,
                        agent_personality: value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">
                        Professional - Formal and business-like
                      </SelectItem>
                      <SelectItem value="friendly">
                        Friendly - Warm and approachable
                      </SelectItem>
                      <SelectItem value="technical">
                        Technical - Detail-oriented and precise
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Prompt Button */}
                {formData.agent_type && formData.agent_personality ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <SettingsIcon className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            🤖 Auto-Generate AI Prompt
                          </h4>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                          Generate comprehensive AI agent prompts automatically
                          based on your business setup (greeting message, basic
                          info prompt, and custom instructions):
                        </p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4">
                          <li>• Business information and hours</li>
                          <li>• Products and services catalog</li>
                          <li>• Staff specialties and availability</li>
                          <li>• Multiple business locations</li>
                          <li>• Insurance providers (healthcare)</li>
                          <li>• Agent type and personality settings</li>
                        </ul>
                      </div>
                      <div className="ml-4">
                        <Button
                          type="button"
                          onClick={generatePrompt}
                          disabled={generatingPrompt}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                          size="lg"
                        >
                          {generatingPrompt ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <SettingsIcon className="h-4 w-4 mr-2" />
                              Generate Prompt
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : formData.agent_type || formData.agent_personality ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">!</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Almost Ready for Auto-Generation
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Please select both Agent Type and Personality to
                          enable automatic prompt generation.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div>
                  <Label htmlFor="greeting-message">Greeting Message</Label>
                  <Textarea
                    id="greeting-message"
                    value={formData.greeting_message}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        greeting_message: e.target.value,
                      }))
                    }
                    placeholder="Hello! Thank you for calling [Business Name]. How can I help you today?"
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="basic-info-prompt">
                    Basic Information Prompt
                  </Label>
                  <Textarea
                    id="basic-info-prompt"
                    value={formData.basic_info_prompt}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        basic_info_prompt: e.target.value,
                      }))
                    }
                    placeholder="You are a professional [Agent Type] for [Business Name]. Your role is to..."
                    rows={6}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This prompt defines the agent's core identity and includes
                    all your business information from previous steps.
                  </p>
                </div>

                <div>
                  <Label htmlFor="custom-instructions">
                    Custom Instructions
                  </Label>
                  <Textarea
                    id="custom-instructions"
                    value={formData.custom_instructions}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        custom_instructions: e.target.value,
                      }))
                    }
                    placeholder="Instructions for escalation, when to transfer calls, how to handle difficult situations..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Specific instructions for handling situations, escalation
                    procedures, and behavioral guidelines.
                  </p>
                </div>

                {/* Save Button for Basic Info */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    {saveStatus.basic === 'success' && (
                      <span className="text-green-600 text-sm">
                        ✓ Basic info saved successfully
                      </span>
                    )}
                    {saveStatus.basic === 'error' && (
                      <span className="text-red-600 text-sm">
                        ✗ Failed to save basic info
                      </span>
                    )}
                    <Button
                      type="button"
                      onClick={() => saveAgentConfiguration('basic')}
                      disabled={
                        savingTab === 'basic' ||
                        !formData.agent_name ||
                        !formData.agent_type
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingTab === 'basic' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Basic Info'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Call Scripts */}
            {activeSection === 'scripts' && (
              <div className="space-y-4">
                <AgentTypeCallScripts
                  agentType={formData.agent_type as any}
                  initialScripts={(formData as any).call_scripts}
                  initialPrompt={formData.call_scripts_prompt}
                  onSave={async (scripts: any) => {
                    // Handle different script formats
                    let scriptData = {};
                    let scriptPrompt = '';

                    if (Array.isArray(scripts)) {
                      const firstScript = scripts[0];
                      scriptData = {
                        greeting_script: firstScript?.greeting_script || '',
                        main_script: firstScript?.main_script || '',
                        closing_script: firstScript?.closing_script || '',
                        escalation_script: firstScript?.escalation_script || '',
                      };
                      scriptPrompt =
                        firstScript?.main_script ||
                        firstScript?.greeting_script ||
                        '';
                    } else {
                      scriptData = scripts;
                      scriptPrompt =
                        scripts?.main_script || scripts?.greeting_script || '';
                    }

                    setFormData(prev => ({
                      ...prev,
                      call_scripts: scriptData,
                      call_scripts_prompt: scriptPrompt,
                    }));

                    // Auto-save to database when scripts are generated
                    setTimeout(async () => {
                      try {
                        await saveAgentConfiguration('scripts');
                      } catch (error) {
                        console.error('Failed to auto-save scripts:', error);
                      }
                    }, 100);
                  }}
                  businessInfo={{ ...businessInfo, user_id: user.id }}
                />

                {/* Save Button for Call Scripts */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    {saveStatus.scripts === 'success' && (
                      <span className="text-green-600 text-sm">
                        ✓ Call scripts saved successfully
                      </span>
                    )}
                    {saveStatus.scripts === 'error' && (
                      <span className="text-red-600 text-sm">
                        ✗ Failed to save call scripts
                      </span>
                    )}
                    <Button
                      type="button"
                      onClick={() => saveAgentConfiguration('scripts')}
                      disabled={
                        savingTab === 'scripts' ||
                        !formData.agent_name ||
                        !formData.agent_type
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingTab === 'scripts' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Call Scripts'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Settings */}
            {activeSection === 'voice' && (
              <div className="space-y-4">
                <AgentTypeVoiceSettings
                  agentType={formData.agent_type as any}
                  initialVoiceSettings={formData.voice_settings as any}
                  businessInfo={{ ...businessInfo, user_id: user.id }}
                  onSave={async (voiceProfile: any) => {
                    setFormData(prev => ({
                      ...prev,
                      voice_settings: voiceProfile.voice_settings,
                    }));

                    // Auto-save to database
                    setTimeout(async () => {
                      try {
                        await saveAgentConfiguration('voice');
                      } catch (error) {
                        console.error(
                          'Failed to auto-save voice settings:',
                          error
                        );
                      }
                    }, 100);
                  }}
                />

                {/* Save Button for Voice Settings */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    {saveStatus.voice === 'success' && (
                      <span className="text-green-600 text-sm">
                        ✓ Voice settings saved successfully
                      </span>
                    )}
                    {saveStatus.voice === 'error' && (
                      <span className="text-red-600 text-sm">
                        ✗ Failed to save voice settings
                      </span>
                    )}
                    <Button
                      type="button"
                      onClick={() => saveAgentConfiguration('voice')}
                      disabled={
                        savingTab === 'voice' ||
                        !formData.agent_name ||
                        !formData.agent_type
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingTab === 'voice' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Voice Settings'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Call Routing */}
            {activeSection === 'routing' && (
              <div className="space-y-4">
                <AgentTypeCallRouting
                  agentType={formData.agent_type as any}
                  businessInfo={{ ...businessInfo, user_id: user.id }}
                  onSave={async (routing: any) => {
                    setFormData(prev => ({
                      ...prev,
                      call_routing: routing,
                    }));
                  }}
                />

                {/* Save Button for Call Routing */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    {saveStatus.routing === 'success' && (
                      <span className="text-green-600 text-sm">
                        ✓ Call routing saved successfully
                      </span>
                    )}
                    {saveStatus.routing === 'error' && (
                      <span className="text-red-600 text-sm">
                        ✗ Failed to save call routing
                      </span>
                    )}
                    <Button
                      type="button"
                      onClick={() => saveAgentConfiguration('routing')}
                      disabled={
                        savingTab === 'routing' ||
                        !formData.agent_name ||
                        !formData.agent_type
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {savingTab === 'routing' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Call Routing'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingAgent(null);
                }}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                {activeSection !== 'basic' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const sections = ['basic', 'scripts', 'voice', 'routing'];
                      const currentIndex = sections.indexOf(activeSection);
                      if (currentIndex > 0) {
                        setActiveSection(sections[currentIndex - 1] as any);
                      }
                    }}
                  >
                    Previous
                  </Button>
                )}
                {activeSection !== 'routing' ? (
                  <Button
                    onClick={() => {
                      const sections = ['basic', 'scripts', 'voice', 'routing'];
                      const currentIndex = sections.indexOf(activeSection);
                      if (currentIndex < sections.length - 1) {
                        setActiveSection(sections[currentIndex + 1] as any);
                      }
                    }}
                    disabled={!formData.agent_name || !formData.agent_type}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveAgent}
                    disabled={!formData.agent_name || !formData.agent_type}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {editingAgent ? 'Update Agent' : 'Create Agent'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Status */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
        <CardContent className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
              <SettingsIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-100">
                AI Agents Configuration
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-200">
                {agents.length > 0
                  ? `${agents.length} AI agent${agents.length > 1 ? 's' : ''} configured. You can create additional agents anytime.`
                  : 'Create your first AI agent to complete the setup process.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
