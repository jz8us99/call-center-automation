'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';

interface AgentConfig {
  id?: string;
  agent_id?: string;
}

interface CallScript {
  id?: string;
  script_name: string;
  script_type: string;
  script_content: string;
  is_active: boolean;
  is_default: boolean;
}

interface CallScriptEditorProps {
  agent: AgentConfig | null;
  agentType: AgentType;
  onSave: (data: any) => Promise<void>;
}

const DEFAULT_SCRIPTS = {
  greeting: `Hello! Thank you for calling [BUSINESS_NAME]. I'm your AI assistant, and I'm here to help you today. 

I can assist you with:
- Scheduling appointments
- Providing general information about our services
- Connecting you with our staff if needed

How may I help you today?`,

  appointment: `I'd be happy to help you schedule an appointment. 

Let me check our availability for you. Could you please tell me:
- What type of appointment you're looking for?
- Your preferred date and time?
- Your name and phone number?

I'll find the best available slot that works for your schedule.`,

  information: `I can provide you with information about our services and practice. 

Our business hours are [BUSINESS_HOURS], and we're located at [BUSINESS_ADDRESS].

What specific information would you like to know about our services?`,

  after_hours: `Thank you for calling [BUSINESS_NAME]. 

We're currently closed, but your call is important to us. Our regular business hours are [BUSINESS_HOURS].

I can:
- Take a message for our staff
- Help you schedule an appointment for when we're open
- Provide general information about our services

If this is a medical emergency, please hang up and dial 911 immediately.

How can I assist you today?`,

  emergency: `If this is a medical emergency, please hang up immediately and call 911 or go to your nearest emergency room.

For urgent but non-emergency medical concerns during business hours, I can connect you directly with our staff.

For after-hours urgent matters, please contact our on-call service at [EMERGENCY_NUMBER] or visit the nearest urgent care facility.

Is this a medical emergency that requires immediate attention?`,
};

export function CallScriptEditor({
  agent,
  agentType,
  onSave,
}: CallScriptEditorProps) {
  const agentConfig = AGENT_TYPE_CONFIGS[agentType];
  const [scripts, setScripts] = useState<CallScript[]>([
    {
      script_name: 'Agent Prompt',
      script_type: 'main_prompt',
      script_content: agentConfig.defaultPrompt,
      is_active: true,
      is_default: true,
    },
    {
      script_name: 'Default Greeting',
      script_type: 'greeting',
      script_content: DEFAULT_SCRIPTS.greeting,
      is_active: true,
      is_default: false,
    },
    {
      script_name: 'Appointment Booking',
      script_type: 'appointment',
      script_content: DEFAULT_SCRIPTS.appointment,
      is_active: true,
      is_default: false,
    },
    {
      script_name: 'General Information',
      script_type: 'information',
      script_content: DEFAULT_SCRIPTS.information,
      is_active: true,
      is_default: false,
    },
    {
      script_name: 'After Hours',
      script_type: 'after_hours',
      script_content: DEFAULT_SCRIPTS.after_hours,
      is_active: true,
      is_default: false,
    },
    {
      script_name: 'Emergency Protocol',
      script_type: 'emergency',
      script_content: DEFAULT_SCRIPTS.emergency,
      is_active: true,
      is_default: false,
    },
  ]);

  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [showAddScript, setShowAddScript] = useState(false);

  const handleEditScript = (script: CallScript) => {
    setEditingScript({ ...script });
  };

  const handleSaveScript = () => {
    if (!editingScript) return;

    setScripts(prev =>
      prev.map(script =>
        script.script_type === editingScript.script_type
          ? editingScript
          : script
      )
    );
    setEditingScript(null);
  };

  const handleAddScript = () => {
    const newScript: CallScript = {
      script_name: 'New Script',
      script_type: 'custom',
      script_content: '',
      is_active: true,
      is_default: false,
    };
    setEditingScript(newScript);
    setShowAddScript(false);
  };

  const handleDeleteScript = (scriptType: string) => {
    if (!confirm('Are you sure you want to delete this script?')) return;

    setScripts(prev =>
      prev.filter(script => script.script_type !== scriptType)
    );
  };

  if (editingScript) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Call Script</CardTitle>
              <CardDescription>
                Customize how your AI agent responds in different scenarios
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setEditingScript(null)}>
              ← Back to Scripts
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script Name
              </label>
              <Input
                value={editingScript.script_name}
                onChange={e =>
                  setEditingScript(prev =>
                    prev ? { ...prev, script_name: e.target.value } : null
                  )
                }
                placeholder="Enter script name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Script Type
              </label>
              <Select
                value={editingScript.script_type}
                onValueChange={value =>
                  setEditingScript(prev =>
                    prev ? { ...prev, script_type: value } : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greeting">Greeting</SelectItem>
                  <SelectItem value="appointment">
                    Appointment Booking
                  </SelectItem>
                  <SelectItem value="information">
                    Information Request
                  </SelectItem>
                  <SelectItem value="after_hours">After Hours</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Script Content
            </label>
            <textarea
              value={editingScript.script_content}
              onChange={e =>
                setEditingScript(prev =>
                  prev ? { ...prev, script_content: e.target.value } : null
                )
              }
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
              placeholder="Enter your script content here..."
            />
            <div className="mt-2 text-xs text-gray-500">
              <p className="font-semibold mb-1">Available placeholders:</p>
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  • [BUSINESS_NAME] - Your business name
                  <br />
                  • [BUSINESS_ADDRESS] - Your address
                  <br />• [BUSINESS_PHONE] - Your phone number
                </div>
                <div>
                  • [BUSINESS_HOURS] - Your business hours
                  <br />
                  • [CONTACT_PERSON] - Main contact person
                  <br />• [EMERGENCY_NUMBER] - Emergency contact
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editingScript.is_active}
                onChange={e =>
                  setEditingScript(prev =>
                    prev ? { ...prev, is_active: e.target.checked } : null
                  )
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editingScript.is_default}
                onChange={e =>
                  setEditingScript(prev =>
                    prev ? { ...prev, is_default: e.target.checked } : null
                  )
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Use as default for this type</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" onClick={() => setEditingScript(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScript}>Save Script</Button>
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
              <CardTitle className="flex items-center space-x-3">
                <span>Call Scripts</span>
                <Badge variant="outline">{agentConfig.name}</Badge>
              </CardTitle>
              <CardDescription>
                Manage how your {agentConfig.name.toLowerCase()} responds in
                different scenarios
              </CardDescription>
            </div>
            <Button onClick={handleAddScript}>+ Add Custom Script</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scripts.map(script => (
              <div
                key={script.script_type}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">{script.script_name}</h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {script.script_type}
                      </span>
                      {script.is_default && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                      {!script.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {script.script_content}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditScript(script)}
                    >
                      Edit
                    </Button>
                    {script.script_type !== 'greeting' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteScript(script.script_type)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Script Testing</CardTitle>
          <CardDescription>
            Test how your scripts will sound when spoken by the AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Script to Test
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a script to test" />
                </SelectTrigger>
                <SelectContent>
                  {scripts.map(script => (
                    <SelectItem
                      key={script.script_type}
                      value={script.script_type}
                    >
                      {script.script_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline">🎵 Preview Audio</Button>
              <Button variant="outline">📝 Show Processed Text</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
