'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: string | null;
  is_super_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          setError(error.message);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch {
        setError('An unexpected error occurred');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const isAdmin = profile?.role === 'admin';
  const isSuperAdmin = profile?.is_super_admin === true;

  return {
    profile,
    loading,
    error,
    isAdmin,
    isSuperAdmin,
  };
};
