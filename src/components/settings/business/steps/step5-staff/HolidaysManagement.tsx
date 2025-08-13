'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthenticatedApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  CalendarIcon,
  PlusIcon,
  EditIcon,
  XIcon,
  CheckIcon,
} from '@/components/icons';

interface Holiday {
  id?: string;
  holiday_date: string;
  holiday_name: string;
  description?: string;
  is_recurring?: boolean;
}

interface HolidaysManagementProps {
  user: User;
  businessId: string;
  currentYear?: number;
}

export function HolidaysManagement({
  user,
  businessId,
  currentYear = new Date().getFullYear(),
}: HolidaysManagementProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Form state
  const [formData, setFormData] = useState({
    holiday_date: '',
    holiday_name: '',
    description: '',
    is_recurring: false,
  });

  useEffect(() => {
    loadHolidays();
  }, [user, businessId, selectedYear]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const response = await AuthenticatedApiClient.get(
        `/api/business/holidays?user_id=${user.id}&business_id=${businessId}&year=${selectedYear}`
      );

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error('Failed to load holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      holiday_date: '',
      holiday_name: '',
      description: '',
      is_recurring: false,
    });
    setEditingHoliday(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (holiday: Holiday) => {
    setFormData({
      holiday_date: holiday.holiday_date,
      holiday_name: holiday.holiday_name,
      description: holiday.description || '',
      is_recurring: holiday.is_recurring || false,
    });
    setEditingHoliday(holiday);
    setShowAddDialog(true);
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    resetForm();
  };

  const saveHoliday = async () => {
    try {
      if (!formData.holiday_date || !formData.holiday_name) {
        toast.error('Holiday date and name are required');
        return;
      }

      const method = editingHoliday ? 'PUT' : 'POST';
      const body: any = {
        user_id: user.id,
        business_id: businessId,
        ...formData,
      };

      if (editingHoliday) {
        body.id = editingHoliday.id;
      }

      const response = editingHoliday
        ? await AuthenticatedApiClient.put('/api/business/holidays', body)
        : await AuthenticatedApiClient.post('/api/business/holidays', body);

      if (response.ok) {
        await loadHolidays();
        closeDialog();
        toast.success(
          editingHoliday
            ? 'Holiday updated successfully!'
            : 'Holiday added successfully!'
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save holiday');
      }
    } catch (error) {
      console.error('Failed to save holiday:', error);
      toast.error('Failed to save holiday. Please try again.');
    }
  };

  const deleteHoliday = async (holiday: Holiday) => {
    if (
      !confirm(`Are you sure you want to delete "${holiday.holiday_name}"?`)
    ) {
      return;
    }

    try {
      const response = await AuthenticatedApiClient.delete(
        `/api/business/holidays?id=${holiday.id}&user_id=${user.id}`
      );

      if (response.ok) {
        await loadHolidays();
        toast.success('Holiday deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete holiday');
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error('Failed to delete holiday. Please try again.');
    }
  };

  // Comprehensive list of US national holidays and observances
  const getNationalHolidays = (year: number) => [
    {
      date: `${year}-01-01`,
      name: "New Year's Day",
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-01-15`,
      name: 'Martin Luther King Jr. Day',
      description: '3rd Monday in January',
      category: 'federal',
    },
    {
      date: `${year}-02-19`,
      name: "Presidents' Day",
      description: '3rd Monday in February',
      category: 'federal',
    },
    {
      date: `${year}-05-27`,
      name: 'Memorial Day',
      description: 'Last Monday in May',
      category: 'federal',
    },
    {
      date: `${year}-06-19`,
      name: 'Juneteenth',
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-07-04`,
      name: 'Independence Day',
      description: 'Fourth of July',
      category: 'federal',
    },
    {
      date: `${year}-09-02`,
      name: 'Labor Day',
      description: '1st Monday in September',
      category: 'federal',
    },
    {
      date: `${year}-10-14`,
      name: 'Columbus Day',
      description: '2nd Monday in October',
      category: 'federal',
    },
    {
      date: `${year}-11-11`,
      name: 'Veterans Day',
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-11-28`,
      name: 'Thanksgiving',
      description: '4th Thursday in November',
      category: 'federal',
    },
    {
      date: `${year}-11-29`,
      name: 'Black Friday',
      description: 'Day after Thanksgiving',
      category: 'common',
    },
    {
      date: `${year}-12-24`,
      name: 'Christmas Eve',
      description: 'Common business closure',
      category: 'common',
    },
    {
      date: `${year}-12-25`,
      name: 'Christmas Day',
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-12-31`,
      name: "New Year's Eve",
      description: 'Common business closure',
      category: 'common',
    },
  ];

  const [showNationalHolidaysDialog, setShowNationalHolidaysDialog] =
    useState(false);
  const [selectedNationalHolidays, setSelectedNationalHolidays] = useState<
    string[]
  >([]);
  const [savingNationalHolidays, setSavingNationalHolidays] = useState(false);

  const openNationalHolidaysDialog = () => {
    setSelectedNationalHolidays([]);
    setShowNationalHolidaysDialog(true);
  };

  const toggleNationalHoliday = (holidayDate: string) => {
    setSelectedNationalHolidays(prev =>
      prev.includes(holidayDate)
        ? prev.filter(date => date !== holidayDate)
        : [...prev, holidayDate]
    );
  };

  const saveNationalHolidays = async () => {
    if (selectedNationalHolidays.length === 0) {
      toast.error('Please select at least one holiday to add.');
      return;
    }

    setSavingNationalHolidays(true);
    try {
      const nationalHolidays = getNationalHolidays(selectedYear);
      let addedCount = 0;

      for (const holidayDate of selectedNationalHolidays) {
        const holiday = nationalHolidays.find(h => h.date === holidayDate);
        if (!holiday) continue;

        // Check if holiday already exists
        const exists = holidays.some(h => h.holiday_date === holiday.date);
        if (exists) continue;

        const response = await AuthenticatedApiClient.post(
          '/api/business/holidays',
          {
            user_id: user.id,
            business_id: businessId,
            holiday_date: holiday.date,
            holiday_name: holiday.name,
            description: holiday.description,
            is_recurring: holiday.category === 'federal',
          }
        );

        if (response.ok) {
          addedCount++;
        }
      }

      await loadHolidays();
      setShowNationalHolidaysDialog(false);
      toast.success(
        `Successfully added ${addedCount} holiday${addedCount !== 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Failed to add national holidays:', error);
      toast.error('Failed to add national holidays. Please try again.');
    } finally {
      setSavingNationalHolidays(false);
    }
  };

  const addQuickHolidays = async () => {
    const quickHolidays = [
      {
        date: `${selectedYear}-01-01`,
        name: "New Year's Day",
        description: 'Federal Holiday',
      },
      {
        date: `${selectedYear}-07-04`,
        name: 'Independence Day',
        description: 'Fourth of July',
      },
      {
        date: `${selectedYear}-11-28`,
        name: 'Thanksgiving',
        description: '4th Thursday in November',
      },
      {
        date: `${selectedYear}-12-25`,
        name: 'Christmas Day',
        description: 'Federal Holiday',
      },
    ];

    try {
      let addedCount = 0;
      for (const holiday of quickHolidays) {
        // Check if holiday already exists
        const exists = holidays.some(h => h.holiday_date === holiday.date);
        if (exists) continue;

        const response = await AuthenticatedApiClient.post(
          '/api/business/holidays',
          {
            user_id: user.id,
            business_id: businessId,
            holiday_date: holiday.date,
            holiday_name: holiday.name,
            description: holiday.description,
            is_recurring: true,
          }
        );

        if (response.ok) {
          addedCount++;
        }
      }

      await loadHolidays();
      toast.success(
        `Added ${addedCount} common holiday${addedCount !== 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Failed to add common holidays:', error);
      toast.error('Failed to add common holidays. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  if (loading) {
    return (
      <Card className="dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading holidays...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Business Holidays
              </CardTitle>
              <CardDescription>
                Manage holidays and office closures for {selectedYear}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-24"
                min="2020"
                max="2030"
              />
              <Button variant="outline" onClick={openNationalHolidaysDialog}>
                Select National Holidays
              </Button>
              <Button variant="outline" onClick={addQuickHolidays}>
                Add Common Holidays
              </Button>
              <Button onClick={openAddDialog}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Custom Holiday
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No holidays configured for {selectedYear}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add holidays to let staff and customers know when you're closed
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={openNationalHolidaysDialog}>
                  Select National Holidays
                </Button>
                <Button variant="outline" onClick={addQuickHolidays}>
                  Add Common Holidays
                </Button>
                <Button variant="outline" onClick={openAddDialog}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Custom Holiday
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {holidays.map(holiday => (
                <div
                  key={holiday.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {holiday.holiday_name}
                        </h3>
                        {holiday.is_recurring && (
                          <Badge variant="secondary">Recurring</Badge>
                        )}
                        {isUpcoming(holiday.holiday_date) && (
                          <Badge className="bg-green-100 text-green-800">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {formatDate(holiday.holiday_date)}
                      </p>
                      {holiday.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {holiday.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(holiday)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteHoliday(holiday)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Holiday Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
            </DialogTitle>
            <DialogDescription>
              {editingHoliday
                ? 'Update the holiday information'
                : 'Add a new holiday or office closure date'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="holiday_name">Holiday Name *</Label>
              <Input
                id="holiday_name"
                value={formData.holiday_name}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    holiday_name: e.target.value,
                  }))
                }
                placeholder="e.g., Christmas Day"
              />
            </div>

            <div>
              <Label htmlFor="holiday_date">Date *</Label>
              <Input
                id="holiday_date"
                type="date"
                value={formData.holiday_date}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    holiday_date: e.target.value,
                  }))
                }
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
                placeholder="Optional description or notes"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_recurring: checked }))
                }
              />
              <Label htmlFor="is_recurring">Recurring annually</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={saveHoliday} className="flex-1">
                <CheckIcon className="h-4 w-4 mr-2" />
                {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
              </Button>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* National Holidays Selection Dialog */}
      <Dialog
        open={showNationalHolidaysDialog}
        onOpenChange={setShowNationalHolidaysDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Select National Holidays for {selectedYear}
            </DialogTitle>
            <DialogDescription>
              Choose from federal holidays and common business closures to add
              to your calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    {selectedNationalHolidays.length} holiday
                    {selectedNationalHolidays.length !== 1 ? 's' : ''} selected
                  </h4>
                  <p className="text-sm text-blue-700">
                    Select multiple holidays and save them all at once
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allHolidays = getNationalHolidays(selectedYear);
                      setSelectedNationalHolidays(allHolidays.map(h => h.date));
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedNationalHolidays([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            {/* Federal Holidays */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                🇺🇸 Federal Holidays
                <Badge variant="secondary">Official US holidays</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getNationalHolidays(selectedYear)
                  .filter(holiday => holiday.category === 'federal')
                  .map(holiday => {
                    const isExisting = holidays.some(
                      h => h.holiday_date === holiday.date
                    );
                    const isSelected = selectedNationalHolidays.includes(
                      holiday.date
                    );

                    return (
                      <div
                        key={holiday.date}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isExisting
                            ? 'bg-gray-50 border-gray-200'
                            : isSelected
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={holiday.date}
                          checked={isSelected}
                          disabled={isExisting}
                          onCheckedChange={() =>
                            !isExisting && toggleNationalHoliday(holiday.date)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={holiday.date}
                              className={`font-medium ${isExisting ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                            >
                              {holiday.name}
                            </Label>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(holiday.date).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isExisting ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {holiday.description}
                            {isExisting && ' (Already added)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Common Business Closures */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                🏢 Common Business Closures
                <Badge variant="outline">Optional closures</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getNationalHolidays(selectedYear)
                  .filter(holiday => holiday.category === 'common')
                  .map(holiday => {
                    const isExisting = holidays.some(
                      h => h.holiday_date === holiday.date
                    );
                    const isSelected = selectedNationalHolidays.includes(
                      holiday.date
                    );

                    return (
                      <div
                        key={holiday.date}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isExisting
                            ? 'bg-gray-50 border-gray-200'
                            : isSelected
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={holiday.date}
                          checked={isSelected}
                          disabled={isExisting}
                          onCheckedChange={() =>
                            !isExisting && toggleNationalHoliday(holiday.date)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={holiday.date}
                              className={`font-medium ${isExisting ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                            >
                              {holiday.name}
                            </Label>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(holiday.date).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isExisting ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {holiday.description}
                            {isExisting && ' (Already added)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={saveNationalHolidays}
                disabled={
                  selectedNationalHolidays.length === 0 ||
                  savingNationalHolidays
                }
                className="flex-1"
              >
                {savingNationalHolidays ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Add Selected Holidays ({selectedNationalHolidays.length})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNationalHolidaysDialog(false)}
                disabled={savingNationalHolidays}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </>
  );
}
