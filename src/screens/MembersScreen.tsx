import { useMemo, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ChevronRight,
  Phone,
  Mail,
  CalendarDays,
  Clock,
  ArrowLeft,
  Package,
  PhoneCall,
  QrCode,
  Hand,
} from 'lucide-react';
import type { AppData, Member, MembershipStatus } from '@/types';
import {
  TODAY,
  absentDays,
  memberAttendance,
} from '@/store/useAppStore';
import {
  formatINR,
  formatDate,
  daysBetween,
  STATUS_LABELS,
  FOLLOW_UP_LABELS,
} from '@/data/sampleData';
import {
  Avatar,
  EmptyState,
  Modal,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import type { Store } from '@/store/useAppStore';
import { useToast } from '@/components/ui';

export function MembersScreen({
  data,
  onOpenMember,
  onAddMember,
}: {
  data: AppData;
  onOpenMember: (id: string) => void;
  onAddMember: () => void;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.members
      .filter((m) => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (!q) return true;
        return (
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [data.members, query, statusFilter]);

  const filters: Array<{ id: MembershipStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'expired', label: 'Expired' },
    { id: 'frozen', label: 'Frozen' },
    { id: 'paused', label: 'Paused' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title="Members"
        subtitle={`${data.members.length} fictional member records`}
        icon={Users}
        action={
          <button className="btn-primary" onClick={onAddMember}>
            <UserPlus size={16} /> Add Member
          </button>
        }
      />

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="input pl-11"
            placeholder="Search by name, phone or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter size={15} className="shrink-0 text-zinc-500" />
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === f.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  : 'border border-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          message="Try a different search or filter. Add a new demo member to see them here."
          action={
            <button className="btn-primary" onClick={onAddMember}>
              <UserPlus size={16} /> Add Demo Member
            </button>
          }
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const absent = absentDays(m.id, data.attendance, TODAY);
            const expiryDiff = daysBetween(new Date(m.expiryDate), TODAY);
            return (
              <button
                key={m.id}
                onClick={() => onOpenMember(m.id)}
                className="card card-hover flex items-center gap-3 p-3.5 text-left"
              >
                <Avatar name={`${m.firstName} ${m.lastName}`} hue={m.avatarHue} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">
                      {m.firstName} {m.lastName}
                    </p>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{m.phone}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>{m.planMonths}mo plan</span>
                    {absent !== null && (
                      <span className={absent >= 10 ? 'text-red-400' : ''}>
                        {absent}d since visit
                      </span>
                    )}
                    {expiryDiff <= 7 && expiryDiff >= 0 && (
                      <span className="text-amber-400">
                        Renew in {expiryDiff}d
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-zinc-600" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Member detail ----------

export function MemberDetailScreen({
  member,
  data,
  onBack,
  onCheckIn,
}: {
  member: Member;
  data: AppData;
  onBack: () => void;
  onCheckIn: (memberId: string) => void;
}) {
  const attendance = memberAttendance(member.id, data.attendance);
  const absent = absentDays(member.id, data.attendance, TODAY);
  const expiryDiff = daysBetween(new Date(member.expiryDate), TODAY);
  const addOns = data.addOns.filter((a) => member.addOns.includes(a.id));

  return (
    <div className="animate-fade-in space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to members
      </button>

      {/* Header card */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={`${member.firstName} ${member.lastName}`} hue={member.avatarHue} size={72} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {member.firstName} {member.lastName}
              </h2>
              <StatusBadge status={member.status} />
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Member ID {member.id.toUpperCase()}
            </p>
          </div>
          <button
            className="btn-outline"
            onClick={() => onCheckIn(member.id)}
            disabled={member.status !== 'active'}
          >
            <QrCode size={16} /> Quick Check-in
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Contact + plan */}
        <div className="space-y-4 lg:col-span-1">
          <div className="card p-5">
            <h3 className="section-title mb-3 text-base">Contact</h3>
            <div className="space-y-3">
              <InfoRow icon={Phone} label="Phone" value={member.phone} />
              <InfoRow icon={Mail} label="Email" value={member.email} />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="section-title mb-3 text-base">Membership</h3>
            <div className="space-y-3">
              <InfoRow icon={CalendarDays} label="Plan" value={`${member.planMonths}-month`} />
              <InfoRow icon={CalendarDays} label="Start" value={formatDate(member.startDate)} />
              <InfoRow
                icon={CalendarDays}
                label="Expiry"
                value={formatDate(member.expiryDate)}
                valueClass={
                  expiryDiff <= 7 && expiryDiff >= 0
                    ? 'text-amber-300'
                    : expiryDiff < 0
                      ? 'text-red-300'
                      : ''
                }
              />
              <InfoRow
                icon={Clock}
                label="Last visit"
                value={
                  attendance.length > 0
                    ? `${formatDate(attendance[0].date)} (${absent}d ago)`
                    : 'No visits recorded'
                }
              />
              <InfoRow icon={Clock} label="Total visits" value={String(attendance.length)} />
              <div className="border-t border-white/[0.06] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Plan paid</span>
                  <span className="font-display font-bold text-emerald-300">
                    {formatINR(member.paidAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="card p-5">
            <h3 className="section-title mb-3 text-base">Active Add-ons</h3>
            {addOns.length === 0 ? (
              <p className="text-sm text-zinc-500">No add-ons purchased.</p>
            ) : (
              <div className="space-y-2">
                {addOns.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <Package size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-200">{a.name}</p>
                      <p className="text-xs text-zinc-500">{formatINR(a.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance history + follow-ups */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h3 className="section-title mb-4 text-base">Attendance History</h3>
            {attendance.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No attendance yet"
                message="This member hasn't checked in. Use the Check-in screen to record a demo visit."
              />
            ) : (
              <div className="space-y-1.5">
                {attendance.slice(0, 12).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2.5"
                  >
                    <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
                      {a.method === 'qr' ? <QrCode size={14} /> : <Hand size={14} />}
                    </div>
                    <span className="flex-1 text-sm text-zinc-200">
                      {formatDate(a.date)}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500">
                      {a.method === 'qr' ? 'QR scan' : 'Assisted'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-4 text-base">Follow-up History</h3>
            {member.followUps.length === 0 ? (
              <p className="text-sm text-zinc-500">No follow-ups recorded.</p>
            ) : (
              <div className="relative space-y-4 pl-5">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
                {[...member.followUps].reverse().map((f) => (
                  <div key={f.id} className="relative">
                    <div className="absolute -left-[18px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0c100e] bg-emerald-500" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {FOLLOW_UP_LABELS[f.outcome]}
                      </span>
                      <span className="text-xs text-zinc-500">{formatDate(f.date)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-400">{f.note}</p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      <PhoneCall size={10} className="inline" /> by {f.staff}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass = '',
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-zinc-500" />
      <span className="w-20 shrink-0 text-xs text-zinc-500">{label}</span>
      <span className={`flex-1 text-sm font-medium text-zinc-200 ${valueClass}`}>{value}</span>
    </div>
  );
}

// ---------- Add member modal ----------

export function AddMemberModal({
  open,
  onClose,
  store,
}: {
  open: boolean;
  onClose: () => void;
  store: Store;
}) {
  const toast = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<3 | 6 | 12>(3);
  const [price, setPrice] = useState(6500);
  const [status, setStatus] = useState<MembershipStatus>('active');

  const reset = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setPlan(3);
    setPrice(6500);
    setStatus('active');
  };

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.show('error', 'First and last name are required.');
      return;
    }
    const start = TODAY.toISOString().slice(0, 10);
    const exp = new Date(TODAY);
    exp.setMonth(exp.getMonth() + plan);
    store.addMember({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || '+91 00000 00000',
      email: email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example-demo.in`,
      planMonths: plan,
      startDate: start,
      expiryDate: exp.toISOString().slice(0, 10),
      status,
      basePrice: price,
      paidAmount: price,
    });
    toast.show('success', 'Demo member added.');
    reset();
    onClose();
  };

  const planPrices: Record<number, number> = { 3: 6500, 6: 11000, 12: 18000 };

  return (
    <Modal open={open} onClose={onClose} title="Add Demo Member" size="lg">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">First name *</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Aarav" />
        </div>
        <div>
          <label className="label">Last name *</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Patel" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example-demo.in" />
        </div>
        <div>
          <label className="label">Plan</label>
          <div className="flex gap-2">
            {([3, 6, 12] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlan(p);
                  setPrice(planPrices[p]);
                }}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  plan === p
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p} mo
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Amount (INR)</label>
          <input
            type="number"
            className="input"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Status</label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as MembershipStatus)}
          >
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-2.5">
        <button className="btn-outline flex-1" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary flex-1" onClick={handleSubmit}>
          <UserPlus size={16} /> Add Member
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-600">
        Fictional demo record only — no real member is enrolled.
      </p>
    </Modal>
  );
}
