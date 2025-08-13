'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User as UserIcon, Mail, Calendar, Shield, Edit } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const { profile, isAdmin } = useUserProfile(user);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []); // 只在组件挂载时运行一次

  // 单独的 useEffect 来更新 fullName，当 profile 加载完成时
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]); // 只依赖 full_name 字段，而不是整个 profile 对象

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader
          user={user}
          userDisplayName={getUserDisplayName()}
          pageType="dashboard"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to view your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={getUserDisplayName()}
        pageType="dashboard"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <div className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src="" alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-orange-500 text-white text-2xl">
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getUserDisplayName()}
                  </h2>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user.email}
                  </p>

                  {isAdmin && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </span>
                    </div>
                  )}

                  <div className="mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Joined {formatDate(user.created_at)}</span>
                    </div>

                    <div className="flex items-center justify-center">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>Email verified</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Personal Information
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Update your personal details and information
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(!editing)}
                    className="text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {editing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName" className="text-xs">
                        Full Name
                      </Label>
                      {editing ? (
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="text-xs"
                        />
                      ) : (
                        <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-gray-900 dark:text-white">
                          {profile?.full_name || 'Not set'}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-xs">
                        Email Address
                      </Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-gray-900 dark:text-white">
                        {user.email}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Contact support to change your email address
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Account Type</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-gray-900 dark:text-white">
                        {isAdmin ? 'Administrator' : 'Standard User'}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Member Since</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-gray-900 dark:text-white">
                        {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>

                  {editing && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Account Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">0</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Total Calls
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">0</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Appointments
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">
                      {Math.floor(
                        (Date.now() - new Date(user.created_at).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Days Active
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
