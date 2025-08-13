'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { RBACManager } from '@/lib/rbac';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
  UsersIcon,
  SettingsIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

interface JobTitle {
  id: string;
  user_id: string;
  title_name: string;
  description?: string;
  required_qualifications: string[];
  display_order: number;
  is_active: boolean;
}

interface JobCategory {
  id: string;
  job_title_id: string;
  category_name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

interface JobType {
  id: string;
  job_category_id: string;
  user_id: string;
  job_name: string;
  job_description?: string;
  default_duration_minutes: number;
  default_price?: number;
  price_currency: string;
  required_staff_roles: string[];
  equipment_needed: string[];
  preparation_notes?: string;
  is_active: boolean;
  display_order: number;
}

interface JobHierarchyManagementProps {
  user: User;
  rbac: RBACManager;
  onClose: () => void;
}

export function JobHierarchyManagement({
  user,
  rbac,
  onClose,
}: JobHierarchyManagementProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'titles' | 'categories' | 'types'>(
    'titles'
  );

  // Form states
  const [showAddTitleForm, setShowAddTitleForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState<JobTitle | null>(null);
  const [titleFormData, setTitleFormData] = useState({
    title_name: '',
    description: '',
    required_qualifications: '',
  });

  useEffect(() => {
    if (user) {
      loadJobHierarchy();
    }
  }, [user]);

  const loadJobHierarchy = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJobTitles(),
        // loadJobCategories(),
        // loadJobTypes(),
      ]);
    } catch (error) {
      console.error('Failed to load job hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobTitles = async () => {
    try {
      const response = await fetch(`/api/job-titles?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setJobTitles(data.job_titles || []);
      }
    } catch (error) {
      console.error('Failed to load job titles:', error);
    }
  };

  const handleAddJobTitle = async () => {
    if (!titleFormData.title_name.trim()) {
      toast.error('Job title name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/job-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          title_name: titleFormData.title_name.trim(),
          description: titleFormData.description.trim() || null,
          required_qualifications: titleFormData.required_qualifications
            ? titleFormData.required_qualifications
                .split(',')
                .map(q => q.trim())
                .filter(q => q)
            : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobTitles(prev => [...prev, data.job_title]);
        resetTitleForm();
        setShowAddTitleForm(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add job title');
      }
    } catch (error) {
      console.error('Failed to add job title:', error);
      toast.error('Failed to add job title. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJobTitle = async () => {
    if (!editingTitle || !titleFormData.title_name.trim()) {
      toast.error('Job title name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/job-titles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTitle.id,
          title_name: titleFormData.title_name.trim(),
          description: titleFormData.description.trim() || null,
          required_qualifications: titleFormData.required_qualifications
            ? titleFormData.required_qualifications
                .split(',')
                .map(q => q.trim())
                .filter(q => q)
            : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobTitles(prev =>
          prev.map(jt => (jt.id === editingTitle.id ? data.job_title : jt))
        );
        resetTitleForm();
        setEditingTitle(null);
        setShowAddTitleForm(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update job title');
      }
    } catch (error) {
      console.error('Failed to update job title:', error);
      toast.error('Failed to update job title. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJobTitle = async (jobTitle: JobTitle) => {
    const confirmed = await confirm({
      title: 'Delete Job Title',
      description: `Are you sure you want to delete "${jobTitle.title_name}"? This will also affect related categories and job types.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/job-titles?id=${jobTitle.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobTitles(prev => prev.filter(jt => jt.id !== jobTitle.id));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete job title');
      }
    } catch (error) {
      console.error('Failed to delete job title:', error);
      toast.error('Failed to delete job title. Please try again.');
    }
  };

  const startEditTitle = (jobTitle: JobTitle) => {
    setEditingTitle(jobTitle);
    setTitleFormData({
      title_name: jobTitle.title_name,
      description: jobTitle.description || '',
      required_qualifications:
        jobTitle.required_qualifications?.join(', ') || '',
    });
    setShowAddTitleForm(true);
  };

  const resetTitleForm = () => {
    setTitleFormData({
      title_name: '',
      description: '',
      required_qualifications: '',
    });
    setEditingTitle(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job hierarchy...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Job Configuration
              </CardTitle>
              <CardDescription>
                Set up your job hierarchy: Titles → Categories → Types
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              <XIcon className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('titles')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'titles'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              Job Titles ({jobTitles.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Categories ({jobCategories.length})
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'types'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Job Types ({jobTypes.length})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Job Titles Tab */}
      {activeTab === 'titles' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Job Titles</CardTitle>
                <CardDescription>
                  Define the main professional roles in your dental office
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  resetTitleForm();
                  setShowAddTitleForm(true);
                }}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add Job Title
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobTitles.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Job Titles Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by adding professional roles like Hygienist, Assistant,
                  or Dentist
                </p>
                <Button
                  onClick={() => setShowAddTitleForm(true)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add First Job Title
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobTitles.map(jobTitle => (
                  <div key={jobTitle.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {jobTitle.title_name}
                        </h4>
                        {jobTitle.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {jobTitle.description}
                          </p>
                        )}
                        {jobTitle.required_qualifications &&
                          jobTitle.required_qualifications.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {jobTitle.required_qualifications.map(
                                (qual, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {qual}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditTitle(jobTitle)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJobTitle(jobTitle)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Job Title Form */}
      {showAddTitleForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTitle ? 'Edit Job Title' : 'Add New Job Title'}
            </CardTitle>
            <CardDescription>
              {editingTitle
                ? 'Update the job title information'
                : 'Create a new professional role for your dental office'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title-name">Job Title Name *</Label>
              <Input
                id="title-name"
                value={titleFormData.title_name}
                onChange={e =>
                  setTitleFormData(prev => ({
                    ...prev,
                    title_name: e.target.value,
                  }))
                }
                placeholder="e.g., Dental Hygienist, Dental Assistant, Dentist"
                required
              />
            </div>

            <div>
              <Label htmlFor="title-description">Description</Label>
              <Textarea
                id="title-description"
                value={titleFormData.description}
                onChange={e =>
                  setTitleFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the role and responsibilities..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="qualifications">
                Required Qualifications (comma-separated)
              </Label>
              <Input
                id="qualifications"
                value={titleFormData.required_qualifications}
                onChange={e =>
                  setTitleFormData(prev => ({
                    ...prev,
                    required_qualifications: e.target.value,
                  }))
                }
                placeholder="e.g., Licensed RDH, CPR Certified, 2+ years experience"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingTitle ? handleUpdateJobTitle : handleAddJobTitle
                }
                disabled={saving || !titleFormData.title_name.trim()}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingTitle ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingTitle ? 'Update Job Title' : 'Add Job Title'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddTitleForm(false);
                  setEditingTitle(null);
                  resetTitleForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories and Types tabs - placeholder for now */}
      {activeTab === 'categories' && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Job Categories</h3>
            <p className="text-gray-600">
              Coming soon - Create categories under each job title
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'types' && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Job Types</h3>
            <p className="text-gray-600">
              Coming soon - Define specific services and procedures
            </p>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog />
    </div>
  );
}
