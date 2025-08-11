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
  display_order: number;
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
  display_order: number;
  job_categories?: JobCategory;
}

interface WorkingBusinessProductsServicesProps {
  user: User;
  onProductsServicesUpdate: (hasProductsServices: boolean) => void;
}

export function WorkingBusinessProductsServices({
  user,
  onProductsServicesUpdate,
}: WorkingBusinessProductsServicesProps) {
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(
    null
  );
  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    description: '',
    display_order: 0,
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
    display_order: 0,
  });

  useEffect(() => {
    if (user) {
      loadBusinessProfileAndData();
    }
  }, [user]);

  useEffect(() => {
    const hasData = jobCategories.length > 0 && jobTypes.length > 0;
    onProductsServicesUpdate(hasData);
  }, [jobCategories.length, jobTypes.length, onProductsServicesUpdate]);

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
          display_order: categoryForm.display_order,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobCategories(prev => [...prev, data.category]);
        resetCategoryForm();
        setShowCategoryForm(false);
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

  const handleDeleteCategory = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? This will also affect any associated job types.'
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const handleAddJobType = async () => {
    if (!jobTypeForm.job_name || !businessProfile?.business_type) {
      alert('Job name is required and business type must be configured');
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
          category_id: jobTypeForm.category_id || null,
          user_id: user.id,
          job_name: jobTypeForm.job_name,
          job_description: jobTypeForm.job_description,
          default_duration_minutes: jobTypeForm.default_duration_minutes,
          default_price: jobTypeForm.default_price
            ? parseFloat(jobTypeForm.default_price)
            : null,
          price_currency: jobTypeForm.price_currency,
          display_order: jobTypeForm.display_order,
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
        alert(errorData.error || 'Failed to add job type');
      }
    } catch (error) {
      console.error('Failed to add job type:', error);
      alert('Failed to add job type. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_name: '',
      description: '',
      display_order: 0,
    });
  };

  const resetJobTypeForm = () => {
    setJobTypeForm({
      category_id: '',
      job_name: '',
      job_description: '',
      default_duration_minutes: 30,
      default_price: '',
      price_currency: 'USD',
      display_order: 0,
    });
  };

  const getJobTypesForCategory = (categoryId: string) => {
    return jobTypes.filter(jt => jt.category_id === categoryId);
  };

  const getUncategorizedJobTypes = () => {
    return jobTypes.filter(jt => !jt.category_id);
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
        <SettingsIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
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
                <SettingsIcon className="h-5 w-5" />
                Business Products & Services
              </CardTitle>
              <CardDescription>
                Configure service categories and job types for your{' '}
                <strong>{businessProfile.business_type}</strong> business
                {businessProfile.business_name &&
                  ` (${businessProfile.business_name})`}
                .
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Service Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Service Categories
              </CardTitle>
              <CardDescription>
                Organize your services into categories. Each category can
                contain multiple specific job types.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetCategoryForm();
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="flex items-center gap-2"
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
                {businessProfile.business_type} offerings.
              </p>
              <Button
                onClick={() => {
                  resetCategoryForm();
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Category
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {jobCategories.map(category => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {category.category_name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getJobTypesForCategory(category.id).length} job types
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Order: {category.display_order}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
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

      {/* Category Form */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Service Category</CardTitle>
            <CardDescription>
              Create a new service category for your{' '}
              {businessProfile.business_type} business.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                  placeholder="e.g., Preventive Care, Repairs"
                  required
                />
              </div>
              <div>
                <Label htmlFor="display-order">Display Order</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={categoryForm.display_order}
                  onChange={e =>
                    setCategoryForm(prev => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
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
                placeholder="Describe what this category covers..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleAddCategory}
                disabled={saving || !categoryForm.category_name}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Add Category
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCategoryForm(false);
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

      {/* Job Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSignIcon className="h-5 w-5" />
                Job Types & Pricing
              </CardTitle>
              <CardDescription>
                Define specific services with pricing, duration, and category
                assignment.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetJobTypeForm();
                setShowJobTypeForm(true);
              }}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Job Type
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {jobTypes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSignIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Job Types Configured
              </h3>
              <p className="text-gray-600 mb-4">
                Add specific services with pricing and duration information for
                your {businessProfile.business_type} business.
              </p>
              <Button
                onClick={() => {
                  resetJobTypeForm();
                  setShowJobTypeForm(true);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Job Type
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show job types organized by category */}
              {jobCategories.map(category => {
                const categoryJobTypes = getJobTypesForCategory(category.id);
                if (categoryJobTypes.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      {category.category_name}
                      <Badge variant="secondary" className="text-xs">
                        {categoryJobTypes.length} items
                      </Badge>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {categoryJobTypes.map(jobType => (
                        <div
                          key={jobType.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-gray-900">
                                  {jobType.job_name}
                                </h5>
                                <Badge
                                  variant={
                                    jobType.is_system_default
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {jobType.is_system_default
                                    ? 'System'
                                    : 'Custom'}
                                </Badge>
                              </div>

                              {jobType.job_description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {jobType.job_description}
                                </p>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">
                                    Duration:
                                  </span>
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Show uncategorized job types */}
              {(() => {
                const uncategorizedJobTypes = getUncategorizedJobTypes();
                if (uncategorizedJobTypes.length === 0) return null;

                return (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      Uncategorized
                      <Badge variant="outline" className="text-xs">
                        {uncategorizedJobTypes.length} items
                      </Badge>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {uncategorizedJobTypes.map(jobType => (
                        <div
                          key={jobType.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-semibold text-gray-900">
                                  {jobType.job_name}
                                </h5>
                                <Badge
                                  variant={
                                    jobType.is_system_default
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {jobType.is_system_default
                                    ? 'System'
                                    : 'Custom'}
                                </Badge>
                              </div>

                              {jobType.job_description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {jobType.job_description}
                                </p>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">
                                    Duration:
                                  </span>
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
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Type Form */}
      {showJobTypeForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Job Type</CardTitle>
            <CardDescription>
              Define a specific service with pricing and duration information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-name">Job Name *</Label>
                <Input
                  id="job-name"
                  value={jobTypeForm.job_name}
                  onChange={e =>
                    setJobTypeForm(prev => ({
                      ...prev,
                      job_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Teeth Cleaning, Oil Change"
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
                    <SelectItem value="">No Category</SelectItem>
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
                <Label htmlFor="price">Price</Label>
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
                onClick={handleAddJobType}
                disabled={saving || !jobTypeForm.job_name}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Add Job Type
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowJobTypeForm(false);
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
              <SettingsIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                Products & Services Status
              </p>
              <p className="text-sm text-blue-700">
                Business Type: <strong>{businessProfile.business_type}</strong>{' '}
                | Categories: <strong>{jobCategories.length}</strong> | Job
                Types: <strong>{jobTypes.length}</strong>
                {jobCategories.length > 0 && jobTypes.length > 0 && (
                  <span className="block mt-1">
                    ✅ Ready for staff assignment!
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
