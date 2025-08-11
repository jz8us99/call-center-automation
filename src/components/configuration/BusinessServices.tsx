'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  SettingsIcon,
  DollarSignIcon,
  ClockIcon,
} from '@/components/icons';

interface BusinessProfile {
  business_type?: string;
  business_name?: string;
  [key: string]: any;
}

interface JobCategory {
  id: string;
  service_type_code: string;
  category_name: string;
  description?: string;
  is_active: boolean;
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
  job_categories?: JobCategory;
}

interface BusinessServicesProps {
  user: User;
  onServicesUpdate: (hasServices: boolean) => void;
}

export function BusinessServices({
  user,
  onServicesUpdate,
}: BusinessServicesProps) {
  const t = useTranslations('businessServices');
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(
    null
  );
  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    description: '',
  });

  // Job type form state
  const [showJobTypeForm, setShowJobTypeForm] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [jobTypeForm, setJobTypeForm] = useState({
    category_id: '',
    job_name: '',
    job_description: '',
    default_duration_minutes: 30,
    default_price: '',
    price_currency: 'USD',
  });

  // Inline editing state
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState({
    job_name: '',
    job_description: '',
    default_duration_minutes: 30,
    default_price: '',
  });
  const [inlineSaving, setInlineSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadBusinessProfileAndData();
    }
  }, [user]);

  useEffect(() => {
    const hasData = jobCategories.length > 0 && jobTypes.length > 0;
    onServicesUpdate(hasData);
  }, [jobCategories.length, jobTypes.length, onServicesUpdate]);

  const loadBusinessProfileAndData = async () => {
    setLoading(true);
    try {
      // First load business profile to get business type
      const profileResponse = await fetch(
        `/api/business/profile?user_id=${user.id}`
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setBusinessProfile(profileData.profile);

        // If we have a business type, load job categories and types
        if (profileData.profile?.business_type) {
          await Promise.all([
            loadJobCategories(profileData.profile.business_type),
            loadJobTypes(profileData.profile.business_type),
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobCategories = async (serviceTypeCode: string) => {
    try {
      const response = await fetch(
        `/api/business/job-categories?service_type_code=${serviceTypeCode}`
      );
      if (response.ok) {
        const data = await response.json();
        setJobCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load job categories:', error);
    }
  };

  const loadJobTypes = async (serviceTypeCode: string) => {
    try {
      const response = await fetch(
        `/api/business/job-types?service_type_code=${serviceTypeCode}&user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setJobTypes(data.job_types || []);
      }
    } catch (error) {
      console.error('Failed to load job types:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.category_name || !businessProfile?.business_type) {
      alert('Category name is required and business type must be configured');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business/job-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type_code: businessProfile.business_type,
          category_name: categoryForm.category_name,
          description: categoryForm.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobCategories(prev => [...prev, data.category]);
        resetCategoryForm();
        setShowCategoryForm(false);
        setHasUnsavedChanges(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('Failed to add category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.category_name) {
      alert('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business/job-categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCategory.id,
          category_name: categoryForm.category_name,
          description: categoryForm.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobCategories(prev =>
          prev.map(c => (c.id === editingCategory.id ? data.category : c))
        );
        resetCategoryForm();
        setEditingCategory(null);
        setShowCategoryForm(false);
        setHasUnsavedChanges(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? This will also affect any associated services.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/business/job-categories?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobCategories(prev => prev.filter(c => c.id !== id));
        // Reload job types as they might be affected
        if (businessProfile?.business_type) {
          await loadJobTypes(businessProfile.business_type);
        }
        setHasUnsavedChanges(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const startEditCategory = (category: JobCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description || '',
    });
    setShowCategoryForm(true);
  };

  const handleSaveChanges = async () => {
    setSaveStatus('saving');

    try {
      // Since individual updates already saved to the database,
      // we just need to update the UI status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for UX

      setSaveStatus('success');
      setHasUnsavedChanges(false);

      // Clear success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');

      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const handleAddJobType = async () => {
    if (!jobTypeForm.job_name || !businessProfile?.business_type) {
      alert('Service name is required and business type must be configured');
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
          service_type_code: businessProfile.business_type,
          category_id:
            jobTypeForm.category_id && jobTypeForm.category_id !== 'none'
              ? jobTypeForm.category_id
              : null,
          user_id: user.id,
          job_name: jobTypeForm.job_name,
          job_description: jobTypeForm.job_description,
          default_duration_minutes: jobTypeForm.default_duration_minutes,
          default_price: jobTypeForm.default_price
            ? parseFloat(jobTypeForm.default_price)
            : null,
          price_currency: jobTypeForm.price_currency,
          is_system_default: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobTypes(prev => [...prev, data.job_type]);
        resetJobTypeForm();
        setShowJobTypeForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add service');
      }
    } catch (error) {
      console.error('Failed to add service:', error);
      alert('Failed to add service. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_name: '',
      description: '',
    });
  };

  const resetJobTypeForm = () => {
    setJobTypeForm({
      category_id: 'none',
      job_name: '',
      job_description: '',
      default_duration_minutes: 30,
      default_price: '',
      price_currency: 'USD',
    });
  };

  const startEditJobType = (jobType: JobType) => {
    setEditingJobType(jobType);
    setJobTypeForm({
      category_id: jobType.category_id || 'none',
      job_name: jobType.job_name,
      job_description: jobType.job_description || '',
      default_duration_minutes: jobType.default_duration_minutes,
      default_price: jobType.default_price?.toString() || '',
      price_currency: jobType.price_currency || 'USD',
    });
    setShowJobTypeForm(true);
  };

  const handleUpdateJobType = async () => {
    if (!editingJobType || !jobTypeForm.job_name) {
      alert('Service name is required');
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
          job_name: jobTypeForm.job_name,
          job_description: jobTypeForm.job_description,
          default_duration_minutes: jobTypeForm.default_duration_minutes,
          default_price: jobTypeForm.default_price
            ? parseFloat(jobTypeForm.default_price)
            : null,
          price_currency: jobTypeForm.price_currency,
          category_id:
            jobTypeForm.category_id && jobTypeForm.category_id !== 'none'
              ? jobTypeForm.category_id
              : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobTypes(prev =>
          prev.map(jt => (jt.id === editingJobType.id ? data.job_type : jt))
        );
        resetJobTypeForm();
        setEditingJobType(null);
        setShowJobTypeForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update service');
      }
    } catch (error) {
      console.error('Failed to update service:', error);
      alert('Failed to update service. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJobType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await fetch(`/api/business/job-types?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobTypes(prev => prev.filter(jt => jt.id !== id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const getJobTypesForCategory = (categoryId: string) => {
    return jobTypes.filter(jt => jt.category_id === categoryId);
  };

  const getUncategorizedJobTypes = () => {
    return jobTypes.filter(jt => !jt.category_id);
  };

  const startInlineAdd = (categoryId: string) => {
    setAddingToCategory(categoryId);
    setInlineForm({
      job_name: '',
      job_description: '',
      default_duration_minutes: 30,
      default_price: '',
    });
  };

  const cancelInlineAdd = () => {
    setAddingToCategory(null);
    setInlineForm({
      job_name: '',
      job_description: '',
      default_duration_minutes: 30,
      default_price: '',
    });
  };

  const saveInlineService = async (categoryId: string) => {
    if (!inlineForm.job_name.trim()) {
      alert('Service name is required');
      return;
    }

    setInlineSaving(true);
    try {
      const response = await fetch('/api/business/job-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type_code: businessProfile?.business_type,
          category_id: categoryId,
          user_id: user.id,
          job_name: inlineForm.job_name.trim(),
          job_description: inlineForm.job_description.trim() || null,
          default_duration_minutes: inlineForm.default_duration_minutes,
          default_price: inlineForm.default_price
            ? parseFloat(inlineForm.default_price)
            : null,
          price_currency: 'USD',
          is_system_default: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobTypes(prev => [...prev, data.job_type]);
        cancelInlineAdd();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add service');
      }
    } catch (error) {
      console.error('Failed to add service:', error);
      alert('Failed to add service. Please try again.');
    } finally {
      setInlineSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading business profile and services...
          </p>
        </div>
      </div>
    );
  }

  if (!businessProfile?.business_type) {
    return (
      <div className="text-center py-12 border rounded-lg bg-amber-50">
        <ClockIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Business Type Required
        </h3>
        <p className="text-gray-600 mb-4">
          Please complete the Business Information step first to configure your
          business type.
        </p>
        <p className="text-sm text-gray-500">
          Current business profile: {businessProfile ? 'Found' : 'Not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Business Services
              </CardTitle>
              <CardDescription>
                Configure appointment-based services for your{' '}
                <strong>{businessProfile.business_type}</strong> business
                {businessProfile.business_name &&
                  ` (${businessProfile.business_name})`}
                . Services require duration and can be scheduled with
                appointments.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Form */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory
                ? 'Edit Service Category'
                : 'Add Service Category'}
            </CardTitle>
            <CardDescription>
              {editingCategory
                ? 'Update the service category details below.'
                : `Create a new service category for your ${businessProfile.business_type} appointment-based services.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.category_name}
                onChange={e =>
                  setCategoryForm(prev => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                placeholder="e.g., Preventive Care, Diagnostic Services"
                required
              />
            </div>

            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={e =>
                  setCategoryForm(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what services this category covers..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingCategory ? handleUpdateCategory : handleAddCategory
                }
                disabled={saving || !categoryForm.category_name}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Categories & Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Service Categories & Services
              </CardTitle>
              <CardDescription>
                Organize your appointment-based services into categories and
                manage individual service offerings with duration, pricing, and
                scheduling requirements.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetCategoryForm();
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {jobCategories.length === 0 ? (
            <div className="text-center py-8">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Service Categories
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first service category to organize your{' '}
                {businessProfile.business_type} appointment offerings.
              </p>
              <Button
                onClick={() => {
                  resetCategoryForm();
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show services organized by category */}
              {jobCategories.map(category => {
                const categoryJobTypes = getJobTypesForCategory(category.id);
                return (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="bg-blue-50 border-b border-gray-200">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-blue-800">
                            {category.category_name}
                          </h4>
                          {category.description && (
                            <span className="text-sm text-blue-600">
                              - {category.description}
                            </span>
                          )}
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {categoryJobTypes.length} services
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditCategory(category)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          >
                            <EditIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startInlineAdd(category.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                            disabled={addingToCategory === category.id}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Services Table for this category */}
                    {categoryJobTypes.length > 0 ? (
                      <>
                        {/* Services Header */}
                        <div className="bg-gray-50 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-700">
                            <div className="col-span-4">Service Name</div>
                            <div className="col-span-4">Description</div>
                            <div className="col-span-2">Duration</div>
                            <div className="col-span-1">Price</div>
                            <div className="col-span-1 text-right">Actions</div>
                          </div>
                        </div>

                        {/* Service Rows */}
                        {categoryJobTypes.map((jobType, index) => (
                          <div
                            key={jobType.id}
                            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 bg-white hover:bg-gray-50"
                          >
                            <div className="col-span-4 font-medium text-black">
                              {jobType.job_name}
                            </div>
                            <div className="col-span-4 text-sm text-black">
                              {jobType.job_description || '-'}
                            </div>
                            <div className="col-span-2 text-sm text-black">
                              {jobType.default_duration_minutes}min
                            </div>
                            <div className="col-span-1 text-sm text-black">
                              {jobType.default_price
                                ? `${jobType.price_currency} ${jobType.default_price}`
                                : '-'}
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditJobType(jobType)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteJobType(jobType.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Inline Add Row */}
                        {addingToCategory === category.id && (
                          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 bg-yellow-50">
                            <div className="col-span-4">
                              <Input
                                value={inlineForm.job_name}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    job_name: e.target.value,
                                  }))
                                }
                                placeholder="Service name"
                                className="h-8 text-sm"
                                autoFocus
                              />
                            </div>
                            <div className="col-span-4">
                              <Input
                                value={inlineForm.job_description}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    job_description: e.target.value,
                                  }))
                                }
                                placeholder="Description"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                min="1"
                                value={inlineForm.default_duration_minutes}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    default_duration_minutes:
                                      parseInt(e.target.value) || 30,
                                  }))
                                }
                                placeholder="Duration"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={inlineForm.default_price}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    default_price: e.target.value,
                                  }))
                                }
                                placeholder="Price"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveInlineService(category.id)}
                                disabled={
                                  inlineSaving || !inlineForm.job_name.trim()
                                }
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                {inlineSaving ? (
                                  <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelInlineAdd}
                                disabled={inlineSaving}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {addingToCategory === category.id ? (
                          <>
                            {/* Services Header */}
                            <div className="bg-gray-50 border-b border-gray-200">
                              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-700">
                                <div className="col-span-4">Service Name</div>
                                <div className="col-span-4">Description</div>
                                <div className="col-span-2">Duration</div>
                                <div className="col-span-1">Price</div>
                                <div className="col-span-1 text-right">
                                  Actions
                                </div>
                              </div>
                            </div>
                            {/* Inline Add Row for empty category */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 bg-yellow-50">
                              <div className="col-span-4">
                                <Input
                                  value={inlineForm.job_name}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      job_name: e.target.value,
                                    }))
                                  }
                                  placeholder="Service name"
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <div className="col-span-4">
                                <Input
                                  value={inlineForm.job_description}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      job_description: e.target.value,
                                    }))
                                  }
                                  placeholder="Description"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={inlineForm.default_duration_minutes}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      default_duration_minutes:
                                        parseInt(e.target.value) || 30,
                                    }))
                                  }
                                  placeholder="Duration"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={inlineForm.default_price}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      default_price: e.target.value,
                                    }))
                                  }
                                  placeholder="Price"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-1 flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveInlineService(category.id)}
                                  disabled={
                                    inlineSaving || !inlineForm.job_name.trim()
                                  }
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  {inlineSaving ? (
                                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <CheckIcon className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelInlineAdd}
                                  disabled={inlineSaving}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm">
                              No services in this category yet.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Click the + icon in the header to add a service
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized Services */}
              {(() => {
                const uncategorizedJobTypes = getUncategorizedJobTypes();
                if (uncategorizedJobTypes.length === 0) return null;

                return (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Uncategorized Header */}
                    <div className="bg-amber-50 border-b border-gray-200">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-amber-800">
                            Uncategorized Services
                          </h4>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            {uncategorizedJobTypes.length} services
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Services Header */}
                    <div className="bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-700">
                        <div className="col-span-4">Service Name</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-2">Duration</div>
                        <div className="col-span-1">Price</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                    </div>

                    {/* Service Rows */}
                    {uncategorizedJobTypes.map((jobType, index) => (
                      <div
                        key={jobType.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <div className="col-span-4 font-medium text-black">
                          {jobType.job_name}
                        </div>
                        <div className="col-span-4 text-sm text-black">
                          {jobType.job_description || '-'}
                        </div>
                        <div className="col-span-2 text-sm text-black">
                          {jobType.default_duration_minutes}min
                        </div>
                        <div className="col-span-1 text-sm text-black">
                          {jobType.default_price
                            ? `${jobType.price_currency} ${jobType.default_price}`
                            : '-'}
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditJobType(jobType)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <EditIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJobType(jobType.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>

        {/* Save Changes Section */}
        {hasUnsavedChanges && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                <p className="text-sm text-amber-800">
                  You have unsaved changes to service categories
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === 'success' && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckIcon className="h-4 w-4" />
                    Changes saved successfully!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-sm text-red-600">
                    Failed to save changes
                  </span>
                )}
                <Button
                  onClick={handleSaveChanges}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-3 w-3" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Service Form */}
      {showJobTypeForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingJobType ? 'Edit Service' : 'Add Service'}
            </CardTitle>
            <CardDescription>
              {editingJobType
                ? 'Update the service details below.'
                : 'Define a specific appointment-based service with duration and pricing information.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-name">Service Name *</Label>
                <Input
                  id="job-name"
                  value={jobTypeForm.job_name}
                  onChange={e =>
                    setJobTypeForm(prev => ({
                      ...prev,
                      job_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Teeth Cleaning, Consultation"
                  required
                />
              </div>
              <div>
                <Label htmlFor="job-category">Category</Label>
                <Select
                  value={jobTypeForm.category_id}
                  onValueChange={value =>
                    setJobTypeForm(prev => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {jobCategories.map(category => (
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
                value={jobTypeForm.job_description}
                onChange={e =>
                  setJobTypeForm(prev => ({
                    ...prev,
                    job_description: e.target.value,
                  }))
                }
                placeholder="Describe what this service includes..."
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={jobTypeForm.default_duration_minutes}
                  onChange={e =>
                    setJobTypeForm(prev => ({
                      ...prev,
                      default_duration_minutes: parseInt(e.target.value) || 30,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Service Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={jobTypeForm.default_price}
                  onChange={e =>
                    setJobTypeForm(prev => ({
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
                  value={jobTypeForm.price_currency}
                  onValueChange={value =>
                    setJobTypeForm(prev => ({ ...prev, price_currency: value }))
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
                disabled={saving || !jobTypeForm.job_name}
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
                    {editingJobType ? 'Update Service' : 'Add Service'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowJobTypeForm(false);
                  setEditingJobType(null);
                  resetJobTypeForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <ClockIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Services Status</p>
              <p className="text-sm text-blue-700">
                Business Type: <strong>{businessProfile.business_type}</strong>{' '}
                | Categories: <strong>{jobCategories.length}</strong> |
                Services: <strong>{jobTypes.length}</strong>
                {jobCategories.length > 0 && jobTypes.length > 0 && (
                  <span className="block mt-1">
                    ✅ Ready for staff assignment and appointment scheduling!
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
