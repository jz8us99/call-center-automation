'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export default function GetTokenPage() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
        return;
      }

      if (session) {
        setUser(session.user);
        setToken(session.access_token);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        setToken(data.session.access_token);
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>检查登录状态...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">未登录</h1>
          <p className="text-purple-200 mb-6">请先登录以获取JWT Token</p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background:
          'linear-gradient(135deg, hsl(263, 30%, 15%) 0%, hsl(263, 35%, 18%) 25%, hsl(272, 40%, 20%) 50%, hsl(282, 45%, 22%) 75%, hsl(263, 30%, 15%) 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto">
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
            <span className="text-sm bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
              Tokens
            </span>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">JWT Token 获取</h1>

          {/* 用户信息 */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">用户信息</h2>
            <div className="space-y-2">
              <p className="text-purple-200">
                <strong>用户ID:</strong> {user.id}
              </p>
              <p className="text-purple-200">
                <strong>邮箱:</strong> {user.email}
              </p>
              <p className="text-purple-200">
                <strong>创建时间:</strong>{' '}
                {new Date(user.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* JWT Token */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">JWT Token</h2>
            <div className="bg-black/20 rounded p-3 mb-3">
              <code className="text-green-300 text-sm break-all">{token}</code>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToken}
                className={`px-4 py-2 rounded-lg transition-all ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? '已复制!' : '复制Token'}
              </button>

              <button
                onClick={refreshToken}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all"
              >
                刷新Token
              </button>
            </div>
          </div>

          {/* API测试示例 */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-3">
              API测试示例
            </h2>

            <h3 className="text-lg font-medium text-white mb-2">cURL命令：</h3>
            <div className="bg-black/20 rounded p-3 mb-3">
              <code className="text-green-300 text-sm">
                {`curl -X GET "http://localhost:3000/api/customer-call-logs-rls" \\
  -H "Authorization: Bearer ${token.substring(0, 50)}..."`}
              </code>
            </div>

            <h3 className="text-lg font-medium text-white mb-2">
              JavaScript Fetch：
            </h3>
            <div className="bg-black/20 rounded p-3">
              <code className="text-green-300 text-sm">
                {`fetch('/api/customer-call-logs-rls', {
  headers: {
    'Authorization': 'Bearer ${token.substring(0, 30)}...'
  }
})`}
              </code>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-all"
            >
              返回首页
            </button>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
