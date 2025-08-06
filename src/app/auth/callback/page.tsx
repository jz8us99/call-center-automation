'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 处理OAuth回调
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth?error=auth_callback_failed');
          return;
        }

        if (data.session) {
          const user = data.session.user;

          // 检查用户角色
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }

            // 根据角色重定向
            if (profile?.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/dashboard');
            }
          } catch (profileErr) {
            console.error('Profile check error:', profileErr);
            // 默认重定向到dashboard
            router.push('/dashboard');
          }
        } else {
          // 没有session，返回登录页
          router.push('/auth');
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        router.push('/auth?error=callback_processing_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
