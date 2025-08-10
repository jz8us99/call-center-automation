'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        if (
          error.message.includes('already been registered') ||
          error.message.includes('already registered')
        ) {
          setError('This user already exists');
        } else {
          setError(error.message);
        }
      } else {
        setError('');
        setSuccess(
          'Registration successful! Please check your email and click the verification link to complete your account setup.'
        );
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        setError(`Google sign up failed: ${error.message}`);
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error('Google sign up error:', err);
      setError('Failed to initialize Google sign up. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 text-center border-b border-gray-200 dark:border-gray-600">
            <Link
              href="/"
              className="inline-flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg mb-4">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
                ReceptionPro
              </h1>
            </Link>
            <p className="text-black dark:text-gray-300 text-sm">
              Create your account to get started
            </p>
          </div>

          <div className="p-8">
            {/* Google Sign Up Button */}
            <div className="mb-6">
              <button
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {googleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-black dark:text-gray-300 font-medium">
                      Connecting...
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
                      Sign up with Google
                    </span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                安全提示：点击后将跳转到Google官方认证页面进行安全注册
              </p>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                  or with your email below
                </span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Full Name
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Email
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-black dark:text-white"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth"
                className="text-orange-500 hover:text-orange-600 text-sm transition-colors duration-200 font-medium"
              >
                Already have an account? Sign in
              </Link>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-gray-500 hover:text-black dark:text-gray-300 text-sm transition-colors duration-200 inline-flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
