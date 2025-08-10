import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';

export interface UserOption {
  id: string;
  user_id: string | null;
  email: string;
  full_name?: string;
  business_name?: string;
}

interface UserSelectorProps {
  selectedUserId?: string;
  onUserSelect: (userId?: string) => void;
  disabled?: boolean;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUserId,
  onUserSelect,
  disabled = false,
  className = '',
}) => {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load users from admin API
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('No authentication token available');
        return;
      }

      // Load all users for search, but initially show only first 4
      const response = await fetch('/api/admin/users?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      // Only include users with valid user_id (auth users)
      const userList = (data.users || []).filter(
        (user: UserOption) => user.user_id
      );
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial users
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm === '') {
      // When no search term, only show first 4 users
      setFilteredUsers(users.slice(0, 4));
    } else {
      // When search term exists, show all matching users
      const filtered = users.filter(
        user =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.full_name &&
            user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.business_name &&
            user.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Find selected user
  const selectedUser = users.find(user => user.user_id === selectedUserId);

  // Get display text for selected user
  const getDisplayText = (user?: UserOption) => {
    if (!user) return 'All Users';
    return `${user.full_name || user.email} (${user.business_name || user.email})`;
  };

  // Handle user selection
  const handleSelect = (userId?: string) => {
    onUserSelect(userId);
    setOpen(false);
    setSearchTerm('');
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs text-gray-700 dark:text-gray-300">User</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 text-xs justify-between w-full"
            disabled={disabled}
          >
            <span className="truncate">{getDisplayText(selectedUser)}</span>
            <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2">
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-7 text-xs pl-7"
              />
            </div>

            {/* User List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-2 text-center text-xs text-gray-500">
                  Loading users...
                </div>
              ) : (
                <div className="space-y-1">
                  {/* All Users option */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2 text-xs"
                    onClick={() => handleSelect(undefined)}
                  >
                    <Check
                      className={`mr-2 h-3 w-3 ${
                        !selectedUserId ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>All Users</span>
                    </div>
                  </Button>

                  {/* Individual users */}
                  {filteredUsers.length === 0 && searchTerm !== '' ? (
                    <div className="p-2 text-center text-xs text-gray-500">
                      No users found.
                    </div>
                  ) : (
                    <>
                      {searchTerm === '' && users.length > 4 && (
                        <div className="p-2 text-center text-xs text-gray-500 italic border-b border-gray-200">
                          Showing first 4 users. Type to search more...
                        </div>
                      )}
                      {filteredUsers.map(user => (
                        <Button
                          key={user.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-auto p-2 text-xs"
                          onClick={() =>
                            handleSelect(user.user_id || undefined)
                          }
                        >
                          <Check
                            className={`mr-2 h-3 w-3 ${
                              selectedUserId === user.user_id
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                          />
                          <div className="flex flex-col items-start w-full">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span className="font-medium">
                                {user.full_name || user.email}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 ml-5">
                              {user.business_name && (
                                <span>{user.business_name} • </span>
                              )}
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
