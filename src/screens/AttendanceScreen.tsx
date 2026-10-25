import { useState } from 'react';
import {
  QrCode,
  Hand,
  CheckCircle2,
  XCircle,
  Search,
  Repeat,
  Camera,
  Zap,
} from 'lucide-react';
import type { AppData, Member } from '@/types';
import type { Store } from '@/store/useAppStore';
import { TODAY } from '@/store/useAppStore';
import { Avatar, EmptyState, Modal, SectionHeader } from '@/components/ui';
import { useToast } from '@/components/ui';
import { formatDate, formatINR } from '@/data/sampleData';

type ScanState = 'idle' | 'scanning' | 'success' | 'duplicate' | 'inactive';

export function AttendanceScreen({
  data,
  store,
  onOpenMember,
}: {
  data: AppData;
  store: Store;
  onOpenMember: (id: string) => void;
}) {
  const toast = useToast();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scannedMember, setScannedMember] = useState<Member | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  const todayStr = TODAY.toISOString().slice(0, 10);
  const todayCheckins = data.attendance
    .filter((a) => a.date === todayStr)
    .map((a) => ({
      rec: a,
      member: data.members.find((m) => m.id === a.memberId)!,
    }))
    .filter((x) => x.member);

  // Pick a rotating "sample" member for the demo scan button
  const activeMembers = data.members.filter((m) => m.status === 'active');
  const [scanIndex, setScanIndex] = useState(0);

  const runDemoScan = () => {
    if (scanState === 'scanning') return;
    setScanState('scanning');
    const member = activeMembers[scanIndex % activeMembers.length];
    setScannedMember(member);
    setScanIndex((i) => i + 1);

    setTimeout(() => {
      if (!member) {
        setScanState('idle');
        return;
      }
      const already = store.hasCheckedInToday(member.id);
      if (already) {
        setScanState('duplicate');
        toast.show('error', `${member.firstName} already checked in today.`);
      } else {
        store.addAttendance(member.id, 'qr');
        setScanState('success');
        toast.show('success', `Check-in recorded for ${member.firstName} ${member.lastName}.`);
      }
    }, 1800);
  };

  const manualCheckIn = (member: Member) => {
    if (store.hasCheckedInToday(member.id)) {
      toast.show('error', `${member.firstName} already checked in today.`);
      return;
    }
    if (member.status !== 'active') {
      toast.show('error', `${member.firstName}'s membership is ${member.status}. Cannot check in.`);
      return;
    }
    store.addAttendance(member.id, 'manual');
    toast.show('success', `Assisted check-in recorded for ${member.firstName}.`);
    setManualOpen(false);
    setManualQuery('');
  };

  const resetScanner = () => {
    setScanState('idle');
    setScannedMember(null);
  };

  const filteredManual = data.members.filter((m) => {
    const q = manualQuery.trim().toLowerCase();
    if (!q) return true;
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.phone.includes(q);
  });

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title="Attendance Check-in"
        subtitle="Simulated QR scanning — no real QR tokens are validated."
        icon={QrCode}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Scanner */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden p-5 sm:p-6">
            <div className="mx-auto max-w-sm">
              {/* Scanner viewport */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {/* Corner brackets */}
                <div className="pointer-events-none absolute inset-6">
                  <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-emerald-400/70 rounded-tl-lg" />
                  <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-emerald-400/70 rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-emerald-400/70 rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-emerald-400/70 rounded-br-lg" />
                </div>

                {scanState === 'idle' && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-400">
                      <Camera size={32} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-300">
                      Scanner ready
                    </p>
                    <p className="text-xs text-zinc-500">
                      Press the demo button to simulate scanning a member's QR pass.
                    </p>
                  </div>
                )}

                {scanState === 'scanning' && (
                  <div className="relative h-full">
                    <div className="scan-line absolute inset-x-6 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px] shadow-emerald-400/60" />
                    <div className="flex h-full items-center justify-center">
                      <div className="h-20 w-20 rounded-full border-2 border-emerald-400/40">
                        <div className="pulse-ring h-full w-full rounded-full border-2 border-emerald-400/60" />
                      </div>
                    </div>
                  </div>
                )}

                {scanState === 'success' && scannedMember && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="animate-check-pop rounded-full bg-emerald-500 p-3 text-black">
                      <CheckCircle2 size={36} />
                    </div>
                    <Avatar name={`${scannedMember.firstName} ${scannedMember.lastName}`} hue={scannedMember.avatarHue} size={48} />
                    <div>
                      <p className="font-display text-base font-bold text-white">
                        {scannedMember.firstName} {scannedMember.lastName}
                      </p>
                      <p className="text-xs text-emerald-400">Checked in successfully</p>
                    </div>
                    <button
                      onClick={resetScanner}
                      className="btn-outline mt-1 text-xs"
                    >
                      <Repeat size={14} /> Scan next
                    </button>
                  </div>
                )}

                {scanState === 'duplicate' && scannedMember && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="animate-check-pop rounded-full bg-amber-500 p-3 text-black">
                      <Repeat size={36} />
                    </div>
                    <Avatar name={`${scannedMember.firstName} ${scannedMember.lastName}`} hue={scannedMember.avatarHue} size={44} />
                    <div>
                      <p className="font-display text-base font-bold text-white">
                        {scannedMember.firstName} {scannedMember.lastName}
                      </p>
                      <p className="text-xs text-amber-400">Already checked in today</p>
                    </div>
                    <button onClick={resetScanner} className="btn-outline mt-1 text-xs">
                      <Repeat size={14} /> Try again
                    </button>
                  </div>
                )}

                {scanState === 'inactive' && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="animate-check-pop rounded-full bg-red-500 p-3 text-white">
                      <XCircle size={36} />
                    </div>
                    <p className="font-display text-base font-bold text-white">Membership inactive</p>
                    <button onClick={resetScanner} className="btn-outline mt-1 text-xs">
                      <Repeat size={14} /> Scan next
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-2.5">
                <button
                  className="btn-primary w-full"
                  onClick={runDemoScan}
                  disabled={scanState === 'scanning'}
                >
                  <Zap size={16} />
                  {scanState === 'scanning' ? 'Scanning…' : 'Demo Check-in Scan'}
                </button>
                <button
                  className="btn-outline w-full"
                  onClick={() => setManualOpen(true)}
                >
                  <Hand size={16} /> Assisted Manual Check-in
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] text-zinc-600">
                Simulated — does not read a real camera or validate real QR tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Today's list */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title text-base">Today's Check-ins</h3>
              <span className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {todayCheckins.length}
              </span>
            </div>
            {todayCheckins.length === 0 ? (
              <EmptyState
                icon={QrCode}
                title="No check-ins yet"
                message="Use the demo scan button to record a simulated check-in."
              />
            ) : (
              <div className="space-y-2">
                {todayCheckins.map(({ rec, member }) => (
                  <button
                    key={rec.id}
                    onClick={() => onOpenMember(member.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-emerald-500/20"
                  >
                    <Avatar name={`${member.firstName} ${member.lastName}`} hue={member.avatarHue} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {rec.method === 'qr' ? 'QR scan' : 'Assisted'}
                      </p>
                    </div>
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual check-in modal */}
      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Assisted Manual Check-in" size="md">
        <p className="mb-3 text-sm text-zinc-400">
          Select a member to record an assisted (front-desk) check-in.
        </p>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="input pl-11"
            placeholder="Search member name or phone…"
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
          />
        </div>
        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {filteredManual.map((m) => {
            const already = store.hasCheckedInToday(m.id);
            return (
              <button
                key={m.id}
                onClick={() => manualCheckIn(m)}
                disabled={already || m.status !== 'active'}
                className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-colors hover:border-emerald-500/20 disabled:opacity-40"
              >
                <Avatar name={`${m.firstName} ${m.lastName}`} hue={m.avatarHue} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {m.status !== 'active' ? `${m.status} · ` : ''}
                    {m.phone}
                  </p>
                </div>
                {already ? (
                  <span className="text-[11px] font-semibold text-amber-400">Done today</span>
                ) : (
                  <Hand size={16} className="text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
