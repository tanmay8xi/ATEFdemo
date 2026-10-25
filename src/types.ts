export type MembershipStatus =
  | 'active'
  | 'expired'
  | 'frozen'
  | 'paused'
  | 'cancelled';

export type FollowUpOutcome =
  | 'will_return'
  | 'injured'
  | 'travelling'
  | 'timing_issue'
  | 'unhappy'
  | 'no_response'
  | 'cancelled';

export interface FollowUpEvent {
  id: string;
  date: string; // ISO
  outcome: FollowUpOutcome;
  note: string;
  staff: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // ISO date (YYYY-MM-DD)
  method: 'qr' | 'manual';
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  planMonths: 1 | 3 | 6 | 12;
  startDate: string; // ISO date
  expiryDate: string; // ISO date
  status: MembershipStatus;
  basePrice: number; // INR
  paidAmount: number;
  avatarHue: number; // 0-360 for generated avatar
  addOns: string[]; // ids of add-on services
  followUps: FollowUpEvent[];
  nextActionDate?: string; // ISO date
}

export interface AddOnService {
  id: string;
  name: string;
  category: 'personal_training' | 'nutrition' | 'product';
  price: number; // INR
  durationLabel: string;
  available: boolean;
  terms: string;
  description: string;
}

export interface RenewalRecord {
  memberId: string;
  planMonths: 3 | 6 | 12;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  initiatedAt: string; // ISO
}

export interface Settings {
  inactivityThresholdDays: number;
  weeklyAttendanceGoal: number;
  currency: 'INR';
}

export interface AppData {
  members: Member[];
  attendance: AttendanceRecord[];
  addOns: AddOnService[];
  renewals: RenewalRecord[];
  settings: Settings;
  version: number;
}
