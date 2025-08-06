'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUserToken, getCurrentUserInfo } from '@/lib/get-jwt-token';
import { User } from '@supabase/supabase-js';

interface DebugInfo {
  [key: string]: unknown;
}

interface RLSStatus {
  [key: string]: unknown;
}

interface UserInfo {
  user: User | null;
  token: string | null;
  hasToken: boolean;
}

export default function DebugRLSPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [rlsStatus, setRlsStatus] = useState<RLSStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { user, token } = await getCurrentUserInfo();
    setUserInfo({ user, token, hasToken: !!token });
  };

  const runDebug = async () => {
    setLoading(true);
    try {
      const token = await getCurrentUserToken();

      const response = await fetch('/api/debug-rls', {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      const result = await response.json();
      setDebugInfo(result);
    } catch (error) {
      console.error('Debug failed:', error);
      setDebugInfo({ error: 'Debug request failed' });
    } finally {
      setLoading(false);
    }
  };

  const checkRLSStatus = async () => {
    try {
      const response = await fetch('/api/fix-rls');
      const result = await response.json();
      setRlsStatus(result);
    } catch (error) {
      console.error('RLS check failed:', error);
    }
  };

  const fixRLS = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_rls_policies' }),
      });

      const result = await response.json();
      alert(result.success ? 'RLS策略已修复!' : `修复失败: ${result.error}`);

      // 重新检查状态
      await checkRLSStatus();
      await runDebug();
    } catch {
      alert('修复请求失败');
    } finally {
      setLoading(false);
    }
  };

  const disableRLS = async () => {
    if (!confirm('确定要禁用RLS吗？这仅用于测试！')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/fix-rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_rls' }),
      });

      const result = await response.json();
      alert(
        result.success ? 'RLS已禁用（仅测试用）' : `禁用失败: ${result.error}`
      );

      await checkRLSStatus();
    } catch {
      alert('禁用请求失败');
    } finally {
      setLoading(false);
    }
  };

  const createTestPolicy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_test_policy' }),
      });

      const result = await response.json();
      alert(result.success ? '测试策略已创建' : `创建失败: ${result.error}`);

      await checkRLSStatus();
    } catch {
      alert('创建测试策略失败');
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    const token = await getCurrentUserToken();
    if (!token) {
      alert('请先登录获取token');
      return;
    }

    try {
      // 测试GET
      const getResponse = await fetch('/api/customer-call-logs-rls', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('GET Response:', await getResponse.json());

      // 测试POST
      const postResponse = await fetch('/api/customer-call-logs-rls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: 'Test',
          last_name: 'User',
          phone: '1234567890',
          email: 'test@example.com',
        }),
      });

      const postResult = await postResponse.json();
      console.log('POST Response:', postResult);

      alert(`API测试完成，请查看控制台。POST状态: ${postResponse.status}`);
    } catch (error) {
      alert('API测试失败');
      console.error(error);
    }
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background:
          'linear-gradient(135deg, hsl(263, 30%, 15%) 0%, hsl(263, 35%, 18%) 25%, hsl(272, 40%, 20%) 50%, hsl(282, 45%, 22%) 75%, hsl(263, 30%, 15%) 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Navigation Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-white hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">✨</span>
            </div>
            <span className="text-xl font-bold">24x7 Office Assistant</span>
            <span className="text-sm bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
              Debug
            </span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-6">RLS 调试工具</h1>

        {/* 用户信息 */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">用户状态</h2>
          {userInfo ? (
            <div>
              <p className="text-purple-200">
                登录状态: {userInfo.user ? '已登录' : '未登录'}
              </p>
              {userInfo.user && (
                <>
                  <p className="text-purple-200">用户ID: {userInfo.user.id}</p>
                  <p className="text-purple-200">邮箱: {userInfo.user.email}</p>
                  <p className="text-purple-200">
                    Token状态: {userInfo.hasToken ? '有效' : '无'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-purple-200">加载中...</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={runDebug}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-all"
            >
              运行诊断
            </button>

            <button
              onClick={checkRLSStatus}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-all"
            >
              检查RLS状态
            </button>

            <button
              onClick={fixRLS}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-all"
            >
              修复RLS策略
            </button>

            <button
              onClick={testAPI}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-all"
            >
              测试API
            </button>

            <button
              onClick={createTestPolicy}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-all"
            >
              创建测试策略
            </button>

            <button
              onClick={disableRLS}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-all"
            >
              禁用RLS (测试)
            </button>
          </div>
        </div>

        {/* RLS状态 */}
        {rlsStatus && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">RLS状态</h2>
            <pre className="text-sm text-green-300 bg-black/20 rounded p-3 overflow-auto">
              {JSON.stringify(rlsStatus, null, 2)}
            </pre>
          </div>
        )}

        {/* 调试信息 */}
        {debugInfo && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-3">调试信息</h2>
            <pre className="text-sm text-green-300 bg-black/20 rounded p-3 overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white">处理中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
