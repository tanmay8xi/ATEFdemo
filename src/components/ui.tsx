import { useEffect, useState, createContext, useContext } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';

// ---------- Avatar ----------

export function Avatar({
  name,
  hue,
  size = 40,
}: {
  name: string;
  hue: number;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-black"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 62%), hsl(${(hue + 40) % 360}, 70%, 48%))`,
      }}
    >
      {initials}
    </div>
  );
}

// ---------- Status badges ----------

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  expired: 'bg-red-500/15 text-red-300 border border-red-500/25',
  frozen: 'bg-sky-500/15 text-sky-300 border border-sky-500/25',
  paused: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  cancelled: 'bg-zinc-500/15 text-zinc-300 border border-zinc-500/25',
  pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  paid: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  failed: 'bg-red-500/15 text-red-300 border border-red-500/25',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.active;
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const maxW = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxW} card border-white/10 bg-[#11161300] sm:bg-[#11161399] max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl animate-fade-in`}
        style={{ backgroundColor: '#111613' }}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- Confirm dialog ----------

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
      <div className="mt-5 flex gap-2.5">
        <button className="btn-outline flex-1" onClick={onClose}>
          Cancel
        </button>
        <button
          className={danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Toast ----------

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContext = createContext<{
  show: (type: ToastType, message: string) => void;
}>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/30 text-emerald-200',
  error: 'border-red-500/30 text-red-200',
  info: 'border-sky-500/30 text-sky-200',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 safe-top">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-[#151b17]/95 px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-md animate-fade-in ${TOAST_STYLES[t.type]}`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ---------- Empty state ----------

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      <div className="mb-3 rounded-2xl bg-white/[0.04] p-3.5">
        <Icon size={26} className="text-zinc-500" />
      </div>
      <h3 className="text-base font-bold text-zinc-200">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Section header ----------

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
