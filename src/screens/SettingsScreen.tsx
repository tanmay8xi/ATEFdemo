import { useState } from 'react';
import {
  Settings as SettingsIcon,
  AlertOctagon,
  Target,
  RotateCcw,
  Database,
  Info,
  ShieldAlert,
} from 'lucide-react';
import type { Store } from '@/store/useAppStore';
import { ConfirmDialog, SectionHeader } from '@/components/ui';

export function SettingsScreen({ store }: { store: Store }) {
  const { data, updateSettings, resetData } = store;
  const [threshold, setThreshold] = useState(data.settings.inactivityThresholdDays);
  const [goal, setGoal] = useState(data.settings.weeklyAttendanceGoal);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveThreshold = (v: number) => {
    const clamped = Math.max(1, Math.min(60, v));
    setThreshold(clamped);
    updateSettings({ inactivityThresholdDays: clamped });
  };
  const saveGoal = (v: number) => {
    const clamped = Math.max(1, Math.min(7, v));
    setGoal(clamped);
    updateSettings({ weeklyAttendanceGoal: clamped });
  };

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title="Settings"
        subtitle="Adjust demo parameters and reset sample data."
        icon={SettingsIcon}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inactivity threshold */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
              <AlertOctagon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Inactivity Threshold</h3>
              <p className="text-xs text-zinc-500">
                Days absent before a member appears on the No-Show Red List.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={3}
              max={30}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              onMouseUp={() => saveThreshold(threshold)}
              onTouchEnd={() => saveThreshold(threshold)}
              className="flex-1 accent-emerald-500"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={60}
                value={threshold}
                onChange={(e) => saveThreshold(Number(e.target.value))}
                className="input w-20 text-center"
              />
              <span className="text-sm text-zinc-400">days</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Currently: members absent {threshold}+ days appear on the Red List.
          </p>
        </div>

        {/* Weekly attendance goal */}
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Weekly Attendance Goal</h3>
              <p className="text-xs text-zinc-500">
                Target check-ins per day shown on the dashboard trend.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={7}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              onMouseUp={() => saveGoal(goal)}
              onTouchEnd={() => saveGoal(goal)}
              className="flex-1 accent-emerald-500"
            />
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={7}
                value={goal}
                onChange={(e) => saveGoal(Number(e.target.value))}
                className="input w-20 text-center"
              />
              <span className="text-sm text-zinc-400">/day</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Bars meeting the goal highlight in green on the dashboard.
          </p>
        </div>
      </div>

      {/* Reset data */}
      <div className="card border-amber-500/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Demo Data</h3>
              <p className="mt-0.5 max-w-md text-xs text-zinc-400">
                Restore all members, attendance, renewals and follow-ups to the original
                fictional sample set. Any demo changes you made will be replaced.
              </p>
            </div>
          </div>
          <button className="btn-danger shrink-0" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset Now
          </button>
        </div>
      </div>

      {/* About / demo notice */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Info size={18} className="text-sky-400" />
          <h3 className="text-base font-bold text-white">About This Demo</h3>
        </div>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <Database size={14} className="mt-0.5 shrink-0 text-zinc-500" />
            All members, names, phone numbers and payments are fictional sample data.
          </li>
          <li className="flex items-start gap-2">
            <Database size={14} className="mt-0.5 shrink-0 text-zinc-500" />
            Data is stored locally in your browser only — nothing is sent to a server.
          </li>
          <li className="flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5 shrink-0 text-zinc-500" />
            This prototype does not provide secure authentication, real payment
            verification, real QR fraud prevention, backups or production permissions.
          </li>
        </ul>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetData}
        title="Reset all demo data?"
        message="This will replace every member, attendance record, renewal and follow-up with the original fictional sample set. This cannot be undone."
        confirmLabel="Yes, Reset"
        danger
      />
    </div>
  );
}
