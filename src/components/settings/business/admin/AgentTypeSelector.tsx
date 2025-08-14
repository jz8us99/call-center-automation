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
import { Badge } from '@/components/ui/badge';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/agent-types';

interface AgentTypeSelectorProps {
  selectedType?: AgentType;
  onSelect: (type: AgentType) => void;
  onContinue?: () => void;
  showContinueButton?: boolean;
}

export function AgentTypeSelector({
  selectedType,
  onSelect,
  onContinue,
  showContinueButton = false,
}: AgentTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<AgentType | null>(null);

  const handleTypeSelect = (type: AgentType) => {
    onSelect(type);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your AI Agent Type
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the type of AI voice agent that best fits your business needs.
          Each agent type is optimized for specific tasks and customer
          interactions.
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
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <Badge
                        variant={
                          config.direction === 'inbound'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {config.direction}
                      </Badge>
                    </div>
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
