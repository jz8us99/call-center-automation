import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent } from './ui/card';
import { DateTimePicker } from './ui/date-time-picker';

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
  userId: string;
}

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  is_super_admin: boolean;
}

export interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  isAdmin?: boolean;
  users?: User[];
}

export const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({
  onSearch,
  loading = false,
  isAdmin = false,
  users = [],
}) => {
  // Internal search filters state
  const [searchFilters, setSearchFilters] = useState<InternalSearchFilters>({
    startTimeFromDate: undefined,
    startTimeToDate: undefined,
    type: 'all',
    phoneNumber: '',
    userId: 'all',
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
  const handleFilterChange = (
    field: 'type' | 'phoneNumber' | 'userId',
    value: string
  ) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value,
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
      userId: internal.userId === 'all' ? undefined : internal.userId,
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
      userId: 'all',
    };
    setSearchFilters(clearedFilters);
    onSearch(convertToExternalFormat(clearedFilters));
  };

  return (
    <Card className="bg-gray-50 mb-6">
      <CardContent className="p-4">
        <div
          className={`grid grid-cols-1 gap-3 items-end ${isAdmin ? 'md:grid-cols-7' : 'md:grid-cols-6'}`}
        >
          {/* Start Time From Filter */}
          <div className="space-y-1">
            <Label className="text-xs">Start Time From</Label>
            <DateTimePicker
              value={searchFilters.startTimeFromDate}
              onChange={date => handleDateChange('startTimeFromDate', date)}
              placeholder="Select start time"
              disabled={loading}
              className="h-8 text-xs"
            />
          </div>

          {/* Start Time To Filter */}
          <div className="space-y-1">
            <Label className="text-xs">Start Time To</Label>
            <DateTimePicker
              value={searchFilters.startTimeToDate}
              onChange={date => handleDateChange('startTimeToDate', date)}
              placeholder="Select end time"
              disabled={loading}
              className="h-8 text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select
              value={searchFilters.type}
              onValueChange={value => handleFilterChange('type', value)}
              disabled={loading}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Filter */}
          <div className="space-y-1">
            <Label htmlFor="phone-number" className="text-xs">
              Phone Number
            </Label>
            <Input
              id="phone-number"
              type="text"
              placeholder="Enter phone number"
              value={searchFilters.phoneNumber}
              onChange={e => handleFilterChange('phoneNumber', e.target.value)}
              className="h-8 text-xs"
              disabled={loading}
            />
          </div>

          {/* User Filter (Admin only) */}
          {isAdmin && (
            <div className="space-y-1">
              <Label className="text-xs">User</Label>
              <Select
                value={searchFilters.userId}
                onValueChange={value => handleFilterChange('userId', value)}
                disabled={loading}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{user.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              Search
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 h-8 px-2 text-xs"
              disabled={loading}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
