import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  AlertOctagon,
  PhoneCall,
  RefreshCw,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { AppData } from '@/types';
import {
  TODAY,
  absentDays,
  isExpiringSoon,
  isRedListEligible,
  lastVisit,
} from '@/store/useAppStore';
import { Avatar, SectionHeader, StatusBadge } from '@/components/ui';
import { formatINR, formatDate, daysBetween } from '@/data/sampleData';
import type { ScreenId } from '@/components/nav';
import { FOLLOW_UP_LABELS } from '@/data/sampleData';

export function DashboardScreen({
  data,
  onNavigate,
  onOpenMember,
}: {
  data: AppData;
  onNavigate: (id: ScreenId) => void;
  onOpenMember: (id: string) => void;
}) {
  const todayStr = TODAY.toISOString().slice(0, 10);
  const threshold = data.settings.inactivityThresholdDays;

  const metrics = useMemo(() => {
    const activeMembers = data.members.filter((m) => m.status === 'active');
    const todayCheckins = data.attendance.filter((a) => a.date === todayStr).length;
    const redList = data.members.filter((m) =>
      isRedListEligible(m, data.attendance, threshold, TODAY),
    );
    const openFollowUps = data.members.filter(
      (m) => m.followUps.length > 0 && m.status === 'active',
    );
    const renewalsDue = data.members.filter((m) =>
      isExpiringSoon(m, 7, TODAY),
    );
    return {
      active: activeMembers.length,
      checkins: todayCheckins,
      redList: redList.length,
      followUps: openFollowUps.length,
      renewals: renewalsDue.length,
    };
  }, [data, todayStr, threshold]);

  const renewalsDue = useMemo(
    () =>
      data.members
        .filter((m) => isExpiringSoon(m, 7, TODAY))
        .sort((a, b) => daysBetween(new Date(a.expiryDate), new Date(b.expiryDate))),
    [data.members],
  );

  const redListPreview = useMemo(
    () =>
      data.members
        .filter((m) => isRedListEligible(m, data.attendance, threshold, TODAY))
        .slice(0, 4),
    [data.members, data.attendance, threshold],
  );

  const recentCheckins = useMemo(() => {
    return data.attendance
      .filter((a) => a.date === todayStr)
      .slice(0, 5)
      .map((a) => ({
        rec: a,
        member: data.members.find((m) => m.id === a.memberId)!,
      }))
      .filter((x) => x.member);
  }, [data.attendance, data.members, todayStr]);

  const weeklyTrend = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(TODAY);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const count = data.attendance.filter((a) => a.date === ds).length;
      days.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 1),
        count,
      });
    }
    return days;
  }, [data.attendance]);

  const maxTrend = Math.max(...weeklyTrend.map((d) => d.count), 1);
  const goal = data.settings.weeklyAttendanceGoal;

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader
        title="Owner Dashboard"
        subtitle="Snapshot of your gym today — all figures are simulated."
        icon={LayoutDashboard}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
        <MetricCard
          icon={Users}
          label="Active Members"
          value={metrics.active}
          tint="emerald"
          onClick={() => onNavigate('members')}
        />
        <MetricCard
          icon={CalendarCheck}
          label="Today's Check-ins"
          value={metrics.checkins}
          tint="sky"
          onClick={() => onNavigate('attendance')}
        />
        <MetricCard
          icon={AlertOctagon}
          label="No-Show (10d+)"
          value={metrics.redList}
          tint="red"
          onClick={() => onNavigate('redlist')}
        />
        <MetricCard
          icon={RefreshCw}
          label="Renewals due (7d)"
          value={metrics.renewals}
          tint="amber"
          onClick={() => onNavigate('renewals')}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly attendance trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="section-title">Weekly Attendance</h3>
            </div>
            <span className="text-xs text-zinc-500">
              Goal: {goal}/day
            </span>
          </div>
          <div className="flex h-40 items-end justify-between gap-2">
            {weeklyTrend.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end justify-center">
                  <div
                    className={`w-full max-w-[34px] rounded-t-md transition-all ${
                      d.count >= goal
                        ? 'bg-emerald-500/80'
                        : 'bg-emerald-500/35'
                    }`}
                    style={{ height: `${(d.count / maxTrend) * 100}%`, minHeight: d.count > 0 ? '6px' : '2px' }}
                    title={`${d.count} check-ins`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-zinc-500">
                  {d.label}
                </span>
                <span className="text-[11px] font-bold text-zinc-300">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open follow-ups */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall size={18} className="text-amber-400" />
              <h3 className="section-title">Open Follow-ups</h3>
            </div>
            <span className="badge bg-amber-500/15 text-amber-300 border border-amber-500/25">
              {metrics.followUps}
            </span>
          </div>
          <FollowUpsList data={data} onOpenMember={onOpenMember} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Renewals due */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title">Renewals Due (7 days)</h3>
            <button
              onClick={() => onNavigate('renewals')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          {renewalsDue.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              No renewals due this week.
            </p>
          ) : (
            <div className="space-y-2.5">
              {renewalsDue.map((m) => {
                const days = daysBetween(new Date(m.expiryDate), TODAY);
                return (
                  <button
                    key={m.id}
                    onClick={() => onOpenMember(m.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-emerald-500/20 hover:bg-white/[0.04]"
                  >
                    <Avatar name={`${m.firstName} ${m.lastName}`} hue={m.avatarHue} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Expires {formatDate(m.expiryDate)}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        days <= 2
                          ? 'bg-red-500/15 text-red-300 border border-red-500/25'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                      }`}
                    >
                      {days === 0 ? 'Today' : `${days}d`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Red list preview */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title">No-Show Watch</h3>
            <button
              onClick={() => onNavigate('redlist')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          {redListPreview.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              No inactive members right now.
            </p>
          ) : (
            <div className="space-y-2.5">
              {redListPreview.map((m) => {
                const absent = absentDays(m.id, data.attendance, TODAY) ?? 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => onOpenMember(m.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-red-500/20 hover:bg-white/[0.04]"
                  >
                    <Avatar name={`${m.firstName} ${m.lastName}`} hue={m.avatarHue} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Last visit {formatDate(lastVisit(m.id, data.attendance)?.date ?? m.startDate)}
                      </p>
                    </div>
                    <span className="badge bg-red-500/15 text-red-300 border border-red-500/25">
                      {absent}d ago
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's check-ins */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Today's Check-ins</h3>
        {recentCheckins.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No check-ins recorded yet today. Try the Check-in screen.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {recentCheckins.map(({ rec, member }) => (
              <button
                key={rec.id}
                onClick={() => onOpenMember(member.id)}
                className="flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] py-1.5 pl-1.5 pr-4 transition-colors hover:border-emerald-500/20"
              >
                <Avatar name={`${member.firstName} ${member.lastName}`} hue={member.avatarHue} size={28} />
                <span className="text-sm font-semibold text-zinc-200">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {rec.method === 'qr' ? 'QR' : 'Manual'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tint,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tint: 'emerald' | 'sky' | 'red' | 'amber';
  onClick: () => void;
}) {
  const tints = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    sky: 'text-sky-400 bg-sky-500/10',
    red: 'text-red-400 bg-red-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };
  return (
    <button
      onClick={onClick}
      className="card card-hover p-4 text-left sm:p-5"
    >
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${tints[tint]}`}>
        <Icon size={20} />
      </div>
      <p className="font-display text-2xl font-bold text-white sm:text-3xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-zinc-400 sm:text-sm">{label}</p>
    </button>
  );
}

function FollowUpsList({
  data,
  onOpenMember,
}: {
  data: AppData;
  onOpenMember: (id: string) => void;
}) {
  const items = data.members
    .filter((m) => m.followUps.length > 0 && m.status === 'active')
    .map((m) => ({
      member: m,
      last: m.followUps[m.followUps.length - 1],
    }))
    .sort((a, b) => (a.last.date < b.last.date ? 1 : -1))
    .slice(0, 5);

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-zinc-500">No open follow-ups.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map(({ member, last }) => (
        <button
          key={member.id}
          onClick={() => onOpenMember(member.id)}
          className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-amber-500/20 hover:bg-white/[0.04]"
        >
          <Avatar name={`${member.firstName} ${member.lastName}`} hue={member.avatarHue} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {member.firstName} {member.lastName}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {FOLLOW_UP_LABELS[last.outcome]}
            </p>
          </div>
          <StatusBadge status={last.outcome === 'cancelled' ? 'cancelled' : 'pending'} />
        </button>
      ))}
    </div>
  );
}
