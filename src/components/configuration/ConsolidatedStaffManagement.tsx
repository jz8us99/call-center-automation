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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  UserIcon,
  SettingsIcon,
} from '@/components/icons';

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

interface StaffMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  job_category_id?: string;
  selected_job_types: string[];
  schedule?: any;
  specialties?: string[];
  is_active: boolean;
  job_categories?: JobCategory;
}

interface ConsolidatedStaffManagementProps {
  user: User;
  serviceTypeCode: string;
  onStaffUpdate: (hasStaff: boolean) => void;
}

export function ConsolidatedStaffManagement({
  user,
  serviceTypeCode,
  onStaffUpdate,
}: ConsolidatedStaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    job_category_id: '',
    selected_job_types: [] as string[],
    specialties: '',
  });

  const defaultSchedule = {
    monday: { start: '09:00', end: '17:00', available: true },
    tuesday: { start: '09:00', end: '17:00', available: true },
    wednesday: { start: '09:00', end: '17:00', available: true },
    thursday: { start: '09:00', end: '17:00', available: true },
    friday: { start: '09:00', end: '17:00', available: true },
    saturday: { start: '09:00', end: '13:00', available: false },
    sunday: { start: '09:00', end: '13:00', available: false },
  };

  useEffect(() => {
    if (user && serviceTypeCode) {
      loadInitialData();
    }
  }, [user, serviceTypeCode]);

  useEffect(() => {
    onStaffUpdate(staff.length > 0);
  }, [staff.length, onStaffUpdate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadJobCategories(), loadJobTypes(), loadStaff()]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
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

  const loadStaff = async () => {
    try {
      const response = await fetch(`/api/business/staff?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.first_name || !formData.last_name) {
      alert('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business/staff?', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          job_category_id: formData.job_category_id || null,
          selected_job_types: formData.selected_job_types,
          schedule: defaultSchedule,
          specialties: formData.specialties
            ? formData.specialties.split(',').map(s => s.trim())
            : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(prev => [...prev, data.staff]);
        resetForm();
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Failed to add staff member:', error);
      alert('Failed to add staff member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !formData.first_name || !formData.last_name) {
      alert('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business/staff?', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingStaff.id,
          user_id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          job_category_id: formData.job_category_id || null,
          selected_job_types: formData.selected_job_types,
          specialties: formData.specialties
            ? formData.specialties.split(',').map(s => s.trim())
            : [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(prev =>
          prev.map(s => (s.id === editingStaff.id ? data.staff : s))
        );
        resetForm();
        setEditingStaff(null);
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Failed to update staff member:', error);
      alert('Failed to update staff member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/business/staff?id=${id}&user_id=${user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setStaff(prev => prev.filter(s => s.id !== id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      alert('Failed to delete staff member. Please try again.');
    }
  };

  const handleJobTypeToggle = (jobTypeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_job_types: checked
        ? [...prev.selected_job_types, jobTypeId]
        : prev.selected_job_types.filter(id => id !== jobTypeId),
    }));
  };

  const startEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || '',
      job_category_id: member.job_category_id || '',
      selected_job_types: member.selected_job_types || [],
      specialties: member.specialties?.join(', ') || '',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: '',
      job_category_id: '',
      selected_job_types: [],
      specialties: '',
    });
  };

  const getJobTypesForCategory = (categoryId: string) => {
    return jobTypes.filter(jt => jt.category_id === categoryId);
  };

  const getJobTypeNameById = (id: string) => {
    const jobType = jobTypes.find(jt => jt.id === id);
    return jobType?.job_name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff management...</p>
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
          Please configure your business type first to set up staff management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Staff Management
              </CardTitle>
              <CardDescription>
                Add and manage your staff members. Job titles are based on job
                categories for your business type.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setEditingStaff(null);
                setShowAddForm(true);
              }}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Staff Members Added
              </h3>
              <p className="text-gray-600 mb-4">
                Add your first staff member to help the AI agent provide
                accurate scheduling information.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingStaff(null);
                  setShowAddForm(true);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Staff Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map(member => (
                <div
                  key={member.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {member.first_name} {member.last_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {member.job_categories?.category_name ||
                              'No job category assigned'}
                          </p>
                          {member.gender && (
                            <p className="text-xs text-gray-500">
                              {member.gender}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="text-sm font-medium">
                            {member.email || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="text-sm font-medium">
                            {member.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {member.selected_job_types &&
                        member.selected_job_types.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-1">
                              Selected Job Types
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {member.selected_job_types.map(jobTypeId => (
                                <span
                                  key={jobTypeId}
                                  className="px-2 py-1 bg-blue-100 text-xs rounded-full text-blue-800"
                                >
                                  {getJobTypeNameById(jobTypeId)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {member.specialties && member.specialties.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">
                            Specialties
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(member)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(member.id)}
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

      {/* Add/Edit Staff Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </CardTitle>
            <CardDescription>
              Select a job category (which serves as the job title) and choose
              specific job types.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">
                Basic Information
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={formData.first_name}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    placeholder="Jane"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={formData.last_name}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="jane.smith@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="job-category">Job Title (Category)</Label>
                  <Select
                    value={formData.job_category_id}
                    onValueChange={value => {
                      setFormData(prev => ({
                        ...prev,
                        job_category_id: value,
                        selected_job_types: [], // Reset job types when category changes
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job category" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div>
                            <div className="font-medium">
                              {category.category_name}
                            </div>
                            {category.description && (
                              <div className="text-xs text-gray-500">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Job Types Selection */}
            {formData.job_category_id && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Select Job Types
                </h4>
                <p className="text-sm text-gray-600">
                  Choose specific job types this staff member can handle within
                  their job category.
                </p>

                {(() => {
                  const categoryJobTypes = getJobTypesForCategory(
                    formData.job_category_id
                  );

                  if (categoryJobTypes.length === 0) {
                    return (
                      <div className="text-center py-6 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">
                          No job types available for this category.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                      {categoryJobTypes.map(jobType => (
                        <div
                          key={jobType.id}
                          className="flex items-start gap-3"
                        >
                          <Checkbox
                            id={`jobtype-${jobType.id}`}
                            checked={formData.selected_job_types.includes(
                              jobType.id
                            )}
                            onCheckedChange={checked =>
                              handleJobTypeToggle(jobType.id, !!checked)
                            }
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`jobtype-${jobType.id}`}
                              className="text-sm font-medium text-gray-900 cursor-pointer"
                            >
                              {jobType.job_name}
                            </label>
                            {jobType.job_description && (
                              <p className="text-xs text-gray-600">
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
                  );
                })()}
              </div>
            )}

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">
                Additional Information
              </h4>
              <div>
                <Label htmlFor="specialties">
                  Specialties (comma-separated)
                </Label>
                <Textarea
                  id="specialties"
                  value={formData.specialties}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      specialties: e.target.value,
                    }))
                  }
                  placeholder="e.g., Root canals, Cosmetic dentistry, Emergency care"
                  rows={2}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={editingStaff ? handleUpdateStaff : handleAddStaff}
                disabled={saving || !formData.first_name || !formData.last_name}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingStaff ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStaff(null);
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

      {/* Status Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                Staff Management Status
              </p>
              <p className="text-sm text-blue-700">
                {staff.length > 0
                  ? `${staff.length} staff member${staff.length > 1 ? 's' : ''} added. The AI agent can now provide staff-specific information.`
                  : 'Add at least one staff member to help the AI agent provide accurate scheduling and availability information.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
