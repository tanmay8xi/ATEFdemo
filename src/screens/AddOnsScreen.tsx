import { useMemo, useState } from 'react';
import {
  Package,
  Dumbbell,
  Salad,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
} from 'lucide-react';
import type { AddOnService, AppData } from '@/types';
import { formatINR } from '@/data/sampleData';
import {
  EmptyState,
  Modal,
  SectionHeader,
} from '@/components/ui';
import { useToast } from '@/components/ui';

const CATEGORY_META: Record<
  AddOnService['category'],
  { label: string; icon: typeof Package; tint: string }
> = {
  personal_training: { label: 'Personal Training', icon: Dumbbell, tint: 'text-emerald-400 bg-emerald-500/10' },
  nutrition: { label: 'Nutrition', icon: Salad, tint: 'text-lime-400 bg-lime-500/10' },
  product: { label: 'Products', icon: ShoppingBag, tint: 'text-sky-400 bg-sky-500/10' },
};

export function AddOnsScreen({
  data,
  onOpenTerms,
}: {
  data: AppData;
  onOpenTerms: (service: AddOnService) => void;
}) {
  const [category, setCategory] = useState<AddOnService['category'] | 'all'>('all');

  const filtered = useMemo(
    () =>
      data.addOns.filter((a) => category === 'all' || a.category === category),
    [data.addOns, category],
  );

  const filters: Array<{ id: AddOnService['category'] | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'personal_training', label: 'Training' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'product', label: 'Products' },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title="Add-on Services"
        subtitle="Optional packages — nothing is preselected. No medical claims made."
        icon={Package}
      />

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setCategory(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              category === f.id
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                : 'border border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No services" message="No add-on services in this category." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((svc) => {
            const meta = CATEGORY_META[svc.category];
            const Icon = meta.icon;
            return (
              <div key={svc.id} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${meta.tint}`}>
                    <Icon size={20} />
                  </div>
                  {svc.available ? (
                    <span className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      <CheckCircle2 size={12} /> Available
                    </span>
                  ) : (
                    <span className="badge bg-zinc-500/15 text-zinc-400 border border-zinc-500/25">
                      <XCircle size={12} /> Out of stock
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-sm font-bold leading-snug text-white">
                  {svc.name}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {svc.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock size={13} />
                  {svc.durationLabel}
                </div>

                <div className="mt-auto pt-4">
                  <div className="flex items-end justify-between">
                    <span className="font-display text-xl font-bold text-emerald-300">
                      {formatINR(svc.price)}
                    </span>
                    <button
                      className="btn-outline text-xs"
                      onClick={() => onOpenTerms(svc)}
                    >
                      <FileText size={13} /> Terms
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TermsModal({
  service,
  onClose,
}: {
  service: AddOnService | null;
  onClose: () => void;
}) {
  const toast = useToast();
  if (!service) return null;
  const meta = CATEGORY_META[service.category];
  const Icon = meta.icon;

  return (
    <Modal open={!!service} onClose={onClose} title={service.name} size="md">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${meta.tint}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">{service.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Price</p>
          <p className="font-display text-lg font-bold text-emerald-300">
            {formatINR(service.price)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Duration</p>
          <p className="text-sm font-semibold text-zinc-200">{service.durationLabel}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="label">Terms &amp; conditions</p>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3.5 text-xs leading-relaxed text-zinc-400">
          {service.terms}
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button className="btn-outline flex-1" onClick={onClose}>
          Close
        </button>
        <button
          className="btn-primary flex-1"
          disabled={!service.available}
          onClick={() => {
            toast.show('info', 'Simulated — add-on purchases are not processed in this demo.');
            onClose();
          }}
        >
          <Plus size={16} /> Simulate Purchase
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-600">
        Demo only — no real purchase is made. Nothing is preselected.
      </p>
    </Modal>
  );
}
