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
import { Badge } from '@/components/ui/badge';
import {
  AgentType,
  AGENT_TYPE_CONFIGS,
  AgentTypeConfig,
} from '@/types/agent-types';
import { BusinessType, AgentTemplate } from '@/types/business-types';

interface AgentTypeSelectorProps {
  selectedType?: AgentType;
  onSelect: (type: AgentType) => void;
  onContinue?: () => void;
  showContinueButton?: boolean;
  businessType?: string;
  businessTypeName?: string;
  onTemplatePreview?: (agentType: AgentType, template: AgentTemplate) => void;
}

export function AgentTypeSelector({
  selectedType,
  onSelect,
  onContinue,
  showContinueButton = false,
  businessType,
  businessTypeName,
  onTemplatePreview,
}: AgentTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<AgentType | null>(null);
  const [templates, setTemplates] = useState<Record<string, AgentTemplate>>({});
  const [loadingTemplates, setLoadingTemplates] = useState<Set<string>>(
    new Set()
  );

  const handleTypeSelect = (type: AgentType) => {
    onSelect(type);
  };

  const loadTemplate = async (
    agentType: AgentType,
    businessTypeId?: string
  ) => {
    if (templates[agentType] || !businessTypeId) return;

    setLoadingTemplates(prev => new Set([...prev, agentType]));

    try {
      // Get business type ID from the database
      const businessTypesResponse = await fetch('/api/business-types');
      const businessTypesData = await businessTypesResponse.json();
      const businessTypeObj = businessTypesData.business_types?.find(
        (bt: BusinessType) => bt.type_code === businessTypeId
      );

      if (businessTypeObj) {
        // Get agent type ID - we'll need to map the enum to database ID
        const agentTypesResponse = await fetch('/api/agent-types');
        const agentTypesData = await agentTypesResponse.json();
        const agentTypeObj = agentTypesData.agent_types?.find(
          (at: any) => at.type_code === agentType
        );

        if (agentTypeObj) {
          const templateResponse = await fetch(
            `/api/agent-templates?business_type_id=${businessTypeObj.id}&agent_type_id=${agentTypeObj.id}`
          );
          const templateData = await templateResponse.json();

          if (templateData.template) {
            setTemplates(prev => ({
              ...prev,
              [agentType]: templateData.template,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoadingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentType);
        return newSet;
      });
    }
  };

  const handleTemplatePreview = (agentType: AgentType) => {
    const template = templates[agentType];
    if (template && onTemplatePreview) {
      onTemplatePreview(agentType, template);
    }
  };

  useEffect(() => {
    // Load templates for all agent types when businessType changes
    if (businessType) {
      Object.values(AgentType).forEach(agentType => {
        loadTemplate(agentType, businessType);
      });
    }
  }, [businessType]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {businessTypeName
            ? `Configuring: AI Agent for ${businessTypeName}`
            : 'Choose Your AI Agent Type'}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {businessTypeName
            ? `Select the AI agent type optimized for ${businessTypeName} businesses. Each template includes pre-configured scripts, voice settings, and routing rules.`
            : 'Select the type of AI voice agent that best fits your business needs. Each agent type is optimized for specific tasks and customer interactions.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.values(AGENT_TYPE_CONFIGS).map(config => (
          <Card
            key={config.type}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === config.type
                ? 'ring-2 ring-orange-500 border-orange-300 bg-orange-50'
                : 'hover:border-orange-200'
            }`}
            onClick={() => handleTypeSelect(config.type)}
            onMouseEnter={() => setHoveredType(config.type)}
            onMouseLeave={() => setHoveredType(null)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{config.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
                {selectedType === config.type && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Key Capabilities:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {config.capabilities
                      .slice(0, 3)
                      .map((capability, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {capability}
                        </Badge>
                      ))}
                    {config.capabilities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{config.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>
                      Voice Tone:{' '}
                      <strong>{config.suggestedVoiceSettings.tone}</strong>
                    </span>
                    <span>
                      Speed:{' '}
                      <strong>{config.suggestedVoiceSettings.speed}x</strong>
                    </span>
                  </div>
                </div>

                {(hoveredType === config.type ||
                  selectedType === config.type) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      <h5 className="font-medium mb-1">All Capabilities:</h5>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        {config.capabilities.map((capability, index) => (
                          <li key={index}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {businessType && (
                  <div className="pt-3 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleTemplatePreview(config.type);
                      }}
                      disabled={
                        loadingTemplates.has(config.type) ||
                        !templates[config.type]
                      }
                      className="w-full"
                    >
                      {loadingTemplates.has(config.type) ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Template Preview
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showContinueButton && selectedType && onContinue && (
        <div className="flex justify-center pt-6">
          <Button onClick={onContinue} size="lg" className="px-8">
            Continue with {AGENT_TYPE_CONFIGS[selectedType].name}
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      )}

      {selectedType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Selected: {AGENT_TYPE_CONFIGS[selectedType].name}
                </h4>
                <p className="text-sm text-blue-800">
                  This agent will be optimized for{' '}
                  {AGENT_TYPE_CONFIGS[selectedType].description.toLowerCase()}.
                  You can customize the voice settings and prompts in the next
                  steps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
