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
  UserIcon,
  MicIcon,
  PhoneIcon,
} from '@/components/icons';
import { AgentTypeCallScripts } from '../ai-agents/AgentTypeCallScripts';
import { AgentTypeVoiceSettings } from '../ai-agents/AgentTypeVoiceSettings';
import { AgentTypeCallRouting } from '../ai-agents/AgentTypeCallRouting';

interface AIAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  agent_personality: 'professional' | 'friendly' | 'technical';
  greeting_message?: string;
  custom_instructions?: string;
  status: 'draft' | 'active' | 'inactive';
  retell_agent_id?: string;
  webhook_url?: string;
  call_scripts?: Record<string, any>;
  voice_settings?: Record<string, any>;
  call_routing?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AIAgentsStepProps {
  user: User;
  onConfigurationUpdate: (isComplete: boolean) => void;
}

const AGENT_TYPES = {
  inbound_call: {
    name: 'Inbound Call Handler',
    description: 'Handles incoming calls from customers',
    icon: PhoneIcon,
    capabilities: [
      'Answer calls',
      'Book appointments',
      'Provide information',
      'Transfer calls',
    ],
  },
  outbound_call: {
    name: 'Outbound Call Agent',
    description: 'Makes outbound calls for follow-ups and reminders',
    icon: PhoneIcon,
    capabilities: ['Appointment reminders', 'Follow-up calls', 'Survey calls'],
  },
  appointment_booking: {
    name: 'Appointment Specialist',
    description: 'Specialized in scheduling and managing appointments',
    icon: UserIcon,
    capabilities: [
      'Schedule appointments',
      'Reschedule appointments',
      'Send confirmations',
    ],
  },
  customer_support: {
    name: 'Customer Support',
    description: 'Provides customer support and assistance',
    icon: UserIcon,
    capabilities: [
      'Answer questions',
      'Troubleshoot issues',
      'Provide information',
    ],
  },
};

export function AIAgentsStep({
  user,
  onConfigurationUpdate,
}: AIAgentsStepProps) {
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
  });

  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  useEffect(() => {
    loadAgents();
  }, [user]);

  useEffect(() => {
    onConfigurationUpdate(agents.length > 0);
  }, [agents.length, onConfigurationUpdate]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/ai-agents', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setAgents(data.agents || []);

      // Mock data for now
      setAgents([]);
    } catch (error) {
      console.error('Failed to load AI agents:', error);
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
    });
    setActiveSection('basic');
    setShowCreateForm(true);
  };

  const generatePrompt = async () => {
    if (!formData.agent_type || !formData.agent_personality) {
      alert(
        'Please select agent type and personality before generating prompt'
      );
      return;
    }

    try {
      setGeneratingPrompt(true);

      // Fetch business context
      const contextResponse = await fetch(
        `/api/business-context?user_id=${user.id}`
      );
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch business context');
      }
      const contextData = await contextResponse.json();

      // Generate prompt
      const promptResponse = await fetch('/api/generate-agent-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: formData.agent_type,
          agent_personality: formData.agent_personality,
          business_context: contextData.business_context,
        }),
      });

      if (!promptResponse.ok) {
        throw new Error('Failed to generate prompt');
      }

      const promptData = await promptResponse.json();

      // Update form with generated content
      setFormData(prev => ({
        ...prev,
        greeting_message: promptData.generated_prompt.greeting_message,
        custom_instructions: promptData.generated_prompt.custom_instructions,
      }));
    } catch (error) {
      console.error('Error generating prompt:', error);
      alert(
        'Failed to generate prompt. Please ensure you have completed:\n\n• Business Information (Step 1)\n• Products (Step 2) \n• Services (Step 3)\n• Appointment System (Step 4)\n• Staff Management (Step 5)\n\nThen try generating the prompt again.'
      );
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this AI agent?')) {
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

      // TODO: Save to API
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleDeployAgent = async (agent: AIAgent) => {
    try {
      // TODO: Deploy agent to Retell AI
      const response = await fetch('/api/create-retell-agent', {
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
        <span className="ml-3 text-gray-600">Loading AI agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Your AI Agents
              </CardTitle>
              <CardDescription>
                Create and manage multiple AI agents for different purposes.
                Each agent can have unique personalities, scripts, and
                capabilities.
              </CardDescription>
            </div>
            <Button
              onClick={handleCreateAgent}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Create New Agent
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No AI Agents Created
              </h3>
              <p className="text-gray-600 mb-6">
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
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <MicIcon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {agent.agent_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {AGENT_TYPES[
                              agent.agent_type as keyof typeof AGENT_TYPES
                            ]?.name || agent.agent_type}
                          </p>
                        </div>
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Personality</p>
                          <p className="text-sm font-medium capitalize">
                            {agent.agent_personality}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="text-sm font-medium">
                            {new Date(agent.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {agent.greeting_message && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">
                            Greeting Message
                          </p>
                          <p className="text-sm bg-gray-50 p-3 rounded-lg">
                            {agent.greeting_message}
                          </p>
                        </div>
                      )}

                      {agent.retell_agent_id && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            Retell Agent ID
                          </p>
                          <p className="text-sm font-mono bg-gray-50 p-2 rounded">
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
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAgent ? 'Edit AI Agent' : 'Create New AI Agent'}
            </CardTitle>
            <CardDescription>
              Configure your AI agent's basic information, personality, and
              behavior. Use the Auto-Generate feature to create professional
              prompts based on your business information, products, services,
              and staff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Section Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
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
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
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
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, agent_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AGENT_TYPES).map(([key, type]) => (
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
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="agent-personality">Agent Personality</Label>
                  <Select
                    value={formData.agent_personality}
                    onValueChange={(value: any) =>
                      setFormData(prev => ({
                        ...prev,
                        agent_personality: value,
                      }))
                    }
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
                          Generate professional greeting message and detailed
                          instructions automatically based on your business
                          setup:
                        </p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 ml-4">
                          <li>• Business information and hours</li>
                          <li>• Products and services catalog</li>
                          <li>• Staff specialties and availability</li>
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
                  />
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
                    placeholder="Any specific instructions for how this agent should behave..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Call Scripts */}
            {activeSection === 'scripts' && (
              <div>
                <AgentTypeCallScripts
                  agentType={formData.agent_type as any}
                  clientId={user.id}
                  onScriptsUpdate={(scripts: any) => {
                    console.log('Scripts updated:', scripts);
                  }}
                />
              </div>
            )}

            {/* Voice Settings */}
            {activeSection === 'voice' && (
              <div>
                <AgentTypeVoiceSettings
                  agentType={formData.agent_type as any}
                  clientId={user.id}
                  onVoiceUpdate={(settings: any) => {
                    console.log('Voice settings updated:', settings);
                  }}
                />
              </div>
            )}

            {/* Call Routing */}
            {activeSection === 'routing' && (
              <div>
                <AgentTypeCallRouting
                  agentType={formData.agent_type as any}
                  clientId={user.id}
                  onRoutingUpdate={(routing: any) => {
                    console.log('Routing updated:', routing);
                  }}
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t">
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
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <SettingsIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-purple-900">
                AI Agents Configuration
              </p>
              <p className="text-sm text-purple-700">
                {agents.length > 0
                  ? `${agents.length} AI agent${agents.length > 1 ? 's' : ''} configured. You can create additional agents anytime.`
                  : 'Create your first AI agent to complete the setup process.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
