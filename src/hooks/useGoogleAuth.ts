import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface GoogleCredentialResponse {
  credential: string; // JWT ID token
  select_by: string;
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
}

interface GoogleSignInResult {
  success: boolean;
  user: {
    id: string;
    email?: string;
  };
  isAdmin: boolean;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select: boolean;
            cancel_on_tap_outside: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (
            callback?: (notification: GooglePromptNotification) => void
          ) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              click_listener?: () => void;
            }
          ) => void;
        };
      };
    };
    googleSignInResolve?: (value: GoogleSignInResult) => void;
    googleSignInReject?: (reason: Error) => void;
  }
}

export function useGoogleAuth() {
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fallback to Supabase OAuth when Identity Services fails
  const fallbackToSupabaseOAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase OAuth fallback failed:', error);
      throw new Error(
        'Google sign-in failed. Please try again or use email/password.'
      );
    }
  };

  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      setLoading(true);
      try {
        // Use Supabase signInWithIdToken
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Supabase sign in error:', error);
          throw error;
        }

        console.log('Google sign in successful:', data);

        // Determine redirect based on user role
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', data.user.id)
            .maybeSingle();

          // Return success with role info for caller to handle redirect
          return {
            success: true,
            user: data.user,
            isAdmin: profile?.role === 'admin',
          };
        }

        // If no user data, throw an error
        throw new Error('No user data received from Google sign-in');
      } catch (error) {
        console.error('Google sign in failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const initializeGoogleSignIn = useCallback(() => {
    if (!window.google || !window.google.accounts) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      console.error(
        'Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.'
      );
      return;
    }

    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // Disable FedCM to avoid compatibility issues
      });
    } catch (error) {
      console.error('Failed to initialize Google Identity Services:', error);
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    // Check if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        setIsGoogleLoaded(true);
        initializeGoogleSignIn();
      } else {
        // Wait a bit and try again
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, [initializeGoogleSignIn]);

  const signInWithGoogle = (): Promise<GoogleSignInResult> => {
    if (!isGoogleLoaded || !window.google || !window.google.accounts) {
      console.error('Google Identity Services not loaded');
      return Promise.reject(new Error('Google Services not available'));
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      console.error('Google Client ID not configured');
      return Promise.reject(
        new Error('Google Client ID not configured. Please contact support.')
      );
    }

    setLoading(true);

    return new Promise((resolve, reject) => {
      // Store the resolve/reject functions so the callback can use them
      window.googleSignInResolve = resolve;
      window.googleSignInReject = reject;

      // Override the callback to use our promise
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: GoogleCredentialResponse) => {
            try {
              const result = await handleCredentialResponse(response);
              window.googleSignInResolve?.(result);
            } catch (error) {
              window.googleSignInReject?.(
                error instanceof Error
                  ? error
                  : new Error('Google sign-in failed')
              );
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disable FedCM to avoid compatibility issues
        });
      } catch (initError) {
        console.error('Google initialization error:', initError);
        setLoading(false);
        reject(new Error('Failed to initialize Google sign-in'));
        return;
      }

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Google sign-in timed out, falling back to Supabase OAuth');
        // Fallback to Supabase OAuth on timeout
        fallbackToSupabaseOAuth()
          .then(() => {
            console.log('Redirecting to Google OAuth after timeout...');
          })
          .catch(error => {
            setLoading(false);
            reject(error);
          });
      }, 10000); // 10 second timeout

      // Try to prompt for sign-in with error handling
      try {
        window.google.accounts.id.prompt(
          (notification: GooglePromptNotification) => {
            clearTimeout(timeoutId);

            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment()
            ) {
              console.log(
                'Google prompt not displayed or skipped, falling back to Supabase OAuth'
              );
              // Fallback to Supabase OAuth (redirect method)
              fallbackToSupabaseOAuth()
                .then(() => {
                  // This will redirect the user, so we don't need to resolve here
                  console.log('Redirecting to Google OAuth...');
                })
                .catch(error => {
                  setLoading(false);
                  reject(error);
                });
            }
          }
        );
      } catch (promptError) {
        clearTimeout(timeoutId);
        console.error('Prompt failed:', promptError);
        console.log('Google prompt failed, falling back to Supabase OAuth');
        // Fallback to Supabase OAuth when prompt fails
        fallbackToSupabaseOAuth()
          .then(() => {
            console.log('Redirecting to Google OAuth after prompt failure...');
          })
          .catch(error => {
            setLoading(false);
            reject(error);
          });
      }
    });
  };

  const signInWithGoogleOneTap = () => {
    if (!isGoogleLoaded || !window.google || !window.google.accounts) {
      return;
    }

    // Show the One Tap prompt
    window.google.accounts.id.prompt();
  };

  return {
    signInWithGoogle,
    signInWithGoogleOneTap,
    isGoogleLoaded,
    loading,
  };
}
