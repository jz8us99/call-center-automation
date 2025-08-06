'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { RBACManager, createRBACManager, StaffMember } from '@/lib/rbac';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HomeIcon,
  SettingsIcon,
  PlusIcon,
  BuildingIcon,
} from '@/components/icons';
import { JobHierarchyManagement } from '@/components/jobs/JobHierarchyManagement';

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const [rbac, setRbac] = useState<RBACManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showJobConfig, setShowJobConfig] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadCurrentStaff(user.id);
      }

      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  const loadCurrentStaff = async (userId: string) => {
    try {
      // In a real implementation, you'd fetch the current staff member's record
      // For now, we'll simulate an owner role
      const mockStaff: StaffMember = {
        id: 'current-user-id',
        user_id: userId,
        role_code: 'owner', // This should come from the database
        first_name: 'Business',
        last_name: 'Owner',
        email: user?.email,
        employment_status: 'active',
        is_active: true,
      };

      setCurrentStaff(mockStaff);
      setRbac(createRBACManager(mockStaff));
    } catch (error) {
      console.error('Failed to load current staff:', error);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">
            Loading job management...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !rbac) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-black dark:text-gray-300 hover:text-black dark:text-white"
              >
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black dark:text-white">
                  Job Management
                </h1>
                <p className="text-sm text-black dark:text-gray-300">
                  Manage job titles, categories, and types for your dental
                  office
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Role:{' '}
                <span className="font-medium text-orange-600">
                  {rbac.getRoleDisplayName()}
                </span>
              </div>
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-black dark:text-gray-300 hover:text-black dark:text-white"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Introduction Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5 text-orange-600" />
                  Dental Office Job Structure
                </CardTitle>
                <CardDescription>
                  Organize your staff responsibilities using a hierarchical
                  structure:
                  <strong> Job Title</strong> → <strong>Category</strong> →{' '}
                  <strong>Job Type</strong>
                </CardDescription>
              </div>
              {rbac.canConfigureJobs() && (
                <Button
                  onClick={() => setShowJobConfig(!showJobConfig)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <SettingsIcon className="h-4 w-4" />
                  {showJobConfig ? 'Hide' : 'Configure'} Job Information
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    1
                  </span>
                </div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Job Title
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Professional roles like Hygienist, Assistant, Dentist,
                  Receptionist
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    2
                  </span>
                </div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Category
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Service areas like Cleaning, Exams, Treatment, Administrative
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    3
                  </span>
                </div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Job Type
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Specific services like Regular Cleaning, Root Canal, X-Ray
                  Setup
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control Notice */}
        {!rbac.canConfigureJobs() && (
          <Card className="mb-8 bg-amber-50 border-amber-200 dark:bg-amber-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 dark:text-amber-400 text-sm">
                    !
                  </span>
                </div>
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Limited Access
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You can view job information but cannot make changes.
                    Contact your business owner or admin to configure job types.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Configuration Section */}
        {showJobConfig && rbac.canConfigureJobs() && user && (
          <JobHierarchyManagement
            user={user}
            rbac={rbac}
            onClose={() => setShowJobConfig(false)}
          />
        )}

        {/* Job Overview (Always visible) */}
        {!showJobConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Current Job Structure Overview</CardTitle>
              <CardDescription>
                View your current job hierarchy and assigned responsibilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BuildingIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Job Structure Overview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {rbac.canConfigureJobs()
                    ? 'Click "Configure Job Information" to set up your job hierarchy'
                    : 'Your job structure will be displayed here once configured by an admin'}
                </p>
                {rbac.canConfigureJobs() && (
                  <Button
                    onClick={() => setShowJobConfig(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Get Started
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
