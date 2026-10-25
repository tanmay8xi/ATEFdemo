import {
  LayoutDashboard,
  Users,
  QrCode,
  AlertOctagon,
  RefreshCw,
  Package,
  Settings as SettingsIcon,
  Dumbbell,
} from 'lucide-react';

export type ScreenId =
  | 'dashboard'
  | 'members'
  | 'attendance'
  | 'redlist'
  | 'renewals'
  | 'addons'
  | 'settings';

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'attendance', label: 'Check-in', icon: QrCode },
  { id: 'redlist', label: 'No-Show List', icon: AlertOctagon },
  { id: 'renewals', label: 'Renewals', icon: RefreshCw },
  { id: 'addons', label: 'Add-ons', icon: Package },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const BRAND_ICON = Dumbbell;
export const BRAND_NAME = 'All Time Elite Fitness';
export const BRAND_SHORT = 'ATE Fitness';
