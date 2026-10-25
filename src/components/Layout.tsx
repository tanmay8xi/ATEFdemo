import { useState } from 'react';
import { BRAND_ICON, BRAND_NAME, NAV_ITEMS, type ScreenId } from '@/components/nav';
import { Database, Menu, X } from 'lucide-react';

export function Sidebar({
  current,
  onNavigate,
}: {
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
}) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0c100e]">
      <BrandHeader />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? 'bg-emerald-500/10 text-emerald-300 shadow-[inset_0_0_0_1px] shadow-emerald-500/20'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
              }`}
            >
              <Icon size={18} className={active ? 'text-emerald-400' : ''} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <DemoBadge />
    </aside>
  );
}

export function MobileNav({
  current,
  onNavigate,
}: {
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
}) {
  const items = NAV_ITEMS;
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.08] bg-[#0c100e]/95 backdrop-blur-lg safe-bottom">
      <div className="flex items-stretch justify-between overflow-x-auto no-scrollbar px-1.5 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-[58px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-emerald-300' : 'text-zinc-500'
              }`}
            >
              <Icon size={20} className={active ? 'text-emerald-400' : ''} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#0c100e]/90 px-4 py-3 backdrop-blur-lg safe-top">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
          <BRAND_ICON size={18} />
        </div>
        <span className="font-display text-sm font-bold text-white">ATE Fitness</span>
      </div>
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-zinc-300 hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
    </header>
  );
}

export function MobileMenuSheet({
  open,
  onClose,
  current,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
}) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-72 bg-[#0c100e] border-l border-white/[0.08] p-4 animate-fade-in safe-top">
        <div className="flex items-center justify-between mb-6">
          <span className="font-display font-bold text-white">Menu</span>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-6">
          <DemoBadge inline />
        </div>
      </div>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
      <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
        <BRAND_ICON size={22} />
      </div>
      <div className="min-w-0">
        <h1 className="font-display text-sm font-bold leading-tight text-white truncate">
          All Time Elite
        </h1>
        <p className="text-[11px] font-medium text-emerald-400/80">Fitness Management</p>
      </div>
    </div>
  );
}

function DemoBadge({ inline = false }: { inline?: boolean }) {
  return (
    <div
      className={`mx-3 mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3.5 py-3 ${inline ? 'mx-0 mb-0' : ''}`}
    >
      <Database size={16} className="shrink-0 text-amber-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
          Demo Mode
        </p>
        <p className="text-[10px] leading-tight text-amber-200/70">
          Simulated data &amp; payments
        </p>
      </div>
    </div>
  );
}
