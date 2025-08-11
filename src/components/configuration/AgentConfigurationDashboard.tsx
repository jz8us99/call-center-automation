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
import { BusinessInformationForm } from '@/components/configuration/BusinessInformationForm';
import { CallScriptEditor } from '@/components/configuration/CallScriptEditor';
import { VoiceSettingsPanel } from '@/components/configuration/VoiceSettingsPanel';
import { AgentTypeSelector } from '@/components/configuration/AgentTypeSelector';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import {
  AgentType,
  AGENT_TYPE_CONFIGS,
  AgentConfiguration,
} from '@/types/agent-types';

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
}

export function AgentConfigurationDashboard({
  user,
  isAdminMode = false,
  targetUser,
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
    'type' | 'business' | 'scripts' | 'voice' | 'routing'
  >('type');

  useEffect(() => {
    loadAgentConfigurations();
  }, [user]);

  const loadAgentConfigurations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/business/agent-configurations', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const result = await response.json();
      // setAgents(result.data || []);

      // Mock data for now
      setAgents([]);
    } catch (error) {
      console.error('Failed to load agent configurations:', error);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedAgent ? 'Edit AI Agent' : 'Create New AI Agent'}
            </h2>
            <p className="text-sm text-gray-600">
              Configure your AI voice agent settings and business information
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateForm(false);
              setSelectedAgent(null);
              setSelectedAgentType(null);
              setActiveSection('type');
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
                      id: 'type',
                      label: 'Agent Type',
                      icon: '🤖',
                      disabled: !!selectedAgent,
                    },
                    {
                      id: 'business',
                      label: 'Business Info',
                      icon: '🏢',
                      disabled: !selectedAgentType,
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
            {activeSection === 'type' && (
              <AgentTypeSelector
                selectedType={selectedAgentType || undefined}
                onSelect={type => {
                  setSelectedAgentType(type);
                  setActiveSection('business');
                }}
                showContinueButton={true}
                onContinue={() => setActiveSection('business')}
              />
            )}

            {activeSection === 'business' && selectedAgentType && (
              <BusinessInformationForm
                agent={selectedAgent}
                onSave={async data => {
                  console.log('Saving business info:', data);
                  // TODO: Implement save
                  await loadAgentConfigurations();
                  setShowCreateForm(false);
                  setSelectedAgent(null);
                }}
              />
            )}

            {activeSection === 'scripts' && selectedAgentType && (
              <CallScriptEditor
                agent={selectedAgent}
                agentType={selectedAgentType}
                onSave={async data => {
                  console.log('Saving call scripts:', data);
                  // TODO: Implement save
                }}
              />
            )}

            {activeSection === 'voice' && selectedAgentType && (
              <VoiceSettingsPanel
                agent={selectedAgent}
                agentType={selectedAgentType}
                onSave={async data => {
                  console.log('Saving voice settings:', data);
                  // TODO: Implement save
                }}
              />
            )}

            {activeSection === 'routing' && (
              <Card>
                <CardHeader>
                  <CardTitle>Call Routing & Forwarding</CardTitle>
                  <CardDescription>
                    Configure how calls are handled when the AI agent can't
                    assist
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Forward to Office Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        defaultValue=""
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Voicemail Greeting
                      </label>
                      <Input placeholder="Custom voicemail message" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Enable call forwarding</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        defaultChecked
                      />
                      <span className="text-sm">Enable voicemail</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t">
                    <Button>Save Routing Settings</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
