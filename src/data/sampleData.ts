import type {
  AddOnService,
  AppData,
  AttendanceRecord,
  Member,
  RenewalRecord,
  Settings,
} from '@/types';

// Use a fixed "today" so demo metrics are deterministic & comparable across reloads.
// In production this would be real time. Here we anchor to the build date.
export const DEMO_TODAY = new Date('2026-10-24T09:30:00+05:30');

const STAFF = ['Ravi (Manager)', 'Sneha (Front desk)', 'Demo Owner'];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / 86400000);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function relativeDays(iso: string, from: Date = DEMO_TODAY): string {
  const diff = daysBetween(from, new Date(iso));
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

let _id = 0;
const uid = (prefix: string) => `${prefix}_${(_id++).toString(36)}`;

// Fictional members. Names, phones, emails are entirely invented.
const MEMBER_SEED: Array<
  Omit<Member, 'id' | 'avatarHue' | 'addOns' | 'followUps' | 'nextActionDate'> & {
    attendancePattern: number[]; // days-ago offsets for visits
    addOns?: string[];
    followUps?: Member['followUps'];
    nextActionDate?: string;
  }
> = [
  {
    firstName: 'Arjun',
    lastName: 'Mehta',
    phone: '+91 98200 11223',
    email: 'arjun.mehta@example-demo.in',
    planMonths: 12,
    startDate: isoDate(addDays(DEMO_TODAY, -180)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 185)),
    status: 'active',
    basePrice: 18000,
    paidAmount: 18000,
    attendancePattern: [0, 1, 3, 5, 7],
    addOns: ['pt_strength'],
  },
  {
    firstName: 'Priya',
    lastName: 'Nair',
    phone: '+91 99400 88776',
    email: 'priya.nair@example-demo.in',
    planMonths: 6,
    startDate: isoDate(addDays(DEMO_TODAY, -90)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 91)),
    status: 'active',
    basePrice: 11000,
    paidAmount: 11000,
    attendancePattern: [0, 2, 4],
  },
  {
    firstName: 'Vikram',
    lastName: 'Rao',
    phone: '+91 90040 55667',
    email: 'vikram.rao@example-demo.in',
    planMonths: 3,
    startDate: isoDate(addDays(DEMO_TODAY, -45)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 44)),
    status: 'active',
    basePrice: 6500,
    paidAmount: 6500,
    attendancePattern: [1, 3, 6],
    addOns: ['nutrition_plan'],
  },
  {
    firstName: 'Deepa',
    lastName: 'Sharma',
    phone: '+91 98700 33442',
    email: 'deepa.sharma@example-demo.in',
    planMonths: 6,
    startDate: isoDate(addDays(DEMO_TODAY, -120)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 12)),
    status: 'active',
    basePrice: 11000,
    paidAmount: 11000,
    attendancePattern: [12, 15, 18],
    followUps: [
      {
        id: uid('fu'),
        date: isoDate(addDays(DEMO_TODAY, -2)),
        outcome: 'no_response',
        note: 'Called, no answer. Sent a reminder.',
        staff: STAFF[1],
      },
    ],
    nextActionDate: isoDate(addDays(DEMO_TODAY, 1)),
  },
  {
    firstName: 'Rahul',
    lastName: 'Gupta',
    phone: '+91 91200 77889',
    email: 'rahul.gupta@example-demo.in',
    planMonths: 3,
    startDate: isoDate(addDays(DEMO_TODAY, -30)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 4)),
    status: 'active',
    basePrice: 6500,
    paidAmount: 6500,
    attendancePattern: [0, 2, 5, 9],
  },
  {
    firstName: 'Sneha',
    lastName: 'Iyer',
    phone: '+91 98300 22331',
    email: 'sneha.iyer@example-demo.in',
    planMonths: 12,
    startDate: isoDate(addDays(DEMO_TODAY, -200)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 165)),
    status: 'active',
    basePrice: 18000,
    paidAmount: 18000,
    attendancePattern: [0, 1, 4],
    addOns: ['pt_strength', 'protein_jar'],
  },
  {
    firstName: 'Karan',
    lastName: 'Singh',
    phone: '+91 90900 44556',
    email: 'karan.singh@example-demo.in',
    planMonths: 6,
    startDate: isoDate(addDays(DEMO_TODAY, -75)),
    expiryDate: isoDate(addDays(DEMO_TODAY, -3)),
    status: 'expired',
    basePrice: 11000,
    paidAmount: 11000,
    attendancePattern: [0, 3, 6, 12, 20],
    followUps: [
      {
        id: uid('fu'),
        date: isoDate(addDays(DEMO_TODAY, -4)),
        outcome: 'will_return',
        note: 'Will renew next week after salary credit.',
        staff: STAFF[0],
      },
    ],
    nextActionDate: isoDate(addDays(DEMO_TODAY, 4)),
  },
  {
    firstName: 'Anita',
    lastName: 'Desai',
    phone: '+91 99600 11290',
    email: 'anita.desai@example-demo.in',
    planMonths: 3,
    startDate: isoDate(addDays(DEMO_TODAY, -60)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 29)),
    status: 'frozen',
    basePrice: 6500,
    paidAmount: 6500,
    attendancePattern: [25, 30, 40],
    followUps: [
      {
        id: uid('fu'),
        date: isoDate(addDays(DEMO_TODAY, -8)),
        outcome: 'injured',
        note: 'Knee injury. Membership frozen for 3 weeks.',
        staff: STAFF[0],
      },
    ],
  },
  {
    firstName: 'Rohit',
    lastName: 'Verma',
    phone: '+91 97400 55661',
    email: 'rohit.verma@example-demo.in',
    planMonths: 6,
    startDate: isoDate(addDays(DEMO_TODAY, -95)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 85)),
    status: 'active',
    basePrice: 11000,
    paidAmount: 11000,
    attendancePattern: [14, 17, 21, 28],
    followUps: [
      {
        id: uid('fu'),
        date: isoDate(addDays(DEMO_TODAY, -1)),
        outcome: 'timing_issue',
        note: 'Work hours changed. Considering early-morning slot.',
        staff: STAFF[1],
      },
    ],
    nextActionDate: isoDate(addDays(DEMO_TODAY, 3)),
  },
  {
    firstName: 'Meera',
    lastName: 'Kapoor',
    phone: '+91 98100 99882',
    email: 'meera.kapoor@example-demo.in',
    planMonths: 12,
    startDate: isoDate(addDays(DEMO_TODAY, -150)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 215)),
    status: 'active',
    basePrice: 18000,
    paidAmount: 18000,
    attendancePattern: [0, 2, 5, 8],
    addOns: ['protein_jar'],
  },
  {
    firstName: 'Sahil',
    lastName: 'Khan',
    phone: '+91 96600 33412',
    email: 'sahil.khan@example-demo.in',
    planMonths: 3,
    startDate: isoDate(addDays(DEMO_TODAY, -40)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 49)),
    status: 'active',
    basePrice: 6500,
    paidAmount: 6500,
    attendancePattern: [0, 1, 4, 7, 10],
  },
  {
    firstName: 'Pooja',
    lastName: 'Reddy',
    phone: '+91 99000 77654',
    email: 'pooja.reddy@example-demo.in',
    planMonths: 6,
    startDate: isoDate(addDays(DEMO_TODAY, -110)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 70)),
    status: 'paused',
    basePrice: 11000,
    paidAmount: 11000,
    attendancePattern: [35, 50, 65],
    followUps: [
      {
        id: uid('fu'),
        date: isoDate(addDays(DEMO_TODAY, -15)),
        outcome: 'travelling',
        note: 'Out of country for a month. Paused membership.',
        staff: STAFF[0],
      },
    ],
  },
  {
    firstName: 'Aditya',
    lastName: 'Joshi',
    phone: '+91 91300 22001',
    email: 'aditya.joshi@example-demo.in',
    planMonths: 3,
    startDate: isoDate(addDays(DEMO_TODAY, -70)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 20)),
    status: 'active',
    basePrice: 6500,
    paidAmount: 6500,
    attendancePattern: [11, 13, 16, 19, 22],
    followUps: [
      {
        id: uid('fu'),
        date: isoDate(addDays(DEMO_TODAY, -1)),
        outcome: 'no_response',
        note: 'No response to two calls.',
        staff: STAFF[1],
      },
    ],
    nextActionDate: isoDate(addDays(DEMO_TODAY, 2)),
  },
  {
    firstName: 'Nisha',
    lastName: 'Bose',
    phone: '+91 98400 66571',
    email: 'nisha.bose@example-demo.in',
    planMonths: 6,
    startDate: isoDate(addDays(DEMO_TODAY, -50)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 132)),
    status: 'active',
    basePrice: 11000,
    paidAmount: 11000,
    attendancePattern: [0, 3, 6],
    addOns: ['nutrition_plan'],
  },
  {
    firstName: 'Tarun',
    lastName: 'Malhotra',
    phone: '+91 91700 44883',
    email: 'tarun.malhotra@example-demo.in',
    planMonths: 12,
    startDate: isoDate(addDays(DEMO_TODAY, -170)),
    expiryDate: isoDate(addDays(DEMO_TODAY, -5)),
    status: 'expired',
    basePrice: 18000,
    paidAmount: 18000,
    attendancePattern: [6, 12, 18, 30, 50],
  },
  {
    firstName: 'Riya',
    lastName: 'Chopra',
    phone: '+91 99800 11209',
    email: 'riya.chopra@example-demo.in',
    planMonths: 3,
    startDate: isoDate(addDays(DEMO_TODAY, -35)),
    expiryDate: isoDate(addDays(DEMO_TODAY, 55)),
    status: 'active',
    basePrice: 6500,
    paidAmount: 6500,
    attendancePattern: [0, 1, 3, 5, 8, 11],
  },
];

const ADD_ONS: AddOnService[] = [
  {
    id: 'pt_strength',
    name: 'Personal Training — Strength',
    category: 'personal_training',
    price: 6000,
    durationLabel: '12 sessions / month',
    available: true,
    terms: 'Sessions expire 30 days from purchase. Non-transferable. Reschedule 12h in advance.',
    description:
      'One-on-one coaching with a certified strength coach. Progressive overload programming tailored to your goals.',
  },
  {
    id: 'pt_transformation',
    name: 'Personal Training — Transformation',
    category: 'personal_training',
    price: 9000,
    durationLabel: '16 sessions / month',
    available: true,
    terms: '12-week commitment. Sessions expire 30 days from purchase. Non-transferable.',
    description:
      'Intensive 12-week transformation package combining strength, conditioning and accountability check-ins.',
  },
  {
    id: 'nutrition_plan',
    name: 'Nutrition Consultation',
    category: 'nutrition',
    price: 2500,
    durationLabel: '2 sessions + plan',
    available: true,
    terms: 'Includes one follow-up. Plan is general guidance, not a medical prescription.',
    description:
      'Consultation with a sports nutrition advisor to build a sustainable eating plan around your training.',
  },
  {
    id: 'protein_jar',
    name: 'Whey Protein — 1kg',
    category: 'product',
    price: 2200,
    durationLabel: 'Single purchase',
    available: true,
    terms: 'Sealed product. Exchange within 7 days if unopened. Not a substitute for a varied diet.',
    description: 'In-house whey protein isolate, chocolate flavour. Available at the front desk.',
  },
  {
    id: 'gym_towel',
    name: 'Microfiber Gym Towel',
    category: 'product',
    price: 450,
    durationLabel: 'Single purchase',
    available: true,
    terms: 'While stocks last. Exchange within 7 days if unused.',
    description: 'Quick-dry microfiber towel with branded branding loop.',
  },
  {
    id: 'resistance_band',
    name: 'Resistance Band Set',
    category: 'product',
    price: 1200,
    durationLabel: 'Single purchase',
    available: false,
    terms: 'Currently out of stock. Notify me to reserve the next batch.',
    description: 'Three-tier resistance band set for mobility and accessory work.',
  },
];

const DEFAULT_SETTINGS: Settings = {
  inactivityThresholdDays: 10,
  weeklyAttendanceGoal: 3,
  currency: 'INR',
};

function buildMembers(): Member[] {
  return MEMBER_SEED.map((seed, i) => {
    const { attendancePattern, ...rest } = seed;
    void attendancePattern; // handled in buildAttendance
    return {
      ...rest,
      id: `m_${(i + 1).toString().padStart(2, '0')}`,
      avatarHue: (i * 47) % 360,
      addOns: seed.addOns ?? [],
      followUps: seed.followUps ?? [],
      nextActionDate: seed.nextActionDate,
    } as Member;
  });
}

function buildAttendance(members: Member[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  MEMBER_SEED.forEach((seed, i) => {
    const memberId = members[i].id;
    seed.attendancePattern.forEach((daysAgo, v) => {
      records.push({
        id: `att_${memberId}_${v}`,
        memberId,
        date: isoDate(addDays(DEMO_TODAY, -daysAgo)),
        method: v % 4 === 0 ? 'manual' : 'qr',
      });
    });
  });
  return records.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function buildRenewals(members: Member[]): RenewalRecord[] {
  const recs: RenewalRecord[] = [];
  // Karan Singh — expired, pending renewal attempt (failed once)
  const karan = members.find((m) => m.firstName === 'Karan');
  if (karan) {
    recs.push({
      memberId: karan.id,
      planMonths: 12,
      basePrice: 18000,
      discountPercent: 10,
      finalPrice: 16200,
      paymentStatus: 'pending',
      initiatedAt: new Date().toISOString(),
    });
  }
  // Rahul Gupta — expiring in 4 days, pending
  const rahul = members.find((m) => m.firstName === 'Rahul');
  if (rahul) {
    recs.push({
      memberId: rahul.id,
      planMonths: 6,
      basePrice: 11000,
      discountPercent: 5,
      finalPrice: 10450,
      paymentStatus: 'pending',
      initiatedAt: new Date().toISOString(),
    });
  }
  return recs;
}

export function buildInitialData(): AppData {
  _id = 0;
  const members = buildMembers();
  const attendance = buildAttendance(members);
  const renewals = buildRenewals(members);
  return {
    members,
    attendance,
    addOns: ADD_ONS,
    renewals,
    settings: { ...DEFAULT_SETTINGS },
    version: 3,
  };
}

export const PLAN_PRICES: Record<3 | 6 | 12, number> = {
  3: 6500,
  6: 11000,
  12: 18000,
};

export const PLAN_DISCOUNTS: Record<3 | 6 | 12, number> = {
  3: 0,
  6: 5,
  12: 10,
};

export const FOLLOW_UP_LABELS: Record<string, string> = {
  will_return: 'Will return',
  injured: 'Injured',
  travelling: 'Travelling',
  timing_issue: 'Timing issue',
  unhappy: 'Unhappy',
  no_response: 'No response',
  cancelled: 'Cancelled',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  expired: 'Expired',
  frozen: 'Frozen',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

export const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
};
