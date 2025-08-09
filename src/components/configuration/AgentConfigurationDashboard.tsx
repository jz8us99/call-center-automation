'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BusinessInformationHeader } from './BusinessInformationHeader';
import { AgentTypeSelector } from './AgentTypeSelector';
import { AgentTypeCallScripts } from '../ai-agents/AgentTypeCallScripts';
import { AgentTypeVoiceSettings } from '../ai-agents/AgentTypeVoiceSettings';
import { AgentTypeCallRouting } from '../ai-agents/AgentTypeCallRouting';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import {
  AgentType,
  AGENT_TYPE_CONFIGS,
  AgentConfiguration,
} from '@/types/agent-types';
import { TemplatePreviewModal } from '../modals/TemplatePreviewModal';
import { AgentTemplate, BUSINESS_TYPE_CONFIGS } from '@/types/business-types';

// Using AgentConfiguration from types

interface AgentConfigurationDashboardProps {
  user: User;
  isAdminMode?: boolean;
  targetUser?: {
    id: string;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
    pricing_tier: 'basic' | 'premium' | 'enterprise';
    agent_types_allowed: string[];
    is_active: boolean;
    business_name?: string;
    business_type?: string;
  };
  onConfigurationUpdate?: (isComplete: boolean) => void;
}

export function AgentConfigurationDashboard({
  user,
  isAdminMode = false,
  targetUser,
  onConfigurationUpdate,
}: AgentConfigurationDashboardProps) {
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAgentType, setSelectedAgentType] = useState<AgentType | null>(
    null
  );
  const [activeSection, setActiveSection] = useState<
    'business' | 'type' | 'scripts' | 'voice' | 'routing'
  >('business');
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [templatePreview, setTemplatePreview] = useState<{
    agentType: AgentType;
    template: AgentTemplate;
  } | null>(null);

  useEffect(() => {
    loadAgentConfigurations();
  }, [user]);

  useEffect(() => {
    // When business profile is updated, ensure we have the required information
    if (businessProfile?.business_type && businessProfile?.business_name) {
      // Business profile is complete, user can proceed with agent configuration
      if (activeSection === 'business' && selectedAgentType) {
        setActiveSection('scripts');
      }
    } else {
      // If business profile is incomplete, ensure we're on the business section
      if (activeSection !== 'business') {
        setActiveSection('business');
      }
    }
  }, [businessProfile, selectedAgentType, activeSection]);

  // Notify parent component about configuration status
  useEffect(() => {
    if (onConfigurationUpdate) {
      // Consider configuration complete if we have agents configured
      const isComplete =
        agents.length > 0 ||
        (selectedAgentType && businessProfile?.business_type);
      onConfigurationUpdate(isComplete);
    }
  }, [
    agents.length,
    selectedAgentType,
    businessProfile,
    onConfigurationUpdate,
  ]);

  const loadAgentConfigurations = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const response = await fetch(`/api/agent-configurations?user_id=${user.id}`);
      if (response.ok) {
        const result = await response.json();
        setAgents(result.configurations || []);
      } else {
        console.error('Failed to load agent configurations');
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to load agent configurations:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setSelectedAgentType(null);
    setActiveSection('type');
    setShowCreateForm(true);
  };

  const handleEditAgent = (agent: AgentConfiguration) => {
    setSelectedAgent(agent);
    setSelectedAgentType(agent.agent_type);
    setActiveSection('business');
    setShowCreateForm(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent configuration?')) {
      return;
    }

    try {
      // TODO: Implement delete API call
      console.log('Deleting agent:', agentId);
      await loadAgentConfigurations();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const loadExistingConfiguration = async (agentType: AgentType) => {
    try {
      // Get client ID from business profile (this should be the client table ID, not user ID)
      if (!businessProfile?.id) {
        return null;
      }
      const clientId = businessProfile.id;

      // Get agent type ID from database
      const agentTypesResponse = await fetch('/api/agent-types');
      const agentTypesData = await agentTypesResponse.json();
      const agentTypeObj = agentTypesData.agent_types?.find(
        (at: any) => at.type_code === agentType
      );

      if (!agentTypeObj) {
        return null;
      }

      const response = await fetch(
        `/api/agent-configurations?client_id=${clientId}&agent_type_id=${agentTypeObj.id}`
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.configuration;
    } catch (error) {
      console.error('Error loading existing configuration:', error);
      return null;
    }
  };

  const saveConfiguration = async (
    configType: 'call_scripts' | 'voice_settings' | 'call_routing' | 'basic_info_prompt' | 'call_scripts_prompt',
    configData: any
  ) => {
    try {
      if (!selectedAgentType) {
        throw new Error('No agent type selected');
      }

      // Get client ID from business profile (this should be the client table ID, not user ID)
      if (!businessProfile?.id) {
        throw new Error('Business profile must be saved first');
      }
      const clientId = businessProfile.id;

      // Get agent type ID from database
      const agentTypesResponse = await fetch('/api/agent-types');
      const agentTypesData = await agentTypesResponse.json();
      const agentTypeObj = agentTypesData.agent_types?.find(
        (at: any) => at.type_code === selectedAgentType
      );

      if (!agentTypeObj) {
        throw new Error('Agent type not found');
      }

      // Generate enhanced prompts if needed
      let enhancedData = { ...configData };
      if (configType === 'call_scripts' || configType === 'voice_settings') {
        try {
          const promptResponse = await fetch('/api/generate-enhanced-prompts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agent_type: selectedAgentType,
              agent_personality: 'professional',
              business_context: {
                business_profile: businessProfile,
                services: [],
                staff: [],
                office_hours: [],
              },
              prompt_type: 'combined',
            }),
          });

          if (promptResponse.ok) {
            const promptData = await promptResponse.json();
            enhancedData.basic_info_prompt = promptData.prompts.basic_info_prompt;
            enhancedData.call_scripts_prompt = promptData.prompts.call_scripts_prompt;
            enhancedData.greeting_message = promptData.prompts.greeting_message;
          }
        } catch (promptError) {
          console.warn('Failed to generate enhanced prompts:', promptError);
        }
      }

      const response = await fetch('/api/agent-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          agent_type_id: agentTypeObj.id,
          agent_name: `${AGENT_TYPE_CONFIGS[selectedAgentType].name} - ${businessProfile.business_name}`,
          [configType]: configData,
          ...enhancedData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const result = await response.json();
      console.log(`${configType} saved successfully:`, result);

      // Update local state
      await loadAgentConfigurations();

      // Show success message
      alert(`${configType.replace('_', ' ')} saved successfully!`);
    } catch (error) {
      console.error(`Error saving ${configType}:`, error);
      alert(`Error saving ${configType.replace('_', ' ')}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showCreateForm || selectedAgent) {
    return (
      <div className="space-y-6">
        {/* Business Information Header - Always show for context */}
        <BusinessInformationHeader
          user={user}
          onBusinessProfileUpdate={setBusinessProfile}
          agentType={selectedAgentType || undefined}
          showAgentTypeSpecific={!!selectedAgentType}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedAgent
                ? `Edit ${AGENT_TYPE_CONFIGS[selectedAgent.agent_type]?.name || 'AI Agent'}`
                : selectedAgentType
                  ? `Create New ${AGENT_TYPE_CONFIGS[selectedAgentType].name}`
                  : 'Create New AI Agent'}
            </h2>
            <p className="text-sm text-gray-600">
              {businessProfile?.business_type && businessProfile?.business_name
                ? `Configure your AI agent for ${businessProfile.business_name} (${BUSINESS_TYPE_CONFIGS[businessProfile.business_type]?.name || businessProfile.business_type})`
                : 'Configure your AI voice agent settings and business information'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateForm(false);
              setSelectedAgent(null);
              setSelectedAgentType(null);
              setActiveSection('business');
            }}
          >
            ← Back to Agents
          </Button>
        </div>

        {/* Configuration Sections */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <nav className="space-y-1">
                  {[
                    {
                      id: 'business',
                      label: 'Business Info',
                      icon: '🏢',
                      disabled: false,
                    },
                    {
                      id: 'type',
                      label: 'Agent Type',
                      icon: '🤖',
                      disabled:
                        !!selectedAgent || !businessProfile?.business_type,
                    },
                    {
                      id: 'scripts',
                      label: 'Call Scripts',
                      icon: '📝',
                      disabled: !selectedAgentType,
                    },
                    {
                      id: 'voice',
                      label: 'Voice Settings',
                      icon: '🎙️',
                      disabled: !selectedAgentType,
                    },
                    {
                      id: 'routing',
                      label: 'Call Routing',
                      icon: '📞',
                      disabled: !selectedAgentType,
                    },
                  ].map(section => (
                    <button
                      key={section.id}
                      onClick={() =>
                        !section.disabled && setActiveSection(section.id as any)
                      }
                      disabled={section.disabled}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        section.disabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : activeSection === section.id
                            ? 'bg-orange-100 text-orange-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{section.icon}</span>
                      <span className="text-sm">{section.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeSection === 'business' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🏢</span>
                    <span>Business Information Setup</span>
                  </CardTitle>
                  <CardDescription>
                    Configure your business details first. This information will
                    be used to create specialized AI agent templates for your
                    business type.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Please complete your business information in the section
                      above to continue with AI agent configuration.
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>✓ Business name and type</p>
                      <p>✓ Contact information</p>
                      <p>✓ Business details</p>
                    </div>
                    {businessProfile?.business_type &&
                      businessProfile?.business_name && (
                        <div className="mt-6">
                          <Button
                            onClick={() => setActiveSection('type')}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            Continue to Agent Type Selection
                          </Button>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'type' && (
              <AgentTypeSelector
                selectedType={selectedAgentType || undefined}
                onSelect={type => {
                  setSelectedAgentType(type);
                  setActiveSection('scripts');
                }}
                showContinueButton={true}
                onContinue={() => setActiveSection('scripts')}
                businessType={businessProfile?.business_type}
                businessTypeName={
                  businessProfile?.business_type
                    ? BUSINESS_TYPE_CONFIGS[businessProfile.business_type]?.name
                    : undefined
                }
                onTemplatePreview={(agentType, template) => {
                  setTemplatePreview({ agentType, template });
                }}
              />
            )}

            {activeSection === 'scripts' && selectedAgentType && (
              <AgentTypeCallScripts
                agentType={selectedAgentType}
                businessInfo={businessProfile}
                onSave={async scripts => {
                  console.log('Saving call scripts:', scripts);
                  await saveConfiguration('call_scripts', scripts);
                }}
              />
            )}

            {activeSection === 'voice' && selectedAgentType && (
              <AgentTypeVoiceSettings
                agentType={selectedAgentType}
                businessInfo={businessProfile}
                onSave={async voiceProfile => {
                  console.log('Saving voice settings:', voiceProfile);
                  await saveConfiguration('voice_settings', voiceProfile);
                }}
              />
            )}

            {activeSection === 'routing' && selectedAgentType && (
              <AgentTypeCallRouting
                agentType={selectedAgentType}
                businessInfo={businessProfile}
                onSave={async routingConfig => {
                  console.log('Saving routing config:', routingConfig);
                  await saveConfiguration('call_routing', routingConfig);
                }}
              />
            )}
          </div>
        </div>

        {/* Template Preview Modal */}
        {templatePreview && (
          <TemplatePreviewModal
            isOpen={!!templatePreview}
            onClose={() => setTemplatePreview(null)}
            agentType={templatePreview.agentType}
            template={templatePreview.template}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            AI Agent Configurations
          </h2>
          <p className="text-sm text-gray-600">
            {isAdminMode && targetUser
              ? `Managing AI voice agents for ${targetUser.full_name}`
              : 'Manage your AI voice agents for different locations or use cases'}
          </p>
        </div>
        <Button onClick={handleCreateAgent}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create New Agent
        </Button>
      </div>

      {/* Admin Mode Notice */}
      {isAdminMode && targetUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">
                Admin Configuration Mode
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You are configuring agents for{' '}
                <span className="font-medium">{targetUser.full_name}</span>.
                This user has {targetUser.pricing_tier} tier access and can
                create the following agent types:{' '}
                <span className="font-medium">
                  {targetUser.agent_types_allowed
                    .map(type =>
                      type
                        .replace('_', ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())
                    )
                    .join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Agent List */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No AI Agents Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first AI voice agent to start handling calls for your
              business. You can customize the agent's behavior, voice, and
              business information.
            </p>
            <Button onClick={handleCreateAgent}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map(agent => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{agent.agent_name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {AGENT_TYPE_CONFIGS[agent.agent_type].name}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {agent.business_name} • {agent.business_type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p>Agent ID: {agent.agent_id}</p>
                    <p>
                      Created: {new Date(agent.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAgent(agent)}
                      className="flex-1"
                    >
                      <EditIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
