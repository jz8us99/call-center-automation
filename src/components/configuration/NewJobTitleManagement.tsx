'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthenticatedApiClient } from '@/lib/api-client';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  UserIcon,
  SettingsIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

interface PredefinedJobTitle {
  id: string;
  title_name: string;
  description?: string;
  required_qualifications: string[];
  display_order: number;
}

interface JobCategory {
  id: string;
  service_type_code: string;
  category_name: string;
  description?: string;
  display_order: number;
}

interface JobType {
  id: string;
  service_type_code: string;
  category_id?: string;
  job_name: string;
  job_description?: string;
  default_duration_minutes: number;
  default_price?: number;
  is_active: boolean;
  is_system_default: boolean;
}

interface UserJobTitle {
  id: string;
  title_name: string;
  description?: string;
  required_qualifications: string[];
}

interface JobTitleCategoryMapping {
  id: string;
  job_title_id: string;
  category_id: string;
  selected_job_types: string[];
  job_categories: JobCategory;
}

interface NewJobTitleManagementProps {
  user: User;
  serviceTypeCode: string;
  onJobTitlesUpdate?: (jobTitles: UserJobTitle[]) => void;
}

export function NewJobTitleManagement({
  user,
  serviceTypeCode,
  onJobTitlesUpdate,
}: NewJobTitleManagementProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [predefinedTitles, setPredefinedTitles] = useState<
    PredefinedJobTitle[]
  >([]);
  const [userJobTitles, setUserJobTitles] = useState<UserJobTitle[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [titleCategoryMappings, setTitleCategoryMappings] = useState<
    JobTitleCategoryMapping[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPredefinedTitle, setSelectedPredefinedTitle] =
    useState<string>('');
  const [selectedUserTitle, setSelectedUserTitle] =
    useState<UserJobTitle | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedJobTypesByCategory, setSelectedJobTypesByCategory] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    if (user && serviceTypeCode) {
      loadInitialData();
    }
  }, [user, serviceTypeCode]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPredefinedTitles(),
        loadUserJobTitles(),
        loadJobCategories(),
        loadJobTypes(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedTitles = async () => {
    try {
      const response = await AuthenticatedApiClient.get(
        '/api/job-titles?predefined=true'
      );
      if (response.ok) {
        const data = await response.json();
        setPredefinedTitles(data.job_titles || []);
      }
    } catch (error) {
      console.error('Failed to load predefined titles:', error);
    }
  };

  const loadUserJobTitles = async () => {
    try {
      const response = await AuthenticatedApiClient.get(
        `/api/job-titles?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserJobTitles(data.job_titles || []);
        onJobTitlesUpdate?.(data.job_titles || []);
        // Load mappings for existing titles
        if (data.job_titles?.length > 0) {
          loadTitleCategoryMappings();
        }
      }
    } catch (error) {
      console.error('Failed to load user job titles:', error);
    }
  };

  const loadJobCategories = async () => {
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

  const loadJobTypes = async () => {
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

  const loadTitleCategoryMappings = async () => {
    try {
      const response = await fetch(
        `/api/job-title-categories?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setTitleCategoryMappings(data.mappings || []);
      }
    } catch (error) {
      console.error('Failed to load title category mappings:', error);
    }
  };

  const handleAddJobTitle = async () => {
    if (!selectedPredefinedTitle) {
      toast.error('Please select a job title');
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
          predefined_title_id: selectedPredefinedTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTitles = [...userJobTitles, data.job_title];
        setUserJobTitles(updatedTitles);
        onJobTitlesUpdate?.(updatedTitles);
        setSelectedPredefinedTitle('');
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

  const handleDeleteJobTitle = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Job Title',
      description:
        'Are you sure you want to delete this job title? This will also remove all associated category mappings.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/job-titles?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedTitles = userJobTitles.filter(title => title.id !== id);
        setUserJobTitles(updatedTitles);
        onJobTitlesUpdate?.(updatedTitles);
        // Remove from selected if it was selected
        if (selectedUserTitle?.id === id) {
          setSelectedUserTitle(null);
          setSelectedCategories([]);
          setSelectedJobTypesByCategory({});
        }
        // Reload mappings
        loadTitleCategoryMappings();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete job title');
      }
    } catch (error) {
      console.error('Failed to delete job title:', error);
      toast.error('Failed to delete job title. Please try again.');
    }
  };

  const handleSelectUserTitle = (title: UserJobTitle) => {
    setSelectedUserTitle(title);
    // Load existing mappings for this title
    const existingMappings = titleCategoryMappings.filter(
      m => m.job_title_id === title.id
    );
    const categories = existingMappings.map(m => m.category_id);
    setSelectedCategories(categories);

    // Load selected job types by category
    const jobTypesByCategory: Record<string, string[]> = {};
    existingMappings.forEach(mapping => {
      jobTypesByCategory[mapping.category_id] = mapping.selected_job_types;
    });
    setSelectedJobTypesByCategory(jobTypesByCategory);
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId]);
      // Initialize empty job types array for this category
      setSelectedJobTypesByCategory(prev => ({
        ...prev,
        [categoryId]: [],
      }));
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      // Remove job types for this category
      setSelectedJobTypesByCategory(prev => {
        const updated = { ...prev };
        delete updated[categoryId];
        return updated;
      });
    }
  };

  const handleJobTypeToggle = (
    categoryId: string,
    jobTypeId: string,
    checked: boolean
  ) => {
    setSelectedJobTypesByCategory(prev => {
      const categoryJobTypes = prev[categoryId] || [];
      if (checked) {
        return {
          ...prev,
          [categoryId]: [...categoryJobTypes, jobTypeId],
        };
      } else {
        return {
          ...prev,
          [categoryId]: categoryJobTypes.filter(id => id !== jobTypeId),
        };
      }
    });
  };

  const handleSaveCategoryMappings = async () => {
    if (!selectedUserTitle) {
      toast.error('Please select a job title first');
      return;
    }

    setSaving(true);
    try {
      // Save mappings for each selected category
      const promises = selectedCategories.map(categoryId => {
        const selectedJobTypes = selectedJobTypesByCategory[categoryId] || [];
        return fetch('/api/job-title-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            job_title_id: selectedUserTitle.id,
            category_id: categoryId,
            selected_job_types: selectedJobTypes,
          }),
        });
      });

      await Promise.all(promises);

      // Reload mappings to reflect changes
      await loadTitleCategoryMappings();

      toast.success('Category mappings saved successfully!');
    } catch (error) {
      console.error('Failed to save category mappings:', error);
      toast.error('Failed to save category mappings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getJobTypesForCategory = (categoryId: string) => {
    return jobTypes.filter(jt => jt.category_id === categoryId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job title management...</p>
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
          Please configure your business type first to set up job titles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Add Job Titles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Step 1: Select Common Job Titles
          </CardTitle>
          <CardDescription>
            Choose from predefined job titles that match your business needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="predefined-title">Select Job Title</Label>
              <Select
                value={selectedPredefinedTitle}
                onValueChange={setSelectedPredefinedTitle}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job title..." />
                </SelectTrigger>
                <SelectContent>
                  {predefinedTitles.map(title => (
                    <SelectItem key={title.id} value={title.id}>
                      <div>
                        <div className="font-medium">{title.title_name}</div>
                        {title.description && (
                          <div className="text-xs text-gray-500">
                            {title.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddJobTitle}
              disabled={saving || !selectedPredefinedTitle}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  Add Title
                </>
              )}
            </Button>
          </div>

          {/* User's Job Titles */}
          {userJobTitles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Your Job Titles
              </h4>
              <div className="grid gap-3">
                {userJobTitles.map(title => (
                  <div
                    key={title.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedUserTitle?.id === title.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectUserTitle(title)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {title.title_name}
                        </h5>
                        {title.description && (
                          <p className="text-sm text-gray-600">
                            {title.description}
                          </p>
                        )}
                        {title.required_qualifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {title.required_qualifications.map((qual, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {qual}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteJobTitle(title.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Categories and Job Types */}
      {selectedUserTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Step 2: Configure Categories for "{selectedUserTitle.title_name}"
            </CardTitle>
            <CardDescription>
              Select job categories and specific job types for this title.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {jobCategories.map(category => {
              const categoryJobTypes = getJobTypesForCategory(category.id);
              const isCategorySelected = selectedCategories.includes(
                category.id
              );
              const selectedJobTypesInCategory =
                selectedJobTypesByCategory[category.id] || [];

              return (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={isCategorySelected}
                      onCheckedChange={checked =>
                        handleCategoryToggle(category.id, !!checked)
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {category.category_name}
                      </label>
                      {category.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {category.description}
                        </p>
                      )}

                      {/* Job Types for this category */}
                      {isCategorySelected && categoryJobTypes.length > 0 && (
                        <div className="mt-4 ml-4 space-y-2">
                          <h5 className="text-xs font-medium text-gray-700">
                            Available Job Types:
                          </h5>
                          <div className="grid gap-2">
                            {categoryJobTypes.map(jobType => (
                              <div
                                key={jobType.id}
                                className="flex items-start gap-2"
                              >
                                <Checkbox
                                  id={`jobtype-${jobType.id}`}
                                  checked={selectedJobTypesInCategory.includes(
                                    jobType.id
                                  )}
                                  onCheckedChange={checked =>
                                    handleJobTypeToggle(
                                      category.id,
                                      jobType.id,
                                      !!checked
                                    )
                                  }
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`jobtype-${jobType.id}`}
                                    className="text-xs text-gray-900 cursor-pointer"
                                  >
                                    {jobType.job_name}
                                  </label>
                                  {jobType.job_description && (
                                    <p className="text-xs text-gray-500">
                                      {jobType.job_description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                    <span>
                                      {jobType.default_duration_minutes} min
                                    </span>
                                    {jobType.default_price && (
                                      <span>${jobType.default_price}</span>
                                    )}
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
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSaveCategoryMappings}
                disabled={saving || selectedCategories.length === 0}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
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
              <UserIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                Job Title Configuration Status
              </p>
              <p className="text-sm text-blue-700">
                {userJobTitles.length === 0
                  ? 'Add job titles to get started with staff management.'
                  : `${userJobTitles.length} job title${userJobTitles.length > 1 ? 's' : ''} configured. ${
                      selectedUserTitle
                        ? `Configure categories for "${selectedUserTitle.title_name}" to continue.`
                        : 'Select a job title to configure its categories and job types.'
                    }`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
