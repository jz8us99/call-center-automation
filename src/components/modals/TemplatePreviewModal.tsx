'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';

interface AgentTemplate {
  name?: string;
  description?: string;
  prompt_template?: string;
  voice_settings?: Record<string, any>;
  call_routing?: Record<string, any>;
  configuration_template?: Record<string, any>;
}
import { X } from 'lucide-react';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentType: AgentType;
  template: AgentTemplate;
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  agentType,
  template,
}: TemplatePreviewModalProps) {
  const agentConfig = AGENT_TYPE_CONFIGS[agentType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{agentConfig.icon}</span>
              <div>
                <DialogTitle className="text-xl">
                  {template.name || `${agentConfig.name} Template`}
                </DialogTitle>
                <DialogDescription>
                  Template preview for {agentConfig.name}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Template Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📋</span>
                <span>Template Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600">
                    {template.description || agentConfig.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Capabilities
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {agentConfig.capabilities.map((capability, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Scripts */}
          {template.prompt_template && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📝</span>
                  <span>Predefined Call Script</span>
                </CardTitle>
                <CardDescription>
                  The base script template that will be used for this agent type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {template.prompt_template}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Settings */}
          {template.voice_settings &&
            Object.keys(template.voice_settings).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🎙️</span>
                    <span>Voice Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Optimized voice configuration for this business type and
                    agent combination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(template.voice_settings).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-700 capitalize">
                            {key.replace('_', ' ')}:
                          </span>
                          <span className="text-gray-900 font-mono">
                            {typeof value === 'number'
                              ? `${value}x`
                              : String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Call Routing */}
          {template.call_routing &&
            Object.keys(template.call_routing).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📞</span>
                    <span>Call Routing Logic</span>
                  </CardTitle>
                  <CardDescription>
                    Pre-configured routing rules and escalation paths
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(template.call_routing).map(
                      ([key, value]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-1 capitalize">
                            {key.replace('_', ' ')}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {typeof value === 'object' ? (
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              String(value)
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Additional Configuration */}
          {template.configuration_template &&
            Object.keys(template.configuration_template).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>⚙️</span>
                    <span>Additional Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Extra settings and preferences for this template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(template.configuration_template, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close Preview
            </Button>
            <Button onClick={onClose}>Use This Template</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
