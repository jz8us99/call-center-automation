import React from 'react';
import {
  Phone,
  ArrowDown,
  ArrowUp,
  HelpCircle,
  Play,
  Pause,
  RefreshCw,
  LogOut,
  X,
  AlertCircle,
  Plus,
  Users,
  Search,
  Settings,
  Calendar,
  Edit,
  Trash,
  Home,
  ArrowLeft,
  DollarSign,
  Check,
  Building,
  Clock,
  User,
  CreditCard,
} from 'lucide-react';

export interface IconProps {
  className?: string;
  size?: number;
}

// Phone icon using Lucide
export const PhoneIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <Phone className={className} size={size} />;

// Arrow Down (Inbound) using Lucide
export const ArrowDownIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <ArrowDown className={className} size={size} />;

// Arrow Up (Outbound) using Lucide
export const ArrowUpIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <ArrowUp className={className} size={size} />;

// Question Mark using Lucide HelpCircle
export const QuestionMarkIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <HelpCircle className={className} size={size} />;

// Play icon using Lucide
export const PlayIcon: React.FC<IconProps> = ({
  className = 'h-3 w-3',
  size,
}) => <Play className={className} size={size} />;

// Pause icon using Lucide
export const PauseIcon: React.FC<IconProps> = ({
  className = 'h-3 w-3',
  size,
}) => <Pause className={className} size={size} />;

// Refresh icon using Lucide RefreshCw
export const RefreshIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <RefreshCw className={className} size={size} />;

// Sign out icon using Lucide LogOut
export const SignOutIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <LogOut className={className} size={size} />;

// Close icon using Lucide X
export const CloseIcon: React.FC<IconProps> = ({
  className = 'h-6 w-6',
  size,
}) => <X className={className} size={size} />;

// Alert icon using Lucide AlertCircle
export const AlertIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <AlertCircle className={className} size={size} />;

// Plus icon using Lucide
export const PlusIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Plus className={className} size={size} />;

// Users icon using Lucide
export const UsersIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Users className={className} size={size} />;

// Search icon using Lucide
export const SearchIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <Search className={className} size={size} />;

// Clear icon using Lucide X (same as Close)
export const ClearIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <X className={className} size={size} />;

// Settings icon using Lucide
export const SettingsIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Settings className={className} size={size} />;

// Calendar icon using Lucide
export const CalendarIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Calendar className={className} size={size} />;

// Edit icon using Lucide
export const EditIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <Edit className={className} size={size} />;

// Trash icon using Lucide
export const TrashIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <Trash className={className} size={size} />;

// Help icon using Lucide HelpCircle (same as QuestionMark)
export const HelpIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <HelpCircle className={className} size={size} />;

// Home icon using Lucide
export const HomeIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Home className={className} size={size} />;

// Arrow Left icon using Lucide
export const ArrowLeftIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <ArrowLeft className={className} size={size} />;

// Dollar Sign icon using Lucide
export const DollarSignIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <DollarSign className={className} size={size} />;

// Check icon using Lucide
export const CheckIcon: React.FC<IconProps> = ({
  className = 'h-4 w-4',
  size,
}) => <Check className={className} size={size} />;

// X icon using Lucide (same as Close and Clear)
export const XIcon: React.FC<IconProps> = ({ className = 'h-4 w-4', size }) => (
  <X className={className} size={size} />
);

// Building icon using Lucide
export const BuildingIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Building className={className} size={size} />;

// Clock icon using Lucide
export const ClockIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <Clock className={className} size={size} />;

// User icon using Lucide
export const UserIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <User className={className} size={size} />;

// Credit Card icon using Lucide
export const CreditCardIcon: React.FC<IconProps> = ({
  className = 'h-5 w-5',
  size,
}) => <CreditCard className={className} size={size} />;

// Call Type Icon Component
export interface CallTypeIconProps {
  direction?: 'inbound' | 'outbound';
  className?: string;
}

export const CallTypeIcon: React.FC<CallTypeIconProps> = ({
  direction,
  className = 'h-4 w-4',
}) => {
  if (direction === 'inbound') {
    return <ArrowDownIcon className={`${className} text-blue-600`} />;
  } else if (direction === 'outbound') {
    return <ArrowUpIcon className={`${className} text-green-600`} />;
  } else {
    return <QuestionMarkIcon className={`${className} text-gray-500`} />;
  }
};
