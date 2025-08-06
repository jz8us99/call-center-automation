'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/ai-agent-types';
import { CheckIcon, EditIcon, PlusIcon } from '@/components/icons';

interface CallScript {
  id: string;
  agent_type: AgentType;
  script_name: string;
  greeting_script: string;
  main_script: string;
  closing_script: string;
  escalation_script: string;
  fallback_responses: string[];
  is_default: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

interface AgentTypeCallScriptsProps {
  agentType: AgentType;
  onSave: (scripts: CallScript[]) => Promise<void>;
  businessInfo?: any;
}

export function AgentTypeCallScripts({
  agentType,
  onSave,
  businessInfo,
}: AgentTypeCallScriptsProps) {
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null);

  const agentConfig = AGENT_TYPE_CONFIGS[agentType];

  useEffect(() => {
    loadCallScripts();
  }, [agentType]);

  const loadCallScripts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const defaultScript = createDefaultScript();
      setScripts([defaultScript]);
      setSelectedScript(defaultScript);
    } catch (error) {
      console.error('Failed to load call scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultScript = (): CallScript => {
    const businessName = businessInfo?.business_name || '[Business Name]';
    const businessPhone = businessInfo?.business_phone || '[Business Phone]';

    const scriptTemplates = {
      [AgentType.INBOUND_CALL]: {
        greeting: `Hello! Thank you for calling ${businessName}. My name is Alex, your AI assistant. How can I help you today?`,
        main: `I can help you with scheduling appointments, general information about our services, or direct you to the right person. What would you like assistance with?`,
        closing: `Thank you for calling ${businessName}. Is there anything else I can help you with today? Have a wonderful day!`,
        escalation: `I understand you need additional assistance. Let me transfer you to one of our team members right away. Please hold for just a moment.`,
      },
      [AgentType.OUTBOUND_APPOINTMENT]: {
        greeting: `Hello! This is Alex calling from ${businessName} at ${businessPhone}. I'm calling to confirm your upcoming appointment.`,
        main: `I have you scheduled for [appointment details]. Can you confirm if this time still works for you, or would you prefer to reschedule?`,
        closing: `Perfect! We look forward to seeing you then. You'll receive a reminder message. Thank you, and have a great day!`,
        escalation: `I'd be happy to connect you with our scheduling team to discuss any specific needs or changes to your appointment.`,
      },
      [AgentType.OUTBOUND_MARKETING]: {
        greeting: `Hello! This is Alex calling from ${businessName}. I hope you're having a great day! I'm reaching out because we have some exciting services that might be of interest to you.`,
        main: `We're currently offering [service/promotion details]. Based on your profile, I thought this might be valuable for you. Would you like to hear more about how this could benefit you?`,
        closing: `Thank you for your time today! I'll send you some information via email, and feel free to call us at ${businessPhone} if you have any questions.`,
        escalation: `I'd love to connect you with one of our specialists who can provide more detailed information about our services.`,
      },
      [AgentType.CUSTOMER_SUPPORT]: {
        greeting: `Hello! You've reached ${businessName} customer support. I'm Alex, your AI assistant, and I'm here to help resolve any issues you're experiencing.`,
        main: `I can assist with troubleshooting, account questions, service issues, or general support. Can you tell me what specific issue you're facing today?`,
        closing: `I'm glad I could help resolve your issue today. Is there anything else you need assistance with? Thank you for choosing ${businessName}!`,
        escalation: `I want to make sure you get the best possible help. Let me transfer you to one of our technical specialists who can provide more detailed assistance.`,
      },
    };

    const template = scriptTemplates[agentType];

    return {
      id: 'default',
      agent_type: agentType,
      script_name: `Default ${agentConfig?.name || 'Agent'} Script`,
      greeting_script: template.greeting,
      main_script: template.main,
      closing_script: template.closing,
      escalation_script: template.escalation,
      fallback_responses: [
        "I apologize, but I didn't quite understand that. Could you please rephrase your request?",
        'I want to make sure I help you properly. Can you provide a bit more detail about what you need?',
        'Let me make sure I understand correctly. Are you asking about [clarification needed]?',
      ],
      is_default: true,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSaveScript = async () => {
    if (!selectedScript) return;

    try {
      const updatedScripts = scripts.map(s =>
        s.id === selectedScript.id ? selectedScript : s
      );
      setScripts(updatedScripts);
      await onSave(updatedScripts);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const updateScript = (field: keyof CallScript, value: any) => {
    if (!selectedScript) return;
    setSelectedScript({ ...selectedScript, [field]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{agentConfig?.icon}</span>
                <span>Call Scripts - {agentConfig?.name}</span>
              </CardTitle>
              <CardDescription>
                Customize conversation flows and responses for your{' '}
                {agentType.replace('_', ' ').toLowerCase()} agent
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              <EditIcon className="h-4 w-4 mr-2" />
              {isEditing ? 'View Mode' : 'Edit Scripts'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {selectedScript && (
        <div className="grid gap-6">
          {/* Greeting Script */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opening Greeting</CardTitle>
              <CardDescription>
                First message when the call starts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={selectedScript.greeting_script}
                  onChange={e =>
                    updateScript('greeting_script', e.target.value)
                  }
                  placeholder="Enter opening greeting script..."
                  rows={3}
                  className="w-full"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">
                    {selectedScript.greeting_script}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Script */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Main Conversation Script
              </CardTitle>
              <CardDescription>
                Primary conversation flow and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={selectedScript.main_script}
                  onChange={e => updateScript('main_script', e.target.value)}
                  placeholder="Enter main conversation script..."
                  rows={4}
                  className="w-full"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">
                    {selectedScript.main_script}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Closing Script */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Closing</CardTitle>
              <CardDescription>
                How the agent ends the conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={selectedScript.closing_script}
                  onChange={e => updateScript('closing_script', e.target.value)}
                  placeholder="Enter closing script..."
                  rows={3}
                  className="w-full"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">
                    {selectedScript.closing_script}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escalation Script */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escalation & Transfer</CardTitle>
              <CardDescription>
                When transferring to human agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={selectedScript.escalation_script}
                  onChange={e =>
                    updateScript('escalation_script', e.target.value)
                  }
                  placeholder="Enter escalation script..."
                  rows={3}
                  className="w-full"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">
                    {selectedScript.escalation_script}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fallback Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fallback Responses</CardTitle>
              <CardDescription>
                When the agent doesn't understand or needs clarification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedScript.fallback_responses.map((response, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge variant="outline" className="mt-1">
                      {index + 1}
                    </Badge>
                    {isEditing ? (
                      <Input
                        value={response}
                        onChange={e => {
                          const newResponses = [
                            ...selectedScript.fallback_responses,
                          ];
                          newResponses[index] = e.target.value;
                          updateScript('fallback_responses', newResponses);
                        }}
                        placeholder="Enter fallback response..."
                        className="flex-1"
                      />
                    ) : (
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-800">{response}</p>
                      </div>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newResponses = [
                        ...selectedScript.fallback_responses,
                        '',
                      ];
                      updateScript('fallback_responses', newResponses);
                    }}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Fallback Response
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      loadCallScripts(); // Reset changes
                    }}
                  >
                    Cancel Changes
                  </Button>
                  <Button
                    onClick={handleSaveScript}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Call Scripts
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
