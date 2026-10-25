import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppData,
  AttendanceRecord,
  FollowUpEvent,
  FollowUpOutcome,
  Member,
  RenewalRecord,
  Settings,
} from '@/types';
import {
  DEMO_TODAY,
  buildInitialData,
  daysBetween,
} from '@/data/sampleData';

const STORAGE_KEY = 'ate_fitness_demo_v3';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && parsed.version === 3 && Array.isArray(parsed.members)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return buildInitialData();
}

export function useAppStore() {
  const [data, setData] = useState<AppData>(() => load());
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [data]);

  const resetData = useCallback(() => {
    const fresh = buildInitialData();
    setData(fresh);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const addMember = useCallback(
    (m: Omit<Member, 'id' | 'avatarHue' | 'addOns' | 'followUps'>) => {
      let newId = '';
      setData((d) => {
        const num = d.members.length + 1;
        newId = `m_${num.toString().padStart(2, '0')}`;
        const member: Member = {
          ...m,
          id: newId,
          avatarHue: (num * 47) % 360,
          addOns: [],
          followUps: [],
        };
        return { ...d, members: [...d.members, member] };
      });
      return newId;
    },
    [],
  );

  const addAttendance = useCallback(
    (memberId: string, method: 'qr' | 'manual'): AttendanceRecord => {
      const rec: AttendanceRecord = {
        id: `att_${memberId}_${Date.now()}`,
        memberId,
        date: DEMO_TODAY.toISOString().slice(0, 10),
        method,
      };
      setData((d) => {
        const existsToday = d.attendance.some(
          (a) => a.memberId === memberId && a.date === rec.date,
        );
        if (existsToday) return d;
        return { ...d, attendance: [rec, ...d.attendance] };
      });
      return rec;
    },
    [],
  );

  const hasCheckedInToday = useCallback(
    (memberId: string): boolean => {
      const today = DEMO_TODAY.toISOString().slice(0, 10);
      return data.attendance.some(
        (a) => a.memberId === memberId && a.date === today,
      );
    },
    [data.attendance],
  );

  const addFollowUp = useCallback(
    (memberId: string, outcome: FollowUpOutcome, note: string) => {
      const event: FollowUpEvent = {
        id: `fu_${Date.now()}`,
        date: DEMO_TODAY.toISOString().slice(0, 10),
        outcome,
        note,
        staff: 'Demo Owner',
      };
      setData((d) => ({
        ...d,
        members: d.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                followUps: [...m.followUps, event],
                nextActionDate:
                  outcome === 'will_return' || outcome === 'timing_issue'
                    ? new Date(
                        new Date(DEMO_TODAY).setDate(DEMO_TODAY.getDate() + 3),
                      )
                        .toISOString()
                        .slice(0, 10)
                    : outcome === 'no_response'
                      ? new Date(
                          new Date(DEMO_TODAY).setDate(DEMO_TODAY.getDate() + 2),
                        )
                          .toISOString()
                          .slice(0, 10)
                      : m.nextActionDate,
              }
            : m,
        ),
      }));
    },
    [],
  );

  const setRenewalStatus = useCallback(
    (memberId: string, status: RenewalRecord['paymentStatus']) => {
      setData((d) => {
        const existing = d.renewals.find((r) => r.memberId === memberId);
        if (existing) {
          return {
            ...d,
            renewals: d.renewals.map((r) =>
              r.memberId === memberId ? { ...r, paymentStatus: status } : r,
            ),
          };
        }
        // create a pending renewal if none exists
        const member = d.members.find((m) => m.id === memberId);
        if (!member) return d;
        const plan = member.planMonths === 12 ? 12 : member.planMonths === 6 ? 6 : 3;
        const base = plan === 12 ? 18000 : plan === 6 ? 11000 : 6500;
        const disc = plan === 12 ? 10 : plan === 6 ? 5 : 0;
        return {
          ...d,
          renewals: [
            ...d.renewals,
            {
              memberId,
              planMonths: plan as 3 | 6 | 12,
              basePrice: base,
              discountPercent: disc,
              finalPrice: Math.round((base * (100 - disc)) / 100),
              paymentStatus: status,
              initiatedAt: new Date().toISOString(),
            },
          ],
        };
      });
    },
    [],
  );

  const renewMember = useCallback(
    (memberId: string, planMonths: 3 | 6 | 12, finalPrice: number) => {
      setData((d) => {
        const member = d.members.find((m) => m.id === memberId);
        if (!member) return d;
        const newExpiry = new Date(member.expiryDate);
        // renew from today or existing expiry, whichever is later
        const base = new Date(
          Math.max(newExpiry.getTime(), DEMO_TODAY.getTime()),
        );
        base.setMonth(base.getMonth() + planMonths);
        return {
          ...d,
          members: d.members.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  expiryDate: base.toISOString().slice(0, 10),
                  status: 'active',
                  planMonths,
                  basePrice: finalPrice,
                  paidAmount: finalPrice,
                }
              : m,
          ),
          renewals: d.renewals.map((r) =>
            r.memberId === memberId
              ? { ...r, paymentStatus: 'paid', planMonths, finalPrice }
              : r,
          ),
        };
      });
    },
    [],
  );

  return {
    data,
    resetData,
    updateSettings,
    addMember,
    addAttendance,
    hasCheckedInToday,
    addFollowUp,
    setRenewalStatus,
    renewMember,
  };
}

export type Store = ReturnType<typeof useAppStore>;

// ---- Derived selectors ----

export function lastVisit(
  memberId: string,
  attendance: AttendanceRecord[],
): AttendanceRecord | undefined {
  return attendance
    .filter((a) => a.memberId === memberId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

export function memberAttendance(
  memberId: string,
  attendance: AttendanceRecord[],
): AttendanceRecord[] {
  return attendance
    .filter((a) => a.memberId === memberId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function absentDays(
  memberId: string,
  attendance: AttendanceRecord[],
  today: Date = DEMO_TODAY,
): number | null {
  const last = lastVisit(memberId, attendance);
  if (!last) return null;
  return daysBetween(today, new Date(last.date));
}

export function isExpiringSoon(
  member: Member,
  withinDays: number,
  today: Date = DEMO_TODAY,
): boolean {
  const diff = daysBetween(new Date(member.expiryDate), today);
  return diff >= 0 && diff <= withinDays && member.status === 'active';
}

export function isExpired(member: Member, today: Date = DEMO_TODAY): boolean {
  return daysBetween(new Date(member.expiryDate), today) < 0;
}

export function isRedListEligible(
  member: Member,
  attendance: AttendanceRecord[],
  thresholdDays: number,
  today: Date = DEMO_TODAY,
): boolean {
  if (member.status !== 'active') return false;
  const absent = absentDays(member.id, attendance, today);
  if (absent === null) return true; // active but never visited
  return absent >= thresholdDays;
}

export function useMemoized<T>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

export const TODAY = DEMO_TODAY;
