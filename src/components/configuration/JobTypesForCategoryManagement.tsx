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
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  ArrowLeftIcon,
  SettingsIcon,
} from '@/components/icons';

interface JobCategory {
  id: string;
  category_name: string;
  description?: string;
}

interface JobType {
  id: string;
  service_type_code: string;
  category_id?: string;
  user_id?: string;
  job_name: string;
  job_description?: string;
  default_duration_minutes: number;
  default_price?: number;
  price_currency?: string;
  is_active: boolean;
  is_system_default: boolean;
  display_order: number;
  job_categories?: JobCategory;
}

interface JobTypesForCategoryManagementProps {
  user: User;
  serviceTypeCode: string;
  category: JobCategory;
  onBack: () => void;
  onJobTypesUpdate?: (jobTypes: JobType[]) => void;
}

export function JobTypesForCategoryManagement({
  user,
  serviceTypeCode,
  category,
  onBack,
  onJobTypesUpdate,
}: JobTypesForCategoryManagementProps) {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [formData, setFormData] = useState({
    job_name: '',
    job_description: '',
    default_duration_minutes: 30,
    default_price: '',
    price_currency: 'USD',
    display_order: 0,
  });

  useEffect(() => {
    if (user && serviceTypeCode && category) {
      loadJobTypes();
    }
  }, [user, serviceTypeCode, category]);

  const loadJobTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/business/job-types?service_type_code=${serviceTypeCode}&category_id=${category.id}&user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setJobTypes(data.job_types || []);
        onJobTypesUpdate?.(data.job_types || []);
      }
    } catch (error) {
      console.error('Failed to load job types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJobType = async () => {
    if (!formData.job_name.trim()) {
      alert('Job type name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business/job-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type_code: serviceTypeCode,
          category_id: category.id,
          user_id: user.id,
          job_name: formData.job_name.trim(),
          job_description: formData.job_description.trim() || null,
          default_duration_minutes: formData.default_duration_minutes,
          default_price: formData.default_price
            ? parseFloat(formData.default_price)
            : null,
          price_currency: formData.price_currency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedJobTypes = [...jobTypes, data.job_type];
        setJobTypes(updatedJobTypes);
        onJobTypesUpdate?.(updatedJobTypes);
        resetForm();
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create job type');
      }
    } catch (error) {
      console.error('Failed to create job type:', error);
      alert('Failed to create job type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJobType = async () => {
    if (!editingJobType || !formData.job_name.trim()) {
      alert('Job type name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business/job-types', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingJobType.id,
          job_name: formData.job_name.trim(),
          job_description: formData.job_description.trim() || null,
          default_duration_minutes: formData.default_duration_minutes,
          default_price: formData.default_price
            ? parseFloat(formData.default_price)
            : null,
          price_currency: formData.price_currency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedJobTypes = jobTypes.map(jt =>
          jt.id === editingJobType.id ? data.job_type : jt
        );
        setJobTypes(updatedJobTypes);
        onJobTypesUpdate?.(updatedJobTypes);
        resetForm();
        setEditingJobType(null);
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update job type');
      }
    } catch (error) {
      console.error('Failed to update job type:', error);
      alert('Failed to update job type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJobType = async (id: string, isSystemDefault: boolean) => {
    if (isSystemDefault) {
      alert('Cannot delete system default job types');
      return;
    }

    if (!confirm('Are you sure you want to delete this job type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/business/job-types?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedJobTypes = jobTypes.filter(jt => jt.id !== id);
        setJobTypes(updatedJobTypes);
        onJobTypesUpdate?.(updatedJobTypes);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete job type');
      }
    } catch (error) {
      console.error('Failed to delete job type:', error);
      alert('Failed to delete job type. Please try again.');
    }
  };

  const startEdit = (jobType: JobType) => {
    if (jobType.is_system_default) {
      alert('Cannot edit system default job types');
      return;
    }

    setEditingJobType(jobType);
    setFormData({
      job_name: jobType.job_name,
      job_description: jobType.job_description || '',
      default_duration_minutes: jobType.default_duration_minutes,
      default_price: jobType.default_price?.toString() || '',
      price_currency: jobType.price_currency || 'USD',
      display_order: jobType.display_order,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      job_name: '',
      job_description: '',
      default_duration_minutes: 30,
      default_price: '',
      price_currency: 'USD',
      display_order: jobTypes.length,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Categories
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Job Types - {category.category_name}
            </h3>
            <p className="text-sm text-gray-600">
              {category.description || 'Manage job types for this category'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingJobType(null);
            setShowAddForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Job Type
        </Button>
      </div>

      {/* Job Types List */}
      {jobTypes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Job Types in this Category
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add job types to the "{category.category_name}" category. These will
            be available for staff assignments.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setEditingJobType(null);
              setShowAddForm(true);
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Job Type
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobTypes.map(jobType => (
            <div
              key={jobType.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <SettingsIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {jobType.job_name}
                        </h4>
                        <Badge
                          variant={
                            jobType.is_system_default ? 'default' : 'secondary'
                          }
                        >
                          {jobType.is_system_default ? 'System' : 'Custom'}
                        </Badge>
                      </div>
                      {jobType.job_description && (
                        <p className="text-sm text-gray-600">
                          {jobType.job_description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <div className="font-medium">
                        {jobType.default_duration_minutes} min
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <div className="font-medium">
                        {jobType.default_price
                          ? `${jobType.price_currency} ${jobType.default_price}`
                          : 'Not set'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div
                        className={`font-medium ${jobType.is_active ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {jobType.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!jobType.is_system_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(jobType)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {!jobType.is_system_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDeleteJobType(
                          jobType.id,
                          jobType.is_system_default
                        )
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
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
              {editingJobType ? 'Edit Job Type' : 'Add New Job Type'}
            </CardTitle>
            <CardDescription>
              {editingJobType
                ? 'Update the job type information.'
                : 'Create a new job type for this category.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="job-name">Job Type Name *</Label>
              <Input
                id="job-name"
                value={formData.job_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, job_name: e.target.value }))
                }
                placeholder="e.g., Teeth Cleaning, Root Canal, Consultation"
                required
              />
            </div>

            <div>
              <Label htmlFor="job-description">Description</Label>
              <Textarea
                id="job-description"
                value={formData.job_description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    job_description: e.target.value,
                  }))
                }
                placeholder="Brief description of this job type..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Default Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.default_duration_minutes}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      default_duration_minutes: parseInt(e.target.value) || 30,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Default Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.default_price}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      default_price: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingJobType ? handleUpdateJobType : handleAddJobType
                }
                disabled={saving || !formData.job_name.trim()}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingJobType ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingJobType ? 'Update Job Type' : 'Create Job Type'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingJobType(null);
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
