'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is a popup callback
        const urlParams = new URLSearchParams(window.location.search);
        const isPopup = urlParams.get('popup') === 'true';

        // 处理OAuth回调
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          if (isPopup) {
            // Notify parent window of error and close popup
            if (window.opener && window.opener.googleOAuthReject) {
              window.opener.googleOAuthReject(new Error('认证回调失败'));
              window.close();
              return;
            }
          }
          router.push('/auth?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          const user = data.session.user;

          // 检查用户角色
          try {
            // Small delay to allow database triggers to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use simple query without admin checks to avoid RLS recursion
            // eslint-disable-next-line prefer-const
            let { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, user_id, email, full_name, role, is_super_admin')
              .eq('user_id', user.id)
              .maybeSingle();

            // If profile doesn't exist, create one as fallback
            if (!profile && !profileError) {
              console.log('Profile not found, creating one...');
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  user_id: user.id,
                  email: user.email || '',
                  full_name: user.user_metadata?.full_name || null,
                  role: 'user',
                  is_super_admin: false,
                  pricing_tier: 'basic',
                  agent_types_allowed: ['inbound_call'],
                  is_active: true,
                })
                .select()
                .single();

              if (createError) {
                console.error('Error creating profile:', createError);
                // Continue with default redirect even if profile creation fails
                router.push('/dashboard');
                return;
              }

              profile = newProfile;
            }

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }

            // Handle popup vs normal callback
            if (isPopup) {
              console.log('Popup callback detected, notifying parent window');
              // For popup, notify parent window and close
              if (window.opener && window.opener.googleOAuthResolve) {
                console.log('Resolving popup auth with user:', user.id);
                window.opener.googleOAuthCompleted = true;
                // Reset loading state in parent window
                if (window.opener.setLoading) {
                  window.opener.setLoading(false);
                }
                window.opener.googleOAuthResolve({
                  success: true,
                  user: {
                    id: user.id,
                    email: user.email || '',
                  },
                  isAdmin: profile?.role === 'admin',
                });
                // Small delay before closing to ensure message is sent
                setTimeout(() => {
                  window.close();
                }, 100);
                return;
              } else {
                console.error('No parent window or resolve function found');
              }
            }

            // 根据角色重定向 (normal callback)
            if (profile?.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } catch (profileErr) {
            console.error('Profile check error:', profileErr);

            if (isPopup) {
              // For popup, notify parent window of error and close
              if (window.opener && window.opener.googleOAuthReject) {
                window.opener.googleOAuthReject(new Error('获取用户资料失败'));
                window.close();
                return;
              }
            }

            // 默认重定向到dashboard
            router.push('/dashboard');
          }
        } else {
          if (isPopup) {
            // For popup, notify parent window of error and close
            if (window.opener && window.opener.googleOAuthReject) {
              window.opener.googleOAuthReject(new Error('未找到登录会话'));
              window.close();
              return;
            }
          }

          // 没有session，返回登录页
          router.push('/auth');
        }
      } catch (err) {
        console.error('Callback processing error:', err);

        // Check if this is a popup callback
        const urlParams = new URLSearchParams(window.location.search);
        const isPopup = urlParams.get('popup') === 'true';

        if (isPopup) {
          // For popup, notify parent window of error and close
          if (window.opener && window.opener.googleOAuthReject) {
            window.opener.googleOAuthReject(new Error('回调处理失败'));
            window.close();
            return;
          }
        }

        router.push('/auth?error=callback_processing_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we redirect you.
        </p>
      </div>
    </div>
  );
}
