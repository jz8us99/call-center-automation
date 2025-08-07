// Role-Based Access Control (RBAC) Utility
// This module handles permission checking and role management

export interface UserRole {
  role_code: string;
  role_name: string;
  description: string;
  permissions: {
    manage_staff: boolean;
    configure_jobs: boolean;
    configure_business: boolean;
    delete_business: boolean;
    transfer_ownership: boolean;
    assign_roles: boolean;
    manage_office_hours: boolean;
    edit_own_calendar: boolean;
    edit_staff_calendars: boolean;
    book_appointments: boolean;
  };
  hierarchy_level: number;
}

export interface StaffMember {
  id: string;
  user_id: string;
  auth_user_id?: string;
  role_code: string;
  job_title_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  employment_status: string;
  is_active: boolean;
  role?: UserRole;
  job_title?: {
    id: string;
    title_name: string;
    description?: string;
  };
}

// Default roles configuration
export const DEFAULT_ROLES: UserRole[] = [
  {
    role_code: 'owner',
    role_name: 'Owner',
    description:
      'Full control including business deletion and ownership transfer',
    permissions: {
      manage_staff: true,
      configure_jobs: true,
      configure_business: true,
      delete_business: true,
      transfer_ownership: true,
      assign_roles: true,
      manage_office_hours: true,
      edit_own_calendar: true,
      edit_staff_calendars: true,
      book_appointments: true,
    },
    hierarchy_level: 1,
  },
  {
    role_code: 'admin',
    role_name: 'Admin',
    description:
      'Can manage staff and configure settings but cannot delete business',
    permissions: {
      manage_staff: true,
      configure_jobs: true,
      configure_business: true,
      delete_business: false,
      transfer_ownership: false,
      assign_roles: true,
      manage_office_hours: true,
      edit_own_calendar: true,
      edit_staff_calendars: true,
      book_appointments: true,
    },
    hierarchy_level: 2,
  },
  {
    role_code: 'staff',
    role_name: 'Staff',
    description: 'Can view own schedule and assigned job types only',
    permissions: {
      manage_staff: false,
      configure_jobs: false,
      configure_business: false,
      delete_business: false,
      transfer_ownership: false,
      assign_roles: false,
      manage_office_hours: false,
      edit_own_calendar: true,
      edit_staff_calendars: false,
      book_appointments: true,
    },
    hierarchy_level: 3,
  },
  {
    role_code: 'viewer',
    role_name: 'Viewer',
    description: 'Read-only access to business and appointment information',
    permissions: {
      manage_staff: false,
      configure_jobs: false,
      configure_business: false,
      delete_business: false,
      transfer_ownership: false,
      assign_roles: false,
      manage_office_hours: false,
      edit_own_calendar: false,
      edit_staff_calendars: false,
      book_appointments: false,
    },
    hierarchy_level: 4,
  },
];

// Permission checking functions
export class RBACManager {
  private userRole: UserRole | null = null;
  private staffMember: StaffMember | null = null;

  constructor(staffMember?: StaffMember) {
    if (staffMember) {
      this.setStaffMember(staffMember);
    }
  }

  setStaffMember(staffMember: StaffMember) {
    this.staffMember = staffMember;
    this.userRole =
      staffMember.role ||
      DEFAULT_ROLES.find(r => r.role_code === staffMember.role_code) ||
      null;
  }

  // Check if user has a specific permission
  hasPermission(permission: keyof UserRole['permissions']): boolean {
    if (!this.userRole) return false;
    return this.userRole.permissions[permission];
  }

  // Check if user can manage other staff members
  canManageStaff(): boolean {
    return this.hasPermission('manage_staff');
  }

  // Check if user can configure job types
  canConfigureJobs(): boolean {
    return this.hasPermission('configure_jobs');
  }

  // Check if user can configure business settings
  canConfigureBusiness(): boolean {
    return this.hasPermission('configure_business');
  }

  // Check if user can delete the business
  canDeleteBusiness(): boolean {
    return this.hasPermission('delete_business');
  }

  // Check if user can transfer ownership
  canTransferOwnership(): boolean {
    return this.hasPermission('transfer_ownership');
  }

  // Check if user can assign roles to other staff
  canAssignRoles(): boolean {
    return this.hasPermission('assign_roles');
  }

  // Check if user can assign a specific role to another staff member
  canAssignRole(targetRoleCode: string): boolean {
    if (!this.canAssignRoles()) return false;
    if (!this.userRole) return false;

    const targetRole = DEFAULT_ROLES.find(r => r.role_code === targetRoleCode);
    if (!targetRole) return false;

    // Users can only assign roles at their level or below
    return this.userRole.hierarchy_level <= targetRole.hierarchy_level;
  }

  // Check if user can edit another staff member
  canEditStaffMember(targetStaffId: string): boolean {
    if (!this.staffMember) return false;

    // Users can always edit themselves
    if (this.staffMember.id === targetStaffId) return true;

    // Otherwise, need manage_staff permission
    return this.canManageStaff();
  }

  // Check if user can view staff details
  canViewStaffMember(targetStaffId: string): boolean {
    if (!this.staffMember) return false;

    // Users can always view themselves
    if (this.staffMember.id === targetStaffId) return true;

    // Viewers and above can see all staff
    return (
      this.userRole?.hierarchy_level !== undefined &&
      this.userRole.hierarchy_level <= 4
    );
  }

  // Get user's role information
  getRole(): UserRole | null {
    return this.userRole;
  }

  // Get role display name
  getRoleDisplayName(): string {
    return this.userRole?.role_name || 'Unknown';
  }

  // Check if user is owner
  isOwner(): boolean {
    return this.userRole?.role_code === 'owner';
  }

  // Check if user is admin or owner
  isAdminOrOwner(): boolean {
    return (
      this.userRole?.role_code === 'admin' ||
      this.userRole?.role_code === 'owner'
    );
  }

  // Check if user is staff level
  isStaff(): boolean {
    return this.userRole?.role_code === 'staff';
  }

  // Check if user is viewer
  isViewer(): boolean {
    return this.userRole?.role_code === 'viewer';
  }

  // Get available roles that this user can assign
  getAssignableRoles(): UserRole[] {
    if (!this.canAssignRoles() || !this.userRole) return [];

    return DEFAULT_ROLES.filter(
      role => this.userRole!.hierarchy_level <= role.hierarchy_level
    );
  }
}

// Helper function to create RBAC manager from current user context
export function createRBACManager(staffMember?: StaffMember): RBACManager {
  return new RBACManager(staffMember);
}

// Helper function to check if a role code is valid
export function isValidRoleCode(roleCode: string): boolean {
  return DEFAULT_ROLES.some(role => role.role_code === roleCode);
}

// Helper function to get role by code
export function getRoleByCode(roleCode: string): UserRole | undefined {
  return DEFAULT_ROLES.find(role => role.role_code === roleCode);
}
