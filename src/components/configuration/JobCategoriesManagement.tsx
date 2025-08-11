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
  SettingsIcon,
  ArrowRightIcon,
} from '@/components/icons';

interface JobCategory {
  id: string;
  service_type_code: string;
  category_name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  job_types_count?: number;
}

interface JobCategoriesManagementProps {
  user: User;
  serviceTypeCode: string;
  jobTitleId?: string;
  onCategorySelect?: (category: JobCategory) => void;
  onCategoriesUpdate?: (categories: JobCategory[]) => void;
}

export function JobCategoriesManagement({
  user,
  serviceTypeCode,
  jobTitleId,
  onCategorySelect,
  onCategoriesUpdate,
}: JobCategoriesManagementProps) {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    if (user && serviceTypeCode) {
      loadCategories();
    }
  }, [user, serviceTypeCode]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/business/job-categories?service_type_code=${serviceTypeCode}`
      );
      if (response.ok) {
        const data = await response.json();
        // Fetch job types count for each category
        const categoriesWithCounts = await Promise.all(
          (data.categories || []).map(async (category: JobCategory) => {
            try {
              const jobTypesResponse = await fetch(
                `/api/business/job-types?service_type_code=${serviceTypeCode}&category_id=${category.id}&user_id=${user.id}`
              );
              if (jobTypesResponse.ok) {
                const jobTypesData = await jobTypesResponse.json();
                return {
                  ...category,
                  job_types_count: jobTypesData.job_types?.length || 0,
                };
              }
              return { ...category, job_types_count: 0 };
            } catch {
              return { ...category, job_types_count: 0 };
            }
          })
        );
        setCategories(categoriesWithCounts);
        onCategoriesUpdate?.(categoriesWithCounts);
      }
    } catch (error) {
      console.error('Failed to load job categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!formData.category_name.trim()) {
      alert('Category name is required');
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
          service_type_code: serviceTypeCode,
          category_name: formData.category_name.trim(),
          description: formData.description.trim() || null,
          display_order: formData.display_order,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCategory = { ...data.category, job_types_count: 0 };
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        onCategoriesUpdate?.(updatedCategories);
        resetForm();
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create job category');
      }
    } catch (error) {
      console.error('Failed to create job category:', error);
      alert('Failed to create job category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.category_name.trim()) {
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
          category_name: formData.category_name.trim(),
          description: formData.description.trim() || null,
          display_order: formData.display_order,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id
            ? { ...data.category, job_types_count: cat.job_types_count }
            : cat
        );
        setCategories(updatedCategories);
        onCategoriesUpdate?.(updatedCategories);
        resetForm();
        setEditingCategory(null);
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update job category');
      }
    } catch (error) {
      console.error('Failed to update job category:', error);
      alert('Failed to update job category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job category?')) {
      return;
    }

    try {
      const response = await fetch(`/api/business/job-categories?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedCategories = categories.filter(cat => cat.id !== id);
        setCategories(updatedCategories);
        onCategoriesUpdate?.(updatedCategories);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete job category');
      }
    } catch (error) {
      console.error('Failed to delete job category:', error);
      alert('Failed to delete job category. Please try again.');
    }
  };

  const startEdit = (category: JobCategory) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      description: category.description || '',
      display_order: category.display_order,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      category_name: '',
      description: '',
      display_order: categories.length,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job categories...</p>
        </div>
      </div>
    );
  }

  if (!serviceTypeCode) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50">
        <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Business Type Required
        </h3>
        <p className="text-gray-600">
          Please configure your business type first to set up job categories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Job Categories
          </h3>
          <p className="text-sm text-gray-600">
            Configure job categories for your business type. Each category can
            contain multiple job types.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingCategory(null);
            setShowAddForm(true);
          }}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Job Categories
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create job categories to organize your job types. Categories help
            group related services together.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setEditingCategory(null);
              setShowAddForm(true);
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map(category => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <SettingsIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {category.category_name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="secondary">
                      {category.job_types_count || 0} job types
                    </Badge>
                    <Badge variant="outline">
                      Order: {category.display_order}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onCategorySelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCategorySelect(category)}
                      className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Manage Job Types
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(category)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? 'Edit Job Category' : 'Add New Job Category'}
            </CardTitle>
            <CardDescription>
              {editingCategory
                ? 'Update the job category information.'
                : 'Create a new job category to organize your job types.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={formData.category_name}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                placeholder="e.g., Preventive Care, Restorative, Emergency"
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
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="display-order">Display Order</Label>
              <Input
                id="display-order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    display_order: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingCategory ? handleUpdateCategory : handleAddCategory
                }
                disabled={saving || !formData.category_name.trim()}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingCategory ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
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
