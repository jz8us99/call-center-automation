import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { UserSelector } from '@/components/tables/UserSelector';
import { useTranslations } from 'next-intl';

export interface SearchFilters {
  startTimeFrom?: string;
  startTimeTo?: string;
  type?: 'inbound' | 'outbound' | 'all';
  phoneNumber?: string;
  userId?: string;
}

interface InternalSearchFilters {
  startTimeFromDate?: Date;
  startTimeToDate?: Date;
  type: 'inbound' | 'outbound' | 'all';
  phoneNumber: string;
  userId?: string;
}

export interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  showUserSelector?: boolean;
}

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  onSearch,
  loading = false,
  showUserSelector = false,
}) => {
  const t = useTranslations('searchFilters');

  // Internal search filters state
  const [searchFilters, setSearchFilters] = useState<InternalSearchFilters>({
    startTimeFromDate: undefined,
    startTimeToDate: undefined,
    type: 'all',
    phoneNumber: '',
    userId: undefined,
  });

  // Handle date changes
  const handleDateChange = (
    field: 'startTimeFromDate' | 'startTimeToDate',
    date: Date | undefined
  ) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: date,
    }));
  };

  // Handle other filter changes
  const handleFilterChange = (field: 'type' | 'phoneNumber', value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle user selection change
  const handleUserSelect = (userId?: string) => {
    setSearchFilters(prev => ({
      ...prev,
      userId,
    }));
  };

  // Convert internal state to external format
  const convertToExternalFormat = (
    internal: InternalSearchFilters
  ): SearchFilters => {
    return {
      startTimeFrom: internal.startTimeFromDate?.toISOString(),
      startTimeTo: internal.startTimeToDate?.toISOString(),
      type: internal.type,
      phoneNumber: internal.phoneNumber,
      userId: internal.userId,
    };
  };

  // Handle search submit
  const handleSearch = () => {
    onSearch(convertToExternalFormat(searchFilters));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const clearedFilters: InternalSearchFilters = {
      startTimeFromDate: undefined,
      startTimeToDate: undefined,
      type: 'all',
      phoneNumber: '',
      userId: undefined,
    };
    setSearchFilters(clearedFilters);
    onSearch(convertToExternalFormat(clearedFilters));
  };

  return (
    <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
      <CardContent className="p-4">
        <div
          className={`grid grid-cols-1 gap-3 items-end ${
            showUserSelector ? 'md:grid-cols-7' : 'md:grid-cols-6'
          }`}
        >
          {/* Start Time From Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-700 dark:text-gray-300">
              {t('startTimeFrom')}
            </Label>
            <DateTimePicker
              value={searchFilters.startTimeFromDate}
              onChange={date => handleDateChange('startTimeFromDate', date)}
              placeholder={t('selectStartTime')}
              disabled={loading}
              className="h-8 text-xs"
            />
          </div>

          {/* Start Time To Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-700 dark:text-gray-300">
              {t('startTimeTo')}
            </Label>
            <DateTimePicker
              value={searchFilters.startTimeToDate}
              onChange={date => handleDateChange('startTimeToDate', date)}
              placeholder={t('selectEndTime')}
              disabled={loading}
              className="h-8 text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-700 dark:text-gray-300">
              {t('type')}
            </Label>
            <Select
              value={searchFilters.type}
              onValueChange={value => handleFilterChange('type', value)}
              disabled={loading}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="inbound">{t('inbound')}</SelectItem>
                <SelectItem value="outbound">{t('outbound')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Filter */}
          <div className="space-y-1">
            <Label
              htmlFor="phone-number"
              className="text-xs text-gray-700 dark:text-gray-300"
            >
              {t('phoneNumber')}
            </Label>
            <Input
              id="phone-number"
              type="text"
              placeholder={t('enterPhoneNumber')}
              value={searchFilters.phoneNumber}
              onChange={e => handleFilterChange('phoneNumber', e.target.value)}
              className="h-8 text-xs"
              disabled={loading}
            />
          </div>

          {/* User Selector - Only for Admin */}
          {showUserSelector && (
            <UserSelector
              selectedUserId={searchFilters.userId}
              onUserSelect={handleUserSelect}
              disabled={loading}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 col-span-2">
            <Button
              onClick={handleSearch}
              size="sm"
              className="flex items-center gap-1 h-8 px-2 text-xs"
              disabled={loading}
            >
              <Search className="h-3 w-3" />
              {t('search')}
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 h-8 px-2 text-xs"
              disabled={loading}
            >
              <X className="h-3 w-3" />
              {t('clear')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
