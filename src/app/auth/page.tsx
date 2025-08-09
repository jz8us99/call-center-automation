'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { HelpButton } from '@/components/HelpDialog';
import { HomeIcon } from '@/components/icons';
import { SimpleThemeSwitch } from '@/components/SimpleThemeSwitch';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  // Use the new Google Auth hook
  const {
    signInWithGoogle,
    loading: googleLoading,
    isGoogleLoaded,
  } = useGoogleAuth();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
    };
    checkAuthStatus();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Get user profile to determine role-based redirect
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          router.push('/dashboard'); // Default fallback
        } else if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isGoogleLoaded) {
      setError('Google services are still loading. Please try again.');
      return;
    }

    setError('');

    try {
      const result = await signInWithGoogle();

      if (result && result.success) {
        // Handle successful sign-in with role-based redirect
        if (result.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to sign in with Google. Please try again.';

      // Provide user-friendly error messages
      if (errorMessage.includes('timed out')) {
        setError(
          'Google sign-in timed out. Please make sure you are logged into your Google account and try again.'
        );
      } else if (
        errorMessage.includes('not available') ||
        errorMessage.includes('not displayed')
      ) {
        setError(
          'Google sign-in is not available right now. Please use email and password to sign in.'
        );
      } else if (errorMessage.includes('Client ID not configured')) {
        setError(
          'Google sign-in is temporarily unavailable. Please use email and password to sign in.'
        );
      } else {
        setError(
          'Google sign-in failed. Please try again or use email and password to sign in.'
        );
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert(
          'Password reset email sent! Please check your email for instructions.'
        );
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Main Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Brand Logo - Above Sign in */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">R</span>
                </div>
                <span className="text-xl font-bold text-black dark:text-white">
                  JSX-ReceptionAI
                </span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-black dark:text-gray-300 hover:text-black dark:text-white transition-colors text-sm"
              >
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-black dark:text-white mb-2 text-left">
                Sign in
              </h1>
              <SimpleThemeSwitch />
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading || !isGoogleLoaded}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {googleLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-black dark:text-gray-300 font-medium">
                    Signing in...
                  </span>
                </>
              ) : !isGoogleLoaded ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                  <span className="text-black dark:text-gray-300 font-medium">
                    Loading Google...
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-black dark:text-gray-300 font-medium">
                    Sign in with Google
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                or with your email below
              </span>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-black dark:text-white"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-black dark:text-white"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black dark:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
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
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <span className="text-black dark:text-gray-300 text-sm">
              Need an account?{' '}
            </span>
            <Link
              href="/signup"
              className="text-orange-500 hover:text-orange-600 font-medium transition-colors duration-200"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-6">
          <a
            href="#"
            className="text-gray-500 hover:text-black dark:text-gray-300 text-sm transition-colors duration-200"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-gray-500 hover:text-black dark:text-gray-300 text-sm transition-colors duration-200"
          >
            Privacy Policy
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">
              Reset Password
            </h3>
            <p className="text-black dark:text-gray-300 text-sm mb-4">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="resetEmail"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Email
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-black dark:text-gray-300 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Button */}
      <HelpButton currentPage="auth" />
    </div>
  );
}
