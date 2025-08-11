'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from '@supabase/supabase-js';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

// Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PlusIcon, UsersIcon, SettingsIcon } from '@/components/icons';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: 'user' | 'admin';
  pricing_tier: 'basic' | 'premium' | 'enterprise';
  agent_types_allowed: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  business_name?: string;
  business_type?: string;
}

export default function AdminUserManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Individual filter states
  const [fullNameFilter, setFullNameFilter] = useState('');
  const [businessNameFilter, setBusinessNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const router = useRouter();
  const { profile, loading: profileLoading, isAdmin } = useUserProfile(user);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    // Development mode bypass - remove this in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!loading && !profileLoading && !isDevelopment) {
      if (!user) {
        router.push('/auth');
      } else if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [loading, profileLoading, user, isAdmin, router]);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fall back to development mode with empty array or handle error
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        // Show empty state instead of mock data
        setUsers([]);
      }
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load users in development mode or when user is admin
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment || (user && isAdmin)) {
      loadUsers();
    }
  }, [user, isAdmin, loadUsers]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Reload users after successful deletion
      await loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleSaveUser = async (formData: FormData) => {
    try {
      setFormLoading(true);

      const userData = {
        full_name: formData.get('full_name') as string,
        email: formData.get('email') as string,
        phone_number: formData.get('phone_number') as string,
        business_name: formData.get('business_name') as string,
        business_type: formData.get('business_type') as string,
        role: formData.get('role') as string,
        pricing_tier: formData.get('pricing_tier') as string,
        agent_types_allowed: Array.from(
          formData.getAll('agent_types_allowed')
        ) as string[],
        is_active: formData.get('is_active') === 'on',
      };

      const isEditing = selectedUser !== null;
      const url = isEditing
        ? `/api/admin/users/${selectedUser.id}`
        : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${isEditing ? 'update' : 'create'} user`
        );
      }

      // Close form and reload users
      setShowUserForm(false);
      setSelectedUser(null);
      await loadUsers();
      alert(`User ${isEditing ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(
        `Failed to ${selectedUser ? 'update' : 'create'} user. Please try again.`
      );
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    return (
      (user.full_name || '')
        .toLowerCase()
        .includes(fullNameFilter.toLowerCase()) &&
      (user.business_name || '')
        .toLowerCase()
        .includes(businessNameFilter.toLowerCase()) &&
      (user.phone_number || '')
        .toLowerCase()
        .includes(phoneFilter.toLowerCase()) &&
      user.email.toLowerCase().includes(emailFilter.toLowerCase())
    );
  });

  const clearFilters = () => {
    setFullNameFilter('');
    setBusinessNameFilter('');
    setPhoneFilter('');
    setEmailFilter('');
  };

  // Development mode bypass - remove this in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  if ((loading || profileLoading) && !isDevelopment) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white">
            Loading user management...
          </p>
        </div>
      </div>
    );
  }

  if (!isDevelopment && (!user || !isAdmin)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-black dark:text-gray-300 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (showUserForm) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserForm(false)}
                  className="text-black dark:text-gray-300 hover:text-black dark:text-white"
                >
                  ← Back to Users
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-black dark:text-white">
                    {selectedUser ? 'Edit User' : 'Create New User'}
                  </h1>
                  <p className="text-sm text-black dark:text-gray-300">
                    Manage user information and permissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* User Form Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>
                  Configure user details, permissions, and pricing tier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form action={handleSaveUser} id="userForm">
                  {formLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
                        <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-black dark:text-white">
                          Saving user...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <Input
                        name="full_name"
                        defaultValue={selectedUser?.full_name || ''}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <Input
                        name="email"
                        type="email"
                        defaultValue={selectedUser?.email || ''}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <Input
                        name="phone_number"
                        type="tel"
                        defaultValue={selectedUser?.phone_number || ''}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Business Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                          Business Name
                        </label>
                        <Input
                          name="business_name"
                          defaultValue={selectedUser?.business_name || ''}
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                          Business Type
                        </label>
                        <select
                          name="business_type"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          defaultValue={selectedUser?.business_type || ''}
                        >
                          <option value="">Select business type</option>
                          <option value="Dental">Dental Practice</option>
                          <option value="Medical">Medical Practice</option>
                          <option value="Veterinary">Veterinary Clinic</option>
                          <option value="Legal">Legal Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Permissions & Pricing */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Permissions & Pricing
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                          Pricing Tier
                        </label>
                        <select
                          name="pricing_tier"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          defaultValue={selectedUser?.pricing_tier || 'basic'}
                        >
                          <option value="basic">Basic - $29/month</option>
                          <option value="premium">Premium - $79/month</option>
                          <option value="enterprise">
                            Enterprise - $199/month
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                          User Role
                        </label>
                        <select
                          name="role"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          defaultValue={selectedUser?.role || 'user'}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-black dark:text-gray-300 mb-3">
                        Allowed Agent Types
                      </label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {[
                          {
                            id: 'inbound_call',
                            name: 'Inbound Call Agent',
                            tier: 'basic',
                          },
                          {
                            id: 'outbound_appointment',
                            name: 'Outbound Appointment Agent',
                            tier: 'premium',
                          },
                          {
                            id: 'outbound_marketing',
                            name: 'Outbound Marketing Agent',
                            tier: 'enterprise',
                          },
                          {
                            id: 'customer_support',
                            name: 'Customer Support Agent',
                            tier: 'premium',
                          },
                        ].map(agentType => (
                          <label
                            key={agentType.id}
                            className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              name="agent_types_allowed"
                              value={agentType.id}
                              defaultChecked={selectedUser?.agent_types_allowed?.includes(
                                agentType.id
                              )}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-black dark:text-white">
                                {agentType.name}
                              </span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {agentType.tier}
                              </Badge>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                      Account Status
                    </h3>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={selectedUser?.is_active !== false}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-black dark:text-white">
                        Account Active
                      </span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUserForm(false)}
                    >
                      Cancel
                    </Button>
                    <div className="space-x-3">
                      <Button type="submit" disabled={formLoading}>
                        {formLoading
                          ? 'Saving...'
                          : selectedUser
                            ? 'Update User'
                            : 'Create User'}
                      </Button>
                      {selectedUser && (
                        <Button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/users/${selectedUser.id}/agent-config`
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Configure AI Agents
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DashboardHeader
        user={user}
        userDisplayName={
          profile?.full_name || user?.email?.split('@')[0] || 'Admin'
        }
        pageType="admin"
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                User Management
              </h1>
              <p className="text-black dark:text-gray-300">
                Manage user accounts and permissions
              </p>
            </div>
            <Button onClick={handleCreateUser}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    placeholder="Search by Full Name"
                    value={fullNameFilter}
                    onChange={e => setFullNameFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                    Business Name
                  </label>
                  <Input
                    placeholder="Search by Business Name"
                    value={businessNameFilter}
                    onChange={e => setBusinessNameFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    placeholder="Search by Phone Number"
                    value={phoneFilter}
                    onChange={e => setPhoneFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input
                    placeholder="Search by Email"
                    value={emailFilter}
                    onChange={e => setEmailFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-300 dark:border-gray-600 text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black dark:text-gray-300">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {users.length}
                    </p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black dark:text-gray-300">
                      Active Users
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {users.filter(u => u.is_active).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black dark:text-gray-300">
                      Premium Users
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {users.filter(u => u.pricing_tier === 'premium').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-xs font-bold">★</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black dark:text-gray-300">
                      Enterprise Users
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {
                        users.filter(u => u.pricing_tier === 'enterprise')
                          .length
                      }
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-xs font-bold">
                      ♦
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                All registered users and their account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                    No Users Found
                  </h3>
                  <p className="text-black dark:text-gray-300 mb-6">
                    {fullNameFilter ||
                    businessNameFilter ||
                    phoneFilter ||
                    emailFilter
                      ? 'No users match your search criteria.'
                      : 'Get started by adding your first user.'}
                  </p>
                  <Button onClick={handleCreateUser}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add First User
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                          Full Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                          Business Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                          Phone Number
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black dark:text-white">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-black dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(userProfile => {
                        return (
                          <tr
                            key={userProfile.id}
                            className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="font-medium text-black dark:text-white">
                                {userProfile.full_name || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-black dark:text-white">
                                {userProfile.business_name || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-black dark:text-gray-300">
                                {userProfile.phone_number || '-'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-black dark:text-gray-300">
                                {userProfile.email}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant={
                                  userProfile.role === 'admin'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className={
                                  userProfile.role === 'admin'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                }
                              >
                                {userProfile.role}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant={
                                  userProfile.is_active
                                    ? 'default'
                                    : 'secondary'
                                }
                                className={
                                  userProfile.is_active
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                }
                              >
                                {userProfile.is_active ? 'Active' : 'Suspended'}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  onClick={() =>
                                    router.push(
                                      `/admin/users/${userProfile.id}/agent-config`
                                    )
                                  }
                                  className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                                  size="sm"
                                >
                                  ⚙️ Configuration
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(userProfile)}
                                  className="text-black dark:text-gray-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 border-gray-300 dark:border-gray-600"
                                >
                                  🛡️ Edit Permissions
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
