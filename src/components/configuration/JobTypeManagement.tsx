'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthenticatedApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertIcon,
} from '@/components/icons';

interface JobCategory {
  id: string;
  category_name: string;
  description?: string;
  display_order: number;
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
  price_currency: string;
  is_active: boolean;
  is_system_default: boolean;
  display_order: number;
  job_categories?: JobCategory;
}

interface JobTypeManagementProps {
  user: User;
  serviceTypeCode: string;
  onJobTypesUpdate?: (jobTypes: JobType[]) => void;
}

export function JobTypeManagement({
  user,
  serviceTypeCode,
  onJobTypesUpdate,
}: JobTypeManagementProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [formData, setFormData] = useState({
    job_name: '',
    job_description: '',
    category_id: '',
    default_duration_minutes: '30',
    default_price: '',
    price_currency: 'USD',
  });

  useEffect(() => {
    if (user && serviceTypeCode) {
      loadJobTypesAndCategories();
    }
  }, [user, serviceTypeCode]);

  const loadJobTypesAndCategories = async () => {
    setLoading(true);
    try {
      await Promise.all([loadJobTypes(), loadCategories()]);
    } catch (error) {
      console.error('Failed to load job types and categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobTypes = async () => {
    try {
      const response = await AuthenticatedApiClient.get(
        `/api/business/job-types?service_type_code=${serviceTypeCode}&user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        const allJobTypes = data.job_types || [];
        setJobTypes(allJobTypes);
        onJobTypesUpdate?.(allJobTypes);
      }
    } catch (error) {
      console.error('Failed to load job types:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await AuthenticatedApiClient.get(
        `/api/business/job-categories?service_type_code=${serviceTypeCode}`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleAddJobType = async () => {
    if (!formData.job_name.trim()) {
      toast.error('Job name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await AuthenticatedApiClient.post(
        '/api/business/job-types',
        {
          service_type_code: serviceTypeCode,
          category_id: formData.category_id || null,
          user_id: user.id,
          job_name: formData.job_name.trim(),
          job_description: formData.job_description.trim() || null,
          default_duration_minutes:
            parseInt(formData.default_duration_minutes) || 30,
          default_price: formData.default_price
            ? parseFloat(formData.default_price)
            : null,
          price_currency: formData.price_currency,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setJobTypes(prev => [...prev, data.job_type]);
        resetForm();
        setShowAddForm(false);
        onJobTypesUpdate?.(jobTypes);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add job type');
      }
    } catch (error) {
      console.error('Failed to add job type:', error);
      toast.error('Failed to add job type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateJobType = async () => {
    if (!editingJobType || !formData.job_name.trim()) {
      toast.error('Job name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await AuthenticatedApiClient.put(
        '/api/business/job-types',
        {
          id: editingJobType.id,
          job_name: formData.job_name.trim(),
          job_description: formData.job_description.trim() || null,
          default_duration_minutes:
            parseInt(formData.default_duration_minutes) || 30,
          default_price: formData.default_price
            ? parseFloat(formData.default_price)
            : null,
          price_currency: formData.price_currency,
          is_active: true,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setJobTypes(prev =>
          prev.map(jt => (jt.id === editingJobType.id ? data.job_type : jt))
        );
        resetForm();
        setEditingJobType(null);
        setShowAddForm(false);
        onJobTypesUpdate?.(jobTypes);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update job type');
      }
    } catch (error) {
      console.error('Failed to update job type:', error);
      toast.error('Failed to update job type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJobType = async (jobType: JobType) => {
    if (jobType.is_system_default) {
      toast.error('Cannot delete system default job types');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Job Type',
      description: `Are you sure you want to delete "${jobType.job_name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await AuthenticatedApiClient.delete(
        `/api/business/job-types?id=${jobType.id}`
      );

      if (response.ok) {
        setJobTypes(prev => prev.filter(jt => jt.id !== jobType.id));
        onJobTypesUpdate?.(jobTypes.filter(jt => jt.id !== jobType.id));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete job type');
      }
    } catch (error) {
      console.error('Failed to delete job type:', error);
      toast.error('Failed to delete job type. Please try again.');
    }
  };

  const startEdit = (jobType: JobType) => {
    setEditingJobType(jobType);
    setFormData({
      job_name: jobType.job_name,
      job_description: jobType.job_description || '',
      category_id: jobType.category_id || '',
      default_duration_minutes: jobType.default_duration_minutes.toString(),
      default_price: jobType.default_price?.toString() || '',
      price_currency: jobType.price_currency,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      job_name: '',
      job_description: '',
      category_id: '',
      default_duration_minutes: '30',
      default_price: '',
      price_currency: 'USD',
    });
    setEditingJobType(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job types...</p>
        </CardContent>
      </Card>
    );
  }

  const systemJobTypes = jobTypes.filter(jt => jt.is_system_default);
  const customJobTypes = jobTypes.filter(jt => !jt.is_system_default);

  return (
    <div className="space-y-6">
      {/* System Job Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Job Types</CardTitle>
          <CardDescription>
            Pre-configured job types for your business type. You can view
            durations and pricing but cannot delete these.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemJobTypes.length === 0 ? (
            <div className="text-center py-8">
              <AlertIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                No system job types available
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {systemJobTypes.map(jobType => (
                <div
                  key={jobType.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {jobType.job_name}
                        </h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          System Default
                        </span>
                        {jobType.job_categories && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {jobType.job_categories.category_name}
                          </span>
                        )}
                      </div>
                      {jobType.job_description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {jobType.job_description}
                        </p>
                      )}
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Duration: </span>
                          <span className="font-medium">
                            {jobType.default_duration_minutes} minutes
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price: </span>
                          <span className="font-medium">
                            {jobType.default_price
                              ? `$${jobType.default_price}`
                              : 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Currency: </span>
                          <span className="font-medium">
                            {jobType.price_currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Job Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Custom Job Types</CardTitle>
              <CardDescription>
                Create and manage your own custom job types specific to your
                business.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Custom Job Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customJobTypes.length === 0 ? (
            <div className="text-center py-8">
              <AlertIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                No custom job types created
              </p>
              <p className="text-xs text-gray-500">
                Create custom job types specific to your business needs
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customJobTypes.map(jobType => (
                <div key={jobType.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {jobType.job_name}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Custom
                        </span>
                        {jobType.job_categories && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {jobType.job_categories.category_name}
                          </span>
                        )}
                      </div>
                      {jobType.job_description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {jobType.job_description}
                        </p>
                      )}
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Duration: </span>
                          <span className="font-medium">
                            {jobType.default_duration_minutes} minutes
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price: </span>
                          <span className="font-medium">
                            {jobType.default_price
                              ? `$${jobType.default_price}`
                              : 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Currency: </span>
                          <span className="font-medium">
                            {jobType.price_currency}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(jobType)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteJobType(jobType)}
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

      {/* Add/Edit Job Type Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingJobType ? 'Edit Job Type' : 'Add Custom Job Type'}
            </CardTitle>
            <CardDescription>
              {editingJobType
                ? 'Update the job type information.'
                : 'Create a new custom job type for your business.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-name">Job Name *</Label>
                <Input
                  id="job-name"
                  value={formData.job_name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, job_name: e.target.value }))
                  }
                  placeholder="e.g., Custom Cleaning Service"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                placeholder="Describe what this job type includes..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="480"
                  value={formData.default_duration_minutes}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      default_duration_minutes: e.target.value,
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
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.price_currency}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, price_currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
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
                    {editingJobType ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingJobType ? 'Update Job Type' : 'Add Job Type'}
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

      <ConfirmDialog />
    </div>
  );
}
