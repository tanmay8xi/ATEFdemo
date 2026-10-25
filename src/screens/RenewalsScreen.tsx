import { useMemo, useState } from 'react';
import {
  RefreshCw,
  CalendarDays,
  Tag,
  CheckCircle2,
  XCircle,
  Clock3,
  CreditCard,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import type { AppData, Member, RenewalRecord } from '@/types';
import type { Store } from '@/store/useAppStore';
import { TODAY, isExpiringSoon } from '@/store/useAppStore';
import {
  formatINR,
  formatDate,
  daysBetween,
  PLAN_PRICES,
  PLAN_DISCOUNTS,
  PAYMENT_LABELS,
} from '@/data/sampleData';
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  Modal,
  SectionHeader,
  StatusBadge,
} from '@/components/ui';
import { useToast } from '@/components/ui';

export function RenewalsScreen({
  data,
  store,
  onOpenMember,
}: {
  data: AppData;
  store: Store;
  onOpenMember: (id: string) => void;
}) {
  const toast = useToast();
  const [renewMember, setRenewMember] = useState<Member | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<3 | 6 | 12>(6);
  const [customDiscount, setCustomDiscount] = useState<number | null>(null);
  const [customBase, setCustomBase] = useState<number | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{
    member: Member;
    status: 'paid' | 'failed';
    plan: 3 | 6 | 12;
    finalPrice: number;
  } | null>(null);

  const upcoming = useMemo(
    () =>
      data.members
        .filter((m) => isExpiringSoon(m, 7, TODAY) || m.status === 'expired')
        .sort((a, b) => daysBetween(new Date(a.expiryDate), new Date(b.expiryDate))),
    [data.members],
  );

  const getRenewal = (memberId: string): RenewalRecord | undefined =>
    data.renewals.find((r) => r.memberId === memberId);

  const basePrice = customBase ?? PLAN_PRICES[selectedPlan];
  const discount = customDiscount ?? PLAN_DISCOUNTS[selectedPlan];
  const finalPrice = Math.round((basePrice * (100 - discount)) / 100);

  const openRenew = (member: Member) => {
    setRenewMember(member);
    setSelectedPlan(member.planMonths === 12 ? 12 : member.planMonths === 6 ? 6 : 3);
    setCustomDiscount(null);
    setCustomBase(null);
  };

  const simulatePayment = (status: 'paid' | 'failed') => {
    if (!renewMember) return;
    setConfirmStatus({
      member: renewMember,
      status,
      plan: selectedPlan,
      finalPrice,
    });
  };

  const confirmPayment = () => {
    if (!confirmStatus) return;
    const { member, status, plan, finalPrice } = confirmStatus;
    store.setRenewalStatus(member.id, status);
    if (status === 'paid') {
      store.renewMember(member.id, plan, finalPrice);
      toast.show('success', `Renewal completed for ${member.firstName}. Simulated payment only.`);
    } else {
      toast.show('error', `Payment failed for ${member.firstName}. Simulated result.`);
    }
    setConfirmStatus(null);
    setRenewMember(null);
  };

  const markPending = (member: Member) => {
    store.setRenewalStatus(member.id, 'pending');
    toast.show('info', `Marked pending for ${member.firstName}.`);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title="Membership Renewals"
        subtitle="Simulated payment states — no real transaction is processed."
        icon={RefreshCw}
      />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No renewals due"
          message="No memberships expire within the next 7 days."
        />
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((m) => {
            const renewal = getRenewal(m.id);
            const expiryDiff = daysBetween(new Date(m.expiryDate), TODAY);
            const overdue = expiryDiff < 0;
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-start gap-3.5">
                  <Avatar name={`${m.firstName} ${m.lastName}`} hue={m.avatarHue} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onOpenMember(m.id)}
                        className="text-sm font-bold text-white hover:text-emerald-300"
                      >
                        {m.firstName} {m.lastName}
                      </button>
                      <StatusBadge status={m.status} />
                      {renewal && <StatusBadge status={renewal.paymentStatus} />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {overdue ? 'Expired' : 'Expires'} {formatDate(m.expiryDate)}
                      </span>
                      <span className={overdue ? 'text-red-300 font-semibold' : expiryDiff <= 2 ? 'text-amber-300 font-semibold' : ''}>
                        {overdue ? `${Math.abs(expiryDiff)}d overdue` : `${expiryDiff}d left`}
                      </span>
                      <span>Current: {m.planMonths}mo · {formatINR(m.basePrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                  <button className="btn-primary text-xs" onClick={() => openRenew(m)}>
                    <CreditCard size={14} /> Renew Now
                  </button>
                  {renewal?.paymentStatus !== 'pending' && (
                    <button className="btn-outline text-xs" onClick={() => markPending(m)}>
                      <Clock3 size={14} /> Mark Pending
                    </button>
                  )}
                  <button className="btn-ghost text-xs" onClick={() => onOpenMember(m.id)}>
                    View profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renew modal */}
      <Modal
        open={!!renewMember}
        onClose={() => setRenewMember(null)}
        title="Process Renewal"
        size="lg"
      >
        {renewMember && (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <Avatar name={`${renewMember.firstName} ${renewMember.lastName}`} hue={renewMember.avatarHue} size={40} />
              <div>
                <p className="text-sm font-bold text-white">
                  {renewMember.firstName} {renewMember.lastName}
                </p>
                <p className="text-xs text-zinc-500">
                  Current expiry: {formatDate(renewMember.expiryDate)}
                </p>
              </div>
            </div>

            {/* Plan selection */}
            <label className="label">Choose plan</label>
            <div className="grid grid-cols-3 gap-2">
              {([3, 6, 12] as const).map((p) => {
                const base = PLAN_PRICES[p];
                const disc = PLAN_DISCOUNTS[p];
                const final = Math.round((base * (100 - disc)) / 100);
                const active = selectedPlan === p;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPlan(p);
                      setCustomDiscount(null);
                      setCustomBase(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className={`font-display text-lg font-bold ${active ? 'text-emerald-300' : 'text-white'}`}>
                      {p} mo
                    </p>
                    {disc > 0 && (
                      <p className="text-[10px] font-semibold text-emerald-400">
                        {disc}% off
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      <span className="line-through">{formatINR(base)}</span>
                    </p>
                    <p className="text-sm font-bold text-zinc-200">{formatINR(final)}</p>
                  </button>
                );
              })}
            </div>

            {/* Editable pricing */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Base price (editable)</label>
                <input
                  type="number"
                  className="input"
                  value={customBase ?? basePrice}
                  onChange={(e) => setCustomBase(Number(e.target.value) || null)}
                  placeholder={String(PLAN_PRICES[selectedPlan])}
                />
              </div>
              <div>
                <label className="label">Discount % (editable)</label>
                <input
                  type="number"
                  className="input"
                  value={customDiscount ?? discount}
                  onChange={(e) => setCustomDiscount(Number(e.target.value) || null)}
                  placeholder={String(PLAN_DISCOUNTS[selectedPlan])}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Base price</span>
                <span className="text-zinc-200">{formatINR(basePrice)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Tag size={13} /> Discount ({discount}%)
                </span>
                <span className="text-emerald-400">−{formatINR(basePrice - finalPrice)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                <span className="text-sm font-semibold text-white">Final price</span>
                <span className="font-display text-xl font-bold text-emerald-300">
                  {formatINR(finalPrice)}
                </span>
              </div>
            </div>

            {/* Simulated payment buttons */}
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Simulate payment result
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  className="btn-primary"
                  onClick={() => simulatePayment('paid')}
                >
                  <CheckCircle2 size={16} /> Mark Paid
                </button>
                <button
                  className="btn-danger"
                  onClick={() => simulatePayment('failed')}
                >
                  <XCircle size={16} /> Mark Failed
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-zinc-600">
                Simulated payment — no real money is charged or verified.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={confirmPayment}
        title={confirmStatus?.status === 'paid' ? 'Confirm renewal payment' : 'Confirm failed payment'}
        message={
          confirmStatus?.status === 'paid'
            ? `Record a simulated payment of ${formatINR(confirmStatus.finalPrice)} for ${confirmStatus.member.firstName} ${confirmStatus.member.lastName}? This will extend their membership by ${confirmStatus.plan} months.`
            : `Mark the payment for ${confirmStatus?.member.firstName} ${confirmStatus?.member.lastName} as failed? You can retry later.`
        }
        confirmLabel={confirmStatus?.status === 'paid' ? 'Confirm Payment' : 'Mark Failed'}
        danger={confirmStatus?.status === 'failed'}
      />
    </div>
  );
}
