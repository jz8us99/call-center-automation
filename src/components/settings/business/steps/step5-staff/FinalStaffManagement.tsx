'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  PlusIcon,
  UserIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  SettingsIcon,
  CalendarIcon,
} from '@/components/icons';
import { StaffCalendarConfiguration } from '@/components/settings/business/steps/step5-staff/StaffCalendarConfiguration';

interface JobCategory {
  id: string;
  service_type_code: string;
  category_name: string;
  description?: string;
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

interface BusinessLocation {
  id: string;
  business_id: string;
  location_name: string;
  is_primary: boolean;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  user_id: string;
  location_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other';
  title: string;
  job_types: string[];
  schedule?: any;
  specialties?: string[];
  is_active: boolean;
}

interface FinalStaffManagementProps {
  user: User;
  serviceTypeCode: string;
  onStaffUpdate: (hasStaff: boolean) => void;
}

export function FinalStaffManagement({
  user,
  serviceTypeCode,
  onStaffUpdate,
}: FinalStaffManagementProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [businessLocations, setBusinessLocations] = useState<
    BusinessLocation[]
  >([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [configuringCalendar, setConfiguringCalendar] =
    useState<StaffMember | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    job_title: '',
    job_category_ids: [] as string[], // Changed to support multiple categories
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

  // Filter staff by selected location
  const filteredStaff = selectedLocationId
    ? staff.filter(s => s.location_id === selectedLocationId || !s.location_id) // Include staff without location for backward compatibility
    : staff;

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBusinessLocations(),
        loadJobCategories(),
        loadJobTypes(),
        loadStaff(),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessLocations = async () => {
    try {
      const response = await authenticatedFetch(
        `/api/business/locations?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setBusinessLocations(data.locations || []);

        // Set primary location as default
        const primaryLocation = data.locations?.find(
          (loc: BusinessLocation) => loc.is_primary
        );
        if (primaryLocation) {
          setSelectedLocationId(primaryLocation.id);
        } else if (data.locations?.length > 0) {
          setSelectedLocationId(data.locations[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load business locations:', error);
    }
  };

  const loadJobCategories = async () => {
    try {
      const response = await authenticatedFetch(
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
      const response = await authenticatedFetch(
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
      const response = await authenticatedFetch(
        `/api/business/staff?user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.first_name || !formData.last_name || !formData.job_title) {
      toast.error('First name, last name, and job title are required');
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/business/staff?', {
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
          job_title: formData.job_title,
          job_category_ids: formData.job_category_ids,
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
        toast.success('Staff member added successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Failed to add staff member:', error);
      toast.error('Failed to add staff member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !formData.first_name || !formData.last_name) {
      toast.error('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/business/staff?', {
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
          job_title: formData.job_title,
          job_category_ids: formData.job_category_ids,
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
        toast.success('Staff member updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Failed to update staff member:', error);
      toast.error('Failed to update staff member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Staff Member',
      description: 'Are you sure you want to delete this staff member?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/business/staff?id=${id}&user_id=${user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setStaff(prev => prev.filter(s => s.id !== id));
        toast.success('Staff member deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Failed to delete staff member:', error);
      toast.error('Failed to delete staff member. Please try again.');
    }
  };

  const startEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || '',
      job_title: member.title || '',
      job_category_ids: [],
      selected_job_types: member.job_types || [],
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
      job_title: '',
      job_category_ids: [],
      selected_job_types: [],
      specialties: '',
    });
  };

  const handleJobTypeToggle = (jobTypeId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_job_types: checked
        ? [...prev.selected_job_types, jobTypeId]
        : prev.selected_job_types.filter(id => id !== jobTypeId),
    }));
  };

  const getJobTypesForCategory = (categoryId: string) => {
    return jobTypes.filter(jt => jt.category_id === categoryId);
  };

  const getJobTypeNameById = (id: string) => {
    const jobType = jobTypes.find(jt => jt.id === id);
    return jobType?.job_name || 'Unknown';
  };

  const handleConfigureCalendar = async (member: StaffMember) => {
    try {
      if (!member || !member.id) {
        console.error('Invalid staff member data:', member);
        toast.error('Error: Invalid staff member data. Please try again.');
        return;
      }
      setConfiguringCalendar(member);
    } catch (error) {
      console.error('Error configuring calendar:', error);
      toast.error(
        'An error occurred while opening calendar configuration. Please try again.'
      );
    }
  };

  const handleBackFromCalendar = () => {
    setConfiguringCalendar(null);
  };

  const handleSaveAndContinueCalendar = () => {
    setConfiguringCalendar(null);
    // Optionally trigger a callback to parent component
    toast.success('Calendar configuration saved successfully!');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading staff management...
          </p>
        </div>
      </div>
    );
  }

  if (!serviceTypeCode) {
    return (
      <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Business Type Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
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
                Add staff members by entering their job title and selecting from
                configured categories and job types.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Location Selector */}
              {businessLocations.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium dark:text-gray-300">
                    Location:
                  </Label>
                  <Select
                    value={selectedLocationId}
                    onValueChange={setSelectedLocationId}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessLocations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_name}
                          {location.is_primary && ' (Primary)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
          </div>
        </CardHeader>

        <CardContent className="dark:bg-gray-800">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Staff Members Added
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
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
              {filteredStaff.map(member => (
                <div
                  key={member.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {member.first_name} {member.last_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {member.title || 'No job title'}
                          </p>
                          {member.gender && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {member.gender}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Email
                          </p>
                          <p className="text-sm font-medium dark:text-gray-300">
                            {member.email || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Phone
                          </p>
                          <p className="text-sm font-medium dark:text-gray-300">
                            {member.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      {member.job_types && member.job_types.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Selected Job Types
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.job_types.map(jobTypeId => (
                              <span
                                key={jobTypeId}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-xs rounded-full text-blue-800 dark:text-blue-200"
                              >
                                {getJobTypeNameById(jobTypeId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {member.specialties && member.specialties.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Specialties
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs dark:text-gray-300 rounded-full"
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureCalendar(member)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Configure Calendar"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(member)}
                        title="Edit Staff Member"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Staff Member"
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
              Enter basic staff information including their job title.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 dark:bg-gray-800">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
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
                  <Label htmlFor="job-title">Job Title *</Label>
                  <Input
                    id="job-title"
                    value={formData.job_title}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        job_title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Dental Hygienist, Receptionist, Manager"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Job Category
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select from pre-configured categories for your business type (
                {serviceTypeCode}).
              </p>

              <div>
                <Label htmlFor="job-category">
                  Job Categories (Select Multiple)
                </Label>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {jobCategories.map(category => (
                    <div
                      key={category.id}
                      className="flex items-start space-x-2 py-2"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.job_category_ids.includes(
                          category.id
                        )}
                        onCheckedChange={checked => {
                          setFormData(prev => ({
                            ...prev,
                            job_category_ids: checked
                              ? [...prev.job_category_ids, category.id]
                              : prev.job_category_ids.filter(
                                  id => id !== category.id
                                ),
                            selected_job_types: [], // Reset job types when categories change
                          }));
                        }}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {category.category_name}
                        </label>
                        {category.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {jobCategories.length === 0 && (
                <div className="text-center py-6 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                    No categories available
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Please configure service categories in the Products &
                    Services step first.
                  </p>
                </div>
              )}
            </div>

            {/* Job Types Selection */}
            {formData.job_category_ids.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Select Job Types
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose specific job types this staff member can handle from
                  their selected categories.
                </p>

                {(() => {
                  const categoryJobTypes = formData.job_category_ids.reduce(
                    (allTypes, categoryId) => {
                      return [
                        ...allTypes,
                        ...getJobTypesForCategory(categoryId),
                      ];
                    },
                    [] as JobType[]
                  );

                  if (categoryJobTypes.length === 0) {
                    return (
                      <div className="text-center py-6 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No job types available for the selected categories.
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Configure job types in the Products & Services step
                          first.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      {formData.job_category_ids.map(categoryId => {
                        const category = jobCategories.find(
                          c => c.id === categoryId
                        );
                        const categoryTypes =
                          getJobTypesForCategory(categoryId);

                        if (categoryTypes.length === 0) return null;

                        return (
                          <div key={categoryId} className="space-y-2">
                            <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800 pb-1">
                              {category?.category_name}
                            </h5>
                            <div className="space-y-2">
                              {categoryTypes.map(jobType => (
                                <div
                                  key={jobType.id}
                                  className="flex items-start gap-3 pl-2"
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
                                      className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                                    >
                                      {jobType.job_name}
                                    </label>
                                    {jobType.job_description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {jobType.job_description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      <span>
                                        {jobType.default_duration_minutes} min
                                      </span>
                                      {jobType.default_price && (
                                        <span>${jobType.default_price}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
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
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                onClick={editingStaff ? handleUpdateStaff : handleAddStaff}
                disabled={
                  saving ||
                  !formData.first_name ||
                  !formData.last_name ||
                  !formData.job_title
                }
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

      {/* Calendar Configuration Modal */}
      <Dialog
        open={!!configuringCalendar}
        onOpenChange={open => {
          if (!open) {
            handleBackFromCalendar();
          }
        }}
      >
        <div className="w-[60vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-4">
          {/* Error Boundary for Calendar Configuration */}
          {configuringCalendar && (
            <>
              {(() => {
                try {
                  return (
                    <StaffCalendarConfiguration
                      user={user}
                      staffMember={configuringCalendar}
                      onBack={handleBackFromCalendar}
                      onSaveAndContinue={handleSaveAndContinueCalendar}
                      isStaffView={false}
                    />
                  );
                } catch (error) {
                  console.error(
                    'Error rendering calendar configuration:',
                    error
                  );
                  return (
                    <div className="p-8 text-center">
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                        Error Loading Calendar Configuration
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        There was an error loading the calendar configuration.
                        Please try again.
                      </p>
                      <Button onClick={handleBackFromCalendar}>Close</Button>
                    </div>
                  );
                }
              })()}
            </>
          )}
        </div>
      </Dialog>

      {/* Status Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Staff Management Status
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {staff.length > 0
                  ? `${staff.length} staff member${staff.length > 1 ? 's' : ''} added. The AI agent can now provide staff-specific information.`
                  : 'Add at least one staff member to help the AI agent provide accurate scheduling and availability information.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
