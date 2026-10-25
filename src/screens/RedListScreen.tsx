import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  PhoneCall,
  CalendarDays,
  Clock,
  ChevronRight,
  ArrowRight,
  Check,
  HeartPulse,
  Plane,
  Clock3,
  Frown,
  PhoneMissed,
  Ban,
} from 'lucide-react';
import type { AppData, FollowUpOutcome, Member } from '@/types';
import {
  TODAY,
  absentDays,
  isRedListEligible,
  lastVisit,
} from '@/store/useAppStore';
import type { Store } from '@/store/useAppStore';
import {
  formatDate,
  daysBetween,
  FOLLOW_UP_LABELS,
  STATUS_LABELS,
} from '@/data/sampleData';
import {
  Avatar,
  EmptyState,
  Modal,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { useToast } from '@/components/ui';

const OUTCOMES: Array<{ id: FollowUpOutcome; icon: typeof Check; tint: string }> = [
  { id: 'will_return', icon: Check, tint: 'text-emerald-400 bg-emerald-500/10' },
  { id: 'injured', icon: HeartPulse, tint: 'text-rose-400 bg-rose-500/10' },
  { id: 'travelling', icon: Plane, tint: 'text-sky-400 bg-sky-500/10' },
  { id: 'timing_issue', icon: Clock3, tint: 'text-amber-400 bg-amber-500/10' },
  { id: 'unhappy', icon: Frown, tint: 'text-orange-400 bg-orange-500/10' },
  { id: 'no_response', icon: PhoneMissed, tint: 'text-zinc-400 bg-zinc-500/10' },
  { id: 'cancelled', icon: Ban, tint: 'text-red-400 bg-red-500/10' },
];

export function RedListScreen({
  data,
  store,
  onOpenMember,
}: {
  data: AppData;
  store: Store;
  onOpenMember: (id: string) => void;
}) {
  const threshold = data.settings.inactivityThresholdDays;
  const [followUpMember, setFollowUpMember] = useState<Member | null>(null);
  const [outcome, setOutcome] = useState<FollowUpOutcome | null>(null);
  const [note, setNote] = useState('');
  const toast = useToast();

  const redList = useMemo(
    () =>
      data.members
        .filter((m) => isRedListEligible(m, data.attendance, threshold, TODAY))
        .map((m) => {
          const absent = absentDays(m.id, data.attendance, TODAY) ?? 0;
          const last = lastVisit(m.id, data.attendance);
          const lastFu = m.followUps[m.followUps.length - 1];
          return { member: m, absent, lastVisitDate: last?.date, lastFu };
        })
        .sort((a, b) => b.absent - a.absent),
    [data.members, data.attendance, threshold],
  );

  const handleSubmit = () => {
    if (!followUpMember || !outcome) return;
    store.addFollowUp(followUpMember.id, outcome, note.trim() || FOLLOW_UP_LABELS[outcome]);
    toast.show('success', `Follow-up logged: ${FOLLOW_UP_LABELS[outcome]}.`);
    setFollowUpMember(null);
    setOutcome(null);
    setNote('');
  };

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title="No-Show Red List"
        subtitle={`Active members absent ${threshold}+ days. Paused, frozen, expired and cancelled are excluded.`}
        icon={AlertOctagon}
      />

      {redList.length === 0 ? (
        <EmptyState
          icon={AlertOctagon}
          title="No inactive members"
          message={`No active member has been absent for ${threshold} or more days. Adjust the threshold in Settings if needed.`}
        />
      ) : (
        <div className="space-y-2.5">
          {redList.map(({ member, absent, lastVisitDate, lastFu }) => {
            const expiryDiff = daysBetween(new Date(member.expiryDate), TODAY);
            return (
              <div
                key={member.id}
                className="card card-hover p-4"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar name={`${member.firstName} ${member.lastName}`} hue={member.avatarHue} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onOpenMember(member.id)}
                        className="text-sm font-bold text-white hover:text-emerald-300"
                      >
                        {member.firstName} {member.lastName}
                      </button>
                      <StatusBadge status={member.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
                      <Stat
                        icon={Clock}
                        label="Last visit"
                        value={lastVisitDate ? formatDate(lastVisitDate) : 'Never'}
                      />
                      <Stat
                        icon={AlertOctagon}
                        label="Absent"
                        value={`${absent} days`}
                        valueClass={absent >= 15 ? 'text-red-300 font-bold' : 'text-amber-300 font-bold'}
                      />
                      <Stat
                        icon={CalendarDays}
                        label="Expires"
                        value={formatDate(member.expiryDate)}
                        valueClass={expiryDiff <= 7 && expiryDiff >= 0 ? 'text-amber-300' : ''}
                      />
                      <Stat
                        icon={PhoneCall}
                        label="Follow-up"
                        value={lastFu ? FOLLOW_UP_LABELS[lastFu.outcome] : 'None yet'}
                      />
                    </div>
                    {member.nextActionDate && (
                      <p className="mt-2 text-[11px] text-zinc-500">
                        Next action: {formatDate(member.nextActionDate)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                  <button
                    className="btn-primary flex-1 text-xs sm:flex-none"
                    onClick={() => setFollowUpMember(member)}
                  >
                    <PhoneCall size={14} /> Log Follow-up
                  </button>
                  <button
                    className="btn-outline text-xs"
                    onClick={() => onOpenMember(member.id)}
                  >
                    View profile <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Follow-up modal */}
      <Modal
        open={!!followUpMember}
        onClose={() => {
          setFollowUpMember(null);
          setOutcome(null);
          setNote('');
        }}
        title="Log Follow-up"
        size="lg"
      >
        {followUpMember && (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <Avatar name={`${followUpMember.firstName} ${followUpMember.lastName}`} hue={followUpMember.avatarHue} size={40} />
              <div>
                <p className="text-sm font-bold text-white">
                  {followUpMember.firstName} {followUpMember.lastName}
                </p>
                <p className="text-xs text-zinc-500">
                  {STATUS_LABELS[followUpMember.status]} · Last visit{' '}
                  {lastVisit(followUpMember.id, data.attendance)
                    ? formatDate(lastVisit(followUpMember.id, data.attendance)!.date)
                    : 'never'}
                </p>
              </div>
            </div>

            <label className="label">Outcome</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OUTCOMES.map((o) => {
                const Icon = o.icon;
                const active = outcome === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setOutcome(o.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`rounded-lg p-1 ${o.tint}`}>
                      <Icon size={14} />
                    </span>
                    <span className="text-left text-xs leading-tight">
                      {FOLLOW_UP_LABELS[o.id]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label className="label">Note (optional)</label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="Add context from the conversation…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {followUpMember.followUps.length > 0 && (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Case history retained
                </p>
                <div className="space-y-1.5">
                  {[...followUpMember.followUps].reverse().slice(0, 3).map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-emerald-300">
                        {FOLLOW_UP_LABELS[f.outcome]}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500">{formatDate(f.date)}</span>
                      <span className="truncate text-zinc-600">— {f.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-2.5">
              <button
                className="btn-outline flex-1"
                onClick={() => {
                  setFollowUpMember(null);
                  setOutcome(null);
                  setNote('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleSubmit}
                disabled={!outcome}
              >
                <ArrowRight size={16} /> Save Follow-up
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  valueClass = '',
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="shrink-0 text-zinc-600" />
      <span className="text-zinc-500">{label}:</span>
      <span className={`text-zinc-300 ${valueClass}`}>{value}</span>
    </div>
  );
}
