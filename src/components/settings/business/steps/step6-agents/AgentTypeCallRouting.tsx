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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';
import {
  CheckIcon,
  PhoneIcon,
  ClockIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/icons';

interface CallRoutingRule {
  id: string;
  name: string;
  condition: 'keyword' | 'sentiment' | 'time' | 'queue_length' | 'agent_busy';
  condition_value: string;
  action: 'transfer' | 'voicemail' | 'callback' | 'queue';
  target_number?: string;
  message?: string;
  priority: number;
  is_active: boolean;
}

interface BusinessHours {
  [key: string]: {
    is_open: boolean;
    open_time: string;
    close_time: string;
  };
}

interface AgentCallRoutingConfig {
  id: string;
  agent_type: AgentType;
  ai_agent_mode: 'always_active' | 'business_hours_only' | 'after_hours_only';
  ai_agent_hours: BusinessHours;
  primary_number: string;
  fallback_number?: string;
  voicemail_enabled: boolean;
  voicemail_message?: string;
  business_hours: BusinessHours;
  after_hours_action: 'voicemail' | 'transfer' | 'callback';
  after_hours_message?: string;
  routing_rules: CallRoutingRule[];
  max_queue_time: number;
  callback_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentTypeCallRoutingProps {
  agentType: AgentType;
  onSave: (config: AgentCallRoutingConfig) => Promise<void>;
  businessInfo?: any;
}

export function AgentTypeCallRouting({
  agentType,
  onSave,
  businessInfo,
}: AgentTypeCallRoutingProps) {
  const [routingConfig, setRoutingConfig] =
    useState<AgentCallRoutingConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const agentConfig = AGENT_TYPE_CONFIGS[agentType];

  useEffect(() => {
    loadRoutingConfig();
  }, [agentType]);

  const loadRoutingConfig = async () => {
    try {
      setLoading(true);
      const defaultConfig = createDefaultRoutingConfig();
      setRoutingConfig(defaultConfig);
    } catch (error) {
      console.error('Failed to load routing config:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRoutingConfig = (): AgentCallRoutingConfig => {
    const businessPhone = businessInfo?.business_phone || '';

    const defaultRules: CallRoutingRule[] = [];

    // Add agent-type specific default rules
    if (agentType === AgentType.INBOUND_RECEPTIONIST) {
      defaultRules.push({
        id: '1',
        name: 'Emergency Keywords',
        condition: 'keyword',
        condition_value: 'emergency,urgent,critical,immediate',
        action: 'transfer',
        target_number: businessPhone,
        message: 'Transferring you immediately to our emergency line.',
        priority: 1,
        is_active: true,
      });
    }

    if (agentType === AgentType.INBOUND_CUSTOMER_SUPPORT) {
      defaultRules.push({
        id: '2',
        name: 'Technical Issues',
        condition: 'keyword',
        condition_value: 'broken,not working,error,problem,issue',
        action: 'transfer',
        target_number: businessPhone,
        message: 'Let me connect you with our technical support team.',
        priority: 2,
        is_active: true,
      });
    }

    if (agentType === AgentType.OUTBOUND_FOLLOW_UP) {
      defaultRules.push({
        id: '3',
        name: 'Reschedule Requests',
        condition: 'keyword',
        condition_value: 'reschedule,change,cancel,postpone',
        action: 'transfer',
        target_number: businessPhone,
        message: 'Let me connect you with our scheduling team for assistance.',
        priority: 1,
        is_active: true,
      });
    }

    if (agentType === AgentType.OUTBOUND_MARKETING) {
      defaultRules.push({
        id: '4',
        name: 'Not Interested',
        condition: 'keyword',
        condition_value: 'not interested,remove,unsubscribe,do not call',
        action: 'callback',
        message: "I understand. I'll make sure to update your preferences.",
        priority: 1,
        is_active: true,
      });
    }

    return {
      id: 'default',
      agent_type: agentType,
      ai_agent_mode: 'always_active',
      ai_agent_hours: {
        monday: { is_open: true, open_time: '00:00', close_time: '23:59' },
        tuesday: { is_open: true, open_time: '00:00', close_time: '23:59' },
        wednesday: { is_open: true, open_time: '00:00', close_time: '23:59' },
        thursday: { is_open: true, open_time: '00:00', close_time: '23:59' },
        friday: { is_open: true, open_time: '00:00', close_time: '23:59' },
        saturday: { is_open: true, open_time: '00:00', close_time: '23:59' },
        sunday: { is_open: true, open_time: '00:00', close_time: '23:59' },
      },
      primary_number: businessPhone,
      fallback_number: '',
      voicemail_enabled: true,
      voicemail_message: `Thank you for calling ${businessInfo?.business_name || '[Business Name]'}. Our AI assistant has transferred you to voicemail. Please leave your name, number, and a brief message, and our team will get back to you as soon as possible.`,
      business_hours: {
        monday: { is_open: true, open_time: '09:00', close_time: '17:00' },
        tuesday: { is_open: true, open_time: '09:00', close_time: '17:00' },
        wednesday: { is_open: true, open_time: '09:00', close_time: '17:00' },
        thursday: { is_open: true, open_time: '09:00', close_time: '17:00' },
        friday: { is_open: true, open_time: '09:00', close_time: '17:00' },
        saturday: { is_open: false, open_time: '09:00', close_time: '13:00' },
        sunday: { is_open: false, open_time: '09:00', close_time: '17:00' },
      },
      after_hours_action: 'voicemail',
      after_hours_message: `Thank you for calling ${businessInfo?.business_name || '[Business Name]'}. While I can help with many things 24/7, our human staff is available Monday through Friday, 9 AM to 5 PM. I can take a message, schedule a callback, or try to assist you directly.`,
      routing_rules: defaultRules,
      max_queue_time: 300, // 5 minutes
      callback_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleSaveConfig = async () => {
    if (!routingConfig) return;

    try {
      console.log(
        'AgentTypeCallRouting: Saving routing config:',
        routingConfig
      );
      console.log(
        'AgentTypeCallRouting: After hours message:',
        routingConfig.after_hours_message
      );
      console.log(
        'AgentTypeCallRouting: Voicemail message:',
        routingConfig.voicemail_message
      );
      await onSave(routingConfig);
      setIsEditing(false);
      console.log('AgentTypeCallRouting: Save completed successfully');
    } catch (error) {
      console.error('Failed to save routing config:', error);
    }
  };

  const updateConfig = (field: keyof AgentCallRoutingConfig, value: any) => {
    if (!routingConfig) return;
    console.log(`AgentTypeCallRouting: Updating ${field}:`, value);
    const updatedConfig = {
      ...routingConfig,
      [field]: value,
      updated_at: new Date().toISOString(),
    };
    console.log('AgentTypeCallRouting: Updated config:', updatedConfig);
    setRoutingConfig(updatedConfig);
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    if (!routingConfig) return;
    setRoutingConfig({
      ...routingConfig,
      business_hours: {
        ...routingConfig.business_hours,
        [day]: {
          ...routingConfig.business_hours[day],
          [field]: value,
        },
      },
    });
  };

  const updateAIAgentHours = (day: string, field: string, value: any) => {
    if (!routingConfig) return;
    console.log(
      `AgentTypeCallRouting: Updating AI agent hours ${day}.${field}:`,
      value
    );
    setRoutingConfig({
      ...routingConfig,
      ai_agent_hours: {
        ...routingConfig.ai_agent_hours,
        [day]: {
          ...routingConfig.ai_agent_hours[day],
          [field]: value,
        },
      },
      updated_at: new Date().toISOString(),
    });
  };

  const addRoutingRule = () => {
    if (!routingConfig) return;
    const newRule: CallRoutingRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      condition: 'keyword',
      condition_value: '',
      action: 'transfer',
      priority: routingConfig.routing_rules.length + 1,
      is_active: true,
    };
    setRoutingConfig({
      ...routingConfig,
      routing_rules: [...routingConfig.routing_rules, newRule],
    });
  };

  const updateRoutingRule = (
    id: string,
    field: keyof CallRoutingRule,
    value: any
  ) => {
    if (!routingConfig) return;
    setRoutingConfig({
      ...routingConfig,
      routing_rules: routingConfig.routing_rules.map(rule =>
        rule.id === id ? { ...rule, [field]: value } : rule
      ),
    });
  };

  const removeRoutingRule = (id: string) => {
    if (!routingConfig) return;
    setRoutingConfig({
      ...routingConfig,
      routing_rules: routingConfig.routing_rules.filter(rule => rule.id !== id),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 dark:bg-gray-800">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!routingConfig) return null;

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <PhoneIcon className="h-5 w-5" />
                <span>Call Routing - {agentConfig?.name}</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Configure call routing, transfers, and fallback options for your{' '}
                {agentType.replace(/_/g, ' ').toLowerCase()} agent
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'View Mode' : 'Edit Routing'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* AI Agent Activation Mode */}
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="dark:text-gray-100">
            AI Agent Activation
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            Configure when your AI agent should be active and handle calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 dark:bg-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Agent Operating Mode
            </label>
            <Select
              value={routingConfig.ai_agent_mode}
              onValueChange={value => updateConfig('ai_agent_mode', value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activation mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always_active">
                  Always Active (24/7) - Recommended
                </SelectItem>
                <SelectItem value="business_hours_only">
                  Business Hours Only
                </SelectItem>
                <SelectItem value="after_hours_only">
                  After Hours Only
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {routingConfig.ai_agent_mode === 'always_active' &&
                'AI agent handles calls 24/7, transferring to humans during business hours when needed'}
              {routingConfig.ai_agent_mode === 'business_hours_only' &&
                'AI agent only active during business hours. Direct to voicemail after hours.'}
              {routingConfig.ai_agent_mode === 'after_hours_only' &&
                'AI agent only handles calls outside business hours. Direct to humans during business hours.'}
            </p>
          </div>

          {routingConfig.ai_agent_mode !== 'always_active' && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                AI Agent Active Hours
              </h4>
              <div className="space-y-3">
                {Object.entries(routingConfig.ai_agent_hours).map(
                  ([day, hours]) => (
                    <div
                      key={day}
                      className="grid grid-cols-12 gap-3 items-center"
                    >
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {day}
                        </label>
                      </div>
                      <div className="col-span-2">
                        <Switch
                          checked={hours.is_open}
                          onCheckedChange={checked =>
                            updateAIAgentHours(day, 'is_open', checked)
                          }
                          disabled={!isEditing}
                        />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          {hours.is_open ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {hours.is_open && (
                        <>
                          <div className="col-span-3">
                            <Input
                              type="time"
                              value={hours.open_time}
                              onChange={e =>
                                updateAIAgentHours(
                                  day,
                                  'open_time',
                                  e.target.value
                                )
                              }
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="col-span-1 text-center text-gray-500 dark:text-gray-400">
                            to
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="time"
                              value={hours.close_time}
                              onChange={e =>
                                updateAIAgentHours(
                                  day,
                                  'close_time',
                                  e.target.value
                                )
                              }
                              disabled={!isEditing}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Primary Routing */}
        <Card className="dark:bg-gray-800">
          <CardHeader className="dark:bg-gray-800">
            <CardTitle className="dark:text-gray-100">
              Primary Routing
            </CardTitle>
            <CardDescription className="dark:text-gray-300">
              Main phone numbers and basic routing settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 dark:bg-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Transfer Number
              </label>
              <Input
                type="tel"
                value={routingConfig.primary_number}
                onChange={e => updateConfig('primary_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fallback Number (Optional)
              </label>
              <Input
                type="tel"
                value={routingConfig.fallback_number || ''}
                onChange={e => updateConfig('fallback_number', e.target.value)}
                placeholder="+1 (555) 987-6543"
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Voicemail
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow callers to leave voicemail messages
                </p>
              </div>
              <Switch
                checked={routingConfig.voicemail_enabled}
                onCheckedChange={checked =>
                  updateConfig('voicemail_enabled', checked)
                }
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Callback Requests
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow callers to request callback
                </p>
              </div>
              <Switch
                checked={routingConfig.callback_enabled}
                onCheckedChange={checked =>
                  updateConfig('callback_enabled', checked)
                }
                disabled={!isEditing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Queue Time (seconds)
              </label>
              <Input
                type="number"
                value={routingConfig.max_queue_time}
                onChange={e =>
                  updateConfig('max_queue_time', parseInt(e.target.value))
                }
                placeholder="300"
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* After Hours */}
        <Card className="dark:bg-gray-800">
          <CardHeader className="dark:bg-gray-800">
            <CardTitle className="dark:text-gray-100">
              After Hours Settings
            </CardTitle>
            <CardDescription className="dark:text-gray-300">
              How your AI agent handles calls when human staff is unavailable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 dark:bg-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                After Hours Action
              </label>
              <Select
                value={routingConfig.after_hours_action}
                onValueChange={value =>
                  updateConfig('after_hours_action', value)
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voicemail">Send to Voicemail</SelectItem>
                  <SelectItem value="transfer">Transfer to Number</SelectItem>
                  <SelectItem value="callback">Offer Callback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                After Hours Message
              </label>
              <textarea
                value={routingConfig.after_hours_message || ''}
                onChange={e =>
                  updateConfig('after_hours_message', e.target.value)
                }
                placeholder="Enter after hours message..."
                rows={3}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600"
              />
            </div>

            {routingConfig.voicemail_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voicemail Greeting
                </label>
                <textarea
                  value={routingConfig.voicemail_message || ''}
                  onChange={e =>
                    updateConfig('voicemail_message', e.target.value)
                  }
                  placeholder="Enter voicemail greeting..."
                  rows={3}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Agent Operating Hours */}
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
            <ClockIcon className="h-5 w-5" />
            <span>AI Agent Operating Hours</span>
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            When your AI agent should transfer calls to human staff vs handle
            independently
          </CardDescription>
        </CardHeader>
        <CardContent className="dark:bg-gray-800">
          <div className="space-y-4">
            {Object.entries(routingConfig.business_hours).map(
              ([day, hours]) => (
                <div key={day} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {day}
                    </label>
                  </div>
                  <div className="col-span-2">
                    <Switch
                      checked={hours.is_open}
                      onCheckedChange={checked =>
                        updateBusinessHours(day, 'is_open', checked)
                      }
                      disabled={!isEditing}
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {hours.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {hours.is_open && (
                    <>
                      <div className="col-span-3">
                        <Input
                          type="time"
                          value={hours.open_time}
                          onChange={e =>
                            updateBusinessHours(
                              day,
                              'open_time',
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col-span-1 text-center text-gray-500 dark:text-gray-400">
                        to
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="time"
                          value={hours.close_time}
                          onChange={e =>
                            updateBusinessHours(
                              day,
                              'close_time',
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Routing Rules */}
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
                <AlertTriangleIcon className="h-5 w-5" />
                <span>Smart Routing Rules</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Automatic routing based on keywords, sentiment, or conditions
              </CardDescription>
            </div>
            {isEditing && (
              <Button onClick={addRoutingRule} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="dark:bg-gray-800">
          <div className="space-y-4">
            {routingConfig.routing_rules.map((rule, index) => (
              <Card
                key={rule.id}
                className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
              >
                <CardContent className="p-4 dark:bg-gray-800">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={rule.is_active ? 'default' : 'secondary'}
                          className={
                            rule.is_active
                              ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                          }
                        >
                          Rule {index + 1}
                        </Badge>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={checked =>
                            updateRoutingRule(rule.id, 'is_active', checked)
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoutingRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rule Name
                        </label>
                        <Input
                          value={rule.name}
                          onChange={e =>
                            updateRoutingRule(rule.id, 'name', e.target.value)
                          }
                          placeholder="Rule name"
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Condition Type
                        </label>
                        <Select
                          value={rule.condition}
                          onValueChange={value =>
                            updateRoutingRule(rule.id, 'condition', value)
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keyword">
                              Keywords Detected
                            </SelectItem>
                            <SelectItem value="sentiment">
                              Negative Sentiment
                            </SelectItem>
                            <SelectItem value="time">Time-based</SelectItem>
                            <SelectItem value="queue_length">
                              Queue Length
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700  dark:text-gray-300  mb-2">
                        {rule.condition === 'keyword'
                          ? 'Keywords (comma-separated)'
                          : 'Condition Value'}
                      </label>
                      <Input
                        value={rule.condition_value}
                        onChange={e =>
                          updateRoutingRule(
                            rule.id,
                            'condition_value',
                            e.target.value
                          )
                        }
                        placeholder={
                          rule.condition === 'keyword'
                            ? 'emergency, urgent, help'
                            : 'Enter condition value'
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Action
                        </label>
                        <Select
                          value={rule.action}
                          onValueChange={value =>
                            updateRoutingRule(rule.id, 'action', value)
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transfer">
                              Transfer to Number
                            </SelectItem>
                            <SelectItem value="voicemail">
                              Send to Voicemail
                            </SelectItem>
                            <SelectItem value="callback">
                              Offer Callback
                            </SelectItem>
                            <SelectItem value="queue">Add to Queue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {rule.action === 'transfer' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Transfer Number
                          </label>
                          <Input
                            type="tel"
                            value={rule.target_number || ''}
                            onChange={e =>
                              updateRoutingRule(
                                rule.id,
                                'target_number',
                                e.target.value
                              )
                            }
                            placeholder="+1 (555) 123-4567"
                            disabled={!isEditing}
                          />
                        </div>
                      )}
                    </div>

                    {rule.message && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Message to Caller
                        </label>
                        <Input
                          value={rule.message}
                          onChange={e =>
                            updateRoutingRule(
                              rule.id,
                              'message',
                              e.target.value
                            )
                          }
                          placeholder="Message played before action"
                          disabled={!isEditing}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {routingConfig.routing_rules.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No routing rules configured</p>
                {isEditing && (
                  <Button onClick={addRoutingRule} className="mt-2" size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Your First Rule
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="dark:bg-gray-800">
          <CardContent className="pt-6 dark:bg-gray-800">
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadRoutingConfig(); // Reset changes
                }}
              >
                Cancel Changes
              </Button>
              <Button
                onClick={handleSaveConfig}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Routing Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
