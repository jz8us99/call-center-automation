'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';

// Components
import { GetStartedPanel } from '@/components/ai-agents/GetStartedPanel';
import { AgentDashboard } from '@/components/ai-agents/AgentDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpButton } from '@/components/modals/HelpDialog';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

// Types
import {
  AgentType,
  AgentStatus,
  SupportedLanguage,
  AIAgent,
  AgentDashboardData,
  DuplicateAgentRequest,
} from '@/types/ai-agent-types';

type ViewMode = 'getting-started' | 'dashboard' | 'agent-config';

interface AgentConfigState {
  agentType: AgentType;
  isEditing: boolean;
  editingAgent?: AIAgent;
}

export default function AIAgentsPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('getting-started');
  const [dashboardData, setDashboardData] = useState<AgentDashboardData | null>(
    null
  );
  const [agentConfigState, setAgentConfigState] =
    useState<AgentConfigState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile(user);

  // Authentication effect
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !profileLoading && !user) {
      router.push('/auth');
    }
  }, [loading, profileLoading, user, router]);

  // Load dashboard data
  useEffect(() => {
    if (user && viewMode === 'dashboard') {
      loadDashboardData();
    }
  }, [user, viewMode]);

  const loadDashboardData = async () => {
    try {
      const token = await supabase.auth
        .getSession()
        .then(({ data: { session } }) => session?.access_token);

      const response = await fetch('/api/ai-agents/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const result = await response.json();
      setDashboardData(result.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  const handleAgentTypeSelect = (agentType: AgentType) => {
    setAgentConfigState({
      agentType,
      isEditing: false,
    });
    setViewMode('agent-config');
  };

  const handleCreateAgent = async (agentType: AgentType) => {
    setAgentConfigState({
      agentType,
      isEditing: false,
    });
    setViewMode('agent-config');
  };

  const handleEditAgent = (agent: AIAgent) => {
    setAgentConfigState({
      agentType: agent.agent_type_id as AgentType,
      isEditing: true,
      editingAgent: agent,
    });
    setViewMode('agent-config');
  };

  const handleDuplicateAgent = async (agent: AIAgent) => {
    try {
      // For now, default to Spanish (es) - TODO: implement proper language selection dialog
      const targetLanguage = 'es';

      const token = await supabase.auth
        .getSession()
        .then(({ data: { session } }) => session?.access_token);

      const duplicateRequest: DuplicateAgentRequest = {
        source_agent_id: agent.id,
        target_language: targetLanguage as SupportedLanguage,
        auto_translate: true,
      };

      const response = await fetch(`/api/ai-agents/${agent.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(duplicateRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate agent');
      }

      // Reload dashboard data
      await loadDashboardData();
      toast.success('代理复制成功!');
    } catch (error) {
      console.error('Error duplicating agent:', error);
      toast.error(
        `错误: ${error instanceof Error ? error.message : '复制代理失败'}`
      );
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    const confirmed = await confirm({
      title: 'Delete AI Agent',
      description:
        'Are you sure you want to delete this agent? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const token = await supabase.auth
        .getSession()
        .then(({ data: { session } }) => session?.access_token);

      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete agent');
      }

      // Reload dashboard data
      await loadDashboardData();
      toast.success('代理删除成功');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error(
        `错误: ${error instanceof Error ? error.message : '删除代理失败'}`
      );
    }
  };

  const handleToggleStatus = async (agentId: string, status: AgentStatus) => {
    try {
      const token = await supabase.auth
        .getSession()
        .then(({ data: { session } }) => session?.access_token);

      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update agent status');
      }

      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast.error(
        `错误: ${error instanceof Error ? error.message : '更新代理状态失败'}`
      );
    }
  };

  const handleViewAgent = (agent: AIAgent) => {
    // TODO: Implement agent detail view
    console.log('View agent:', agent);
    toast.info('代理详情视图尚未实现');
  };

  const handleBackToDashboard = () => {
    setViewMode(
      dashboardData && dashboardData.agent_summary.total_agents > 0
        ? 'dashboard'
        : 'getting-started'
    );
    setAgentConfigState(null);
  };

  // Determine initial view mode based on existing agents
  useEffect(() => {
    if (dashboardData) {
      setViewMode(
        dashboardData.agent_summary.total_agents > 0
          ? 'dashboard'
          : 'getting-started'
      );
    }
  }, [dashboardData]);

  // Loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">
            Loading AI Agent Management...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Error Loading Data
            </h3>
            <p className="text-black dark:text-gray-300 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {viewMode !== 'getting-started' && (
                <Button
                  variant="ghost"
                  onClick={handleBackToDashboard}
                  className="text-black dark:text-gray-300 hover:text-black dark:text-white"
                >
                  ← Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  {viewMode === 'getting-started' && 'AI Agent Management'}
                  {viewMode === 'dashboard' && 'Agent Dashboard'}
                  {viewMode === 'agent-config' && 'Agent Configuration'}
                </h1>
                <p className="text-sm text-black dark:text-gray-300">
                  {viewMode === 'getting-started' &&
                    'Create and manage your AI voice agents with multi-language support'}
                  {viewMode === 'dashboard' &&
                    'Monitor and manage all your AI agents'}
                  {viewMode === 'agent-config' &&
                    'Configure your AI agent settings and behavior'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-black dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                Dashboard
              </Button>
              {viewMode === 'getting-started' &&
                dashboardData &&
                dashboardData.agent_summary.total_agents > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('dashboard')}
                  >
                    View All Agents
                  </Button>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {viewMode === 'getting-started' && (
          <GetStartedPanel
            onAgentTypeSelect={handleAgentTypeSelect}
            agentStats={dashboardData?.agent_summary}
          />
        )}

        {viewMode === 'dashboard' && dashboardData && (
          <AgentDashboard
            dashboardData={dashboardData}
            onCreateAgent={handleCreateAgent}
            onEditAgent={handleEditAgent}
            onDuplicateAgent={handleDuplicateAgent}
            onDeleteAgent={handleDeleteAgent}
            onToggleStatus={handleToggleStatus}
            onViewAgent={handleViewAgent}
          />
        )}

        {viewMode === 'agent-config' && agentConfigState && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              {agentConfigState.isEditing
                ? 'Edit Agent Configuration'
                : 'Agent Configuration'}
            </h3>
            <p className="text-black dark:text-gray-300 mb-6">
              The advanced agent configuration interface is under development.
              This will include the comprehensive prompt builder, voice
              settings, and business context configuration.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Agent Type: {agentConfigState.agentType}</p>
              {agentConfigState.editingAgent && (
                <p>Editing: {agentConfigState.editingAgent.name}</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="mt-6"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>

      {/* Help Button */}
      <HelpButton currentPage="ai-agents" />
      <ConfirmDialog />
    </div>
  );
}
