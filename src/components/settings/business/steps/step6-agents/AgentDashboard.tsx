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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Plus,
  Phone,
  Calendar,
  TrendingUp,
  Headphones,
  Globe,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Eye,
  Activity,
  Users,
  Clock,
  Target,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AIAgent,
  AgentType,
  AgentStatus,
  SupportedLanguage,
  AgentDashboardData,
  AGENT_TYPE_CONFIGS,
  SUPPORTED_LANGUAGES,
} from '@/types/ai-agent-types';

interface AgentDashboardProps {
  dashboardData: AgentDashboardData;
  onCreateAgent: (agentType: AgentType) => void;
  onEditAgent: (agent: AIAgent) => void;
  onDuplicateAgent: (agent: AIAgent) => void;
  onDeleteAgent: (agentId: string) => void;
  onToggleStatus: (agentId: string, status: AgentStatus) => void;
  onViewAgent: (agent: AIAgent) => void;
}

export function AgentDashboard({
  dashboardData,
  onCreateAgent,
  onEditAgent,
  onDuplicateAgent,
  onDeleteAgent,
  onToggleStatus,
  onViewAgent,
}: AgentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AgentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AgentStatus | 'all'>('all');
  const [filterLanguage, setFilterLanguage] = useState<
    SupportedLanguage | 'all'
  >('all');
  const [agents, setAgents] = useState<AIAgent[]>([]);

  // Mock agents data - in real app, this would come from props or API
  useEffect(() => {
    // This would fetch actual agents from the API
    setAgents([]);
  }, []);

  const getAgentTypeIcon = (agentType: AgentType) => {
    const icons = {
      [AgentType.INBOUND_CALL]: Phone,
      [AgentType.OUTBOUND_APPOINTMENT]: Calendar,
      [AgentType.OUTBOUND_MARKETING]: TrendingUp,
      [AgentType.CUSTOMER_SUPPORT]: Headphones,
    };
    return icons[agentType] || Phone;
  };

  const getStatusColor = (status: AgentStatus) => {
    const colors = {
      [AgentStatus.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
      [AgentStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-200',
      [AgentStatus.INACTIVE]: 'bg-red-100 text-red-800 border-red-200',
      [AgentStatus.ARCHIVED]: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return colors[status] || colors[AgentStatus.DRAFT];
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'all' || agent.agent_type_id === filterType;
    const matchesStatus =
      filterStatus === 'all' || agent.status === filterStatus;
    const matchesLanguage =
      filterLanguage === 'all' || agent.language_id === filterLanguage;

    return matchesSearch && matchesType && matchesStatus && matchesLanguage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Agent Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your AI voice agents across all languages and
            types
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {Object.entries(AGENT_TYPE_CONFIGS).map(([type, config]) => {
              const Icon = getAgentTypeIcon(type as AgentType);
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => onCreateAgent(type as AgentType)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.name}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Agents
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.agent_summary.total_agents}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="flex items-center text-sm text-green-600">
                <Activity className="h-4 w-4 mr-1" />
                {dashboardData.agent_summary.active_agents} active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Agents
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {dashboardData.agent_summary.active_agents}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(dashboardData.agent_summary.active_agents / dashboardData.agent_summary.total_agents) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Languages</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Object.values(dashboardData.agents_by_type).reduce(
                    (acc, type) => acc + type.languages.length,
                    0
                  )}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Multi-language support
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recent Calls
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {dashboardData.recent_activity?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Phone className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">Last 24 hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search agents by name or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filterType}
              onValueChange={value => setFilterType(value as AgentType | 'all')}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(AGENT_TYPE_CONFIGS).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={value =>
                setFilterStatus(value as AgentStatus | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterLanguage}
              onValueChange={value =>
                setFilterLanguage(value as SupportedLanguage | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    {config.native_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {agents.length === 0
                ? 'No AI Agents Yet'
                : 'No Agents Match Your Filters'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {agents.length === 0
                ? 'Create your first AI voice agent to start handling calls for your business.'
                : "Try adjusting your search or filter criteria to find the agents you're looking for."}
            </p>
            {agents.length === 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {Object.entries(AGENT_TYPE_CONFIGS).map(([type, config]) => {
                    const Icon = getAgentTypeIcon(type as AgentType);
                    return (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => onCreateAgent(type as AgentType)}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{config.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => {
            const agentTypeConfig =
              AGENT_TYPE_CONFIGS[agent.agent_type_id as AgentType] || {};
            const Icon = getAgentTypeIcon(agent.agent_type_id as AgentType);

            return (
              <Card
                key={agent.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {agent.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {agentTypeConfig.name}
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewAgent(agent)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditAgent(agent)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDuplicateAgent(agent)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate Agent
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            onToggleStatus(
                              agent.id,
                              agent.status === AgentStatus.ACTIVE
                                ? AgentStatus.INACTIVE
                                : AgentStatus.ACTIVE
                            )
                          }
                        >
                          {agent.status === AgentStatus.ACTIVE ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteAgent(agent.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status, Direction and Language */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status.charAt(0).toUpperCase() +
                          agent.status.slice(1)}
                      </Badge>
                      <Badge
                        variant={
                          agentTypeConfig.direction === 'inbound'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {agentTypeConfig.direction || 'inbound'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <span>
                        {SUPPORTED_LANGUAGES[
                          agent.language_id as SupportedLanguage
                        ]?.native_name || 'English'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {agent.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {agent.description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        0
                      </div>
                      <div className="text-xs text-gray-500">Calls Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        -
                      </div>
                      <div className="text-xs text-gray-500">Avg Duration</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onEditAgent(agent)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onViewAgent(agent)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      {dashboardData.recent_activity &&
        dashboardData.recent_activity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest call logs from your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recent_activity
                  .slice(0, 5)
                  .map((call, index) => (
                    <div
                      key={call.call_id || index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-white rounded-lg">
                          <Phone className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Call from {call.phone_number || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Agent:{' '}
                            {agents.find(a => a.id === call.agent_id)?.name ||
                              'Unknown Agent'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {call.duration
                            ? `${Math.round(call.duration / 60)}min`
                            : 'Ongoing'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {call.started_at
                            ? new Date(call.started_at).toLocaleTimeString()
                            : 'Now'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
