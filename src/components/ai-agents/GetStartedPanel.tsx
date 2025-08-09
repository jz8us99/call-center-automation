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
import {
  Phone,
  Calendar,
  TrendingUp,
  Headphones,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';
import { AgentType, AGENT_TYPE_CONFIGS } from '@/types/ai-agent-types';

interface GetStartedPanelProps {
  onAgentTypeSelect: (agentType: AgentType) => void;
  agentStats?: {
    total_agents: number;
    active_agents: number;
    draft_agents: number;
    agents_by_type: Record<string, { count: number; languages: string[] }>;
  };
}

export function GetStartedPanel({
  onAgentTypeSelect,
  agentStats,
}: GetStartedPanelProps) {
  const [hoveredCard, setHoveredCard] = useState<AgentType | null>(null);

  const agentTypes = [
    {
      type: AgentType.INBOUND_RECEPTIONIST,
      icon: Phone,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-400',
      textColor: 'text-blue-600',
      features: [
        'Call Routing',
        'Appointment Scheduling',
        'Customer Info Collection',
        'Emergency Detection',
      ],
    },
    {
      type: AgentType.OUTBOUND_FOLLOW_UP,
      icon: Calendar,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400',
      textColor: 'text-green-600',
      features: [
        'Appointment Confirmation',
        'Reminder Calls',
        'Rescheduling',
        'No-show Prevention',
      ],
    },
    {
      type: AgentType.OUTBOUND_MARKETING,
      icon: TrendingUp,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:border-purple-400',
      textColor: 'text-purple-600',
      features: [
        'Lead Qualification',
        'Sales Presentations',
        'Objection Handling',
        'Consultation Booking',
      ],
    },
    {
      type: AgentType.INBOUND_CUSTOMER_SUPPORT,
      icon: Headphones,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:border-orange-400',
      textColor: 'text-orange-600',
      features: [
        'Technical Support',
        'Issue Resolution',
        'Ticket Management',
        'Escalation Handling',
      ],
    },
  ];

  const getAgentCount = (agentType: AgentType) => {
    return agentStats?.agents_by_type?.[agentType]?.count || 0;
  };

  const getAgentLanguages = (agentType: AgentType) => {
    return agentStats?.agents_by_type?.[agentType]?.languages || [];
  };

  const hasAgents = agentStats && agentStats.total_agents > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Get Started with AI Call Agents
          </h1>
        </div>

        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Create intelligent AI agents to handle your business calls with
          advanced multi-language support, automatic customer routing, and
          seamless integrations.
        </p>

        {/* Quick Stats */}
        {hasAgents && (
          <div className="flex items-center justify-center space-x-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agentStats.active_agents}
              </div>
              <div className="text-sm text-gray-500">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agentStats.total_agents}
              </div>
              <div className="text-sm text-gray-500">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(agentStats.agents_by_type).reduce(
                  (acc, type) => acc + type.languages.length,
                  0
                )}
              </div>
              <div className="text-sm text-gray-500">Languages</div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <Globe className="h-5 w-5 text-blue-600" />
          <div>
            <div className="font-medium text-blue-900">Multi-Language</div>
            <div className="text-sm text-blue-600">
              Auto-translate to 4 languages
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <Zap className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-green-900">Instant Setup</div>
            <div className="text-sm text-green-600">Deploy in minutes</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
          <Shield className="h-5 w-5 text-purple-600" />
          <div>
            <div className="font-medium text-purple-900">Enterprise Ready</div>
            <div className="text-sm text-purple-600">Secure & scalable</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
          <Clock className="h-5 w-5 text-orange-600" />
          <div>
            <div className="font-medium text-orange-900">24/7 Availability</div>
            <div className="text-sm text-orange-600">Never miss a call</div>
          </div>
        </div>
      </div>

      {/* Agent Type Selection Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {agentTypes.map(
          ({
            type,
            icon: Icon,
            color,
            lightColor,
            borderColor,
            hoverColor,
            textColor,
            features,
          }) => {
            const config = AGENT_TYPE_CONFIGS[type];
            const agentCount = getAgentCount(type);
            const languages = getAgentLanguages(type);
            const isHovered = hoveredCard === type;

            return (
              <Card
                key={type}
                className={`relative overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-xl ${borderColor} ${hoverColor} ${isHovered ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                onMouseEnter={() => setHoveredCard(type)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onAgentTypeSelect(type)}
              >
                {/* Background Pattern */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 ${lightColor} rounded-full transform translate-x-16 -translate-y-16 opacity-50`}
                />

                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 ${color} rounded-xl shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {config?.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                          {config?.description}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col items-end space-y-2">
                      {agentCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {agentCount} {agentCount === 1 ? 'Agent' : 'Agents'}
                        </Badge>
                      )}
                      {languages.length > 1 && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-blue-700"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          {languages.length} Languages
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Features */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      Key Capabilities:
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-sm text-gray-600"
                        >
                          <div
                            className={`w-1.5 h-1.5 ${color} rounded-full`}
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        Available Languages:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {languages.map(lang => (
                          <Badge
                            key={lang}
                            variant="outline"
                            className="text-xs"
                          >
                            {lang.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      className={`w-full group ${color} hover:opacity-90 text-white font-medium`}
                      onClick={e => {
                        e.stopPropagation();
                        onAgentTypeSelect(type);
                      }}
                    >
                      <span>
                        {agentCount > 0
                          ? 'Manage Agents'
                          : 'Configure Voice AI Agent'}
                      </span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>

                {/* Hover Effect Overlay */}
                {isHovered && (
                  <div
                    className={`absolute inset-0 ${lightColor} opacity-10 pointer-events-none`}
                  />
                )}
              </Card>
            );
          }
        )}
      </div>

      {/* Quick Setup Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Sparkles className="h-5 w-5" />
            <span>Quick Setup Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="font-medium text-blue-900">
                1. Choose Your Agent Type
              </div>
              <p className="text-sm text-blue-700">
                Select the agent that best matches your business needs
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-900">
                2. Configure Business Context
              </div>
              <p className="text-sm text-blue-700">
                Add your business information and customize responses
              </p>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-blue-900">3. Deploy & Test</div>
              <p className="text-sm text-blue-700">
                Launch your agent and test with real scenarios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
