'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
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
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  UserIcon,
} from '@/components/icons';

interface JobTitle {
  id: string;
  title_name: string;
  description?: string;
  required_qualifications: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface JobTitleManagementProps {
  user: User;
  onJobTitlesUpdate?: (jobTitles: JobTitle[]) => void;
}

export function JobTitleManagement({
  user,
  onJobTitlesUpdate,
}: JobTitleManagementProps) {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTitle, setEditingTitle] = useState<JobTitle | null>(null);
  const [formData, setFormData] = useState({
    title_name: '',
    description: '',
    required_qualifications: '',
  });

  useEffect(() => {
    if (user) {
      loadJobTitles();
    }
  }, [user]);

  const loadJobTitles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/job-titles?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setJobTitles(data.job_titles || []);
        onJobTitlesUpdate?.(data.job_titles || []);
      }
    } catch (error) {
      console.error('Failed to load job titles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJobTitle = async () => {
    if (!formData.title_name.trim()) {
      alert('Job title name is required');
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
          title_name: formData.title_name.trim(),
          description: formData.description.trim() || null,
          required_qualifications: formData.required_qualifications
            .split(',')
            .map(q => q.trim())
            .filter(q => q.length > 0),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTitles = [...jobTitles, data.job_title];
        setJobTitles(updatedTitles);
        onJobTitlesUpdate?.(updatedTitles);
        resetForm();
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create job title');
      }
    } catch (error) {
      console.error('Failed to create job title:', error);
      alert('Failed to create job title. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJobTitle = async () => {
    if (!editingTitle || !formData.title_name.trim()) {
      alert('Job title name is required');
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
          title_name: formData.title_name.trim(),
          description: formData.description.trim() || null,
          required_qualifications: formData.required_qualifications
            .split(',')
            .map(q => q.trim())
            .filter(q => q.length > 0),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTitles = jobTitles.map(title =>
          title.id === editingTitle.id ? data.job_title : title
        );
        setJobTitles(updatedTitles);
        onJobTitlesUpdate?.(updatedTitles);
        resetForm();
        setEditingTitle(null);
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update job title');
      }
    } catch (error) {
      console.error('Failed to update job title:', error);
      alert('Failed to update job title. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJobTitle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job title?')) {
      return;
    }

    try {
      const response = await fetch(`/api/job-titles?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedTitles = jobTitles.filter(title => title.id !== id);
        setJobTitles(updatedTitles);
        onJobTitlesUpdate?.(updatedTitles);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete job title');
      }
    } catch (error) {
      console.error('Failed to delete job title:', error);
      alert('Failed to delete job title. Please try again.');
    }
  };

  const startEdit = (title: JobTitle) => {
    setEditingTitle(title);
    setFormData({
      title_name: title.title_name,
      description: title.description || '',
      required_qualifications: title.required_qualifications.join(', '),
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title_name: '',
      description: '',
      required_qualifications: '',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job titles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Job Title Management
          </h3>
          <p className="text-sm text-gray-600">
            Configure job titles first. Staff members will be assigned to these
            titles, and each title can map to multiple job categories.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingTitle(null);
            setShowAddForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Job Title
        </Button>
      </div>

      {/* Job Titles List */}
      {jobTitles.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Job Titles Configured
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start by creating job titles for your business. These will be used
            when adding staff members and configuring job categories.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setEditingTitle(null);
              setShowAddForm(true);
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Job Title
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobTitles.map(title => (
            <div
              key={title.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {title.title_name}
                      </h4>
                      {title.description && (
                        <p className="text-sm text-gray-600">
                          {title.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {title.required_qualifications.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">
                        Required Qualifications
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {title.required_qualifications.map(
                          (qualification, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                            >
                              {qualification}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(title)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteJobTitle(title.id)}
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTitle ? 'Edit Job Title' : 'Add New Job Title'}
            </CardTitle>
            <CardDescription>
              {editingTitle
                ? 'Update the job title information and qualifications.'
                : 'Create a new job title for your staff members.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title-name">Job Title Name *</Label>
              <Input
                id="title-name"
                value={formData.title_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title_name: e.target.value }))
                }
                placeholder="e.g., Dental Hygienist, Receptionist, Assistant"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of this job title's responsibilities..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="qualifications">
                Required Qualifications (comma-separated)
              </Label>
              <Textarea
                id="qualifications"
                value={formData.required_qualifications}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    required_qualifications: e.target.value,
                  }))
                }
                placeholder="e.g., RDH License, CPR Certification, 2+ years experience"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingTitle ? handleUpdateJobTitle : handleAddJobTitle
                }
                disabled={saving || !formData.title_name.trim()}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingTitle ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingTitle ? 'Update Job Title' : 'Create Job Title'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTitle(null);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
