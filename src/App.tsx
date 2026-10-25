import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ToastProvider } from '@/components/ui';
import {
  MobileMenuSheet,
  MobileNav,
  MobileTopBar,
  Sidebar,
} from '@/components/Layout';
import type { ScreenId } from '@/components/nav';
import { DashboardScreen } from '@/screens/DashboardScreen';
import {
  AddMemberModal,
  MemberDetailScreen,
  MembersScreen,
} from '@/screens/MembersScreen';
import { AttendanceScreen } from '@/screens/AttendanceScreen';
import { RedListScreen } from '@/screens/RedListScreen';
import { RenewalsScreen } from '@/screens/RenewalsScreen';
import {
  AddOnsScreen,
  TermsModal,
} from '@/screens/AddOnsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import type { AddOnService } from '@/types';

function App() {
  const store = useAppStore();
  const { data } = store;

  const [screen, setScreen] = useState<ScreenId>('dashboard');
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [termsService, setTermsService] = useState<AddOnService | null>(null);

  const openMember = (id: string) => {
    setOpenMemberId(id);
    setScreen('members');
  };

  const navigate = (id: ScreenId) => {
    setScreen(id);
    if (id !== 'members') setOpenMemberId(null);
  };

  const openMemberRecord = openMemberId
    ? data.members.find((m) => m.id === openMemberId) ?? null
    : null;

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':
        return (
          <DashboardScreen
            data={data}
            onNavigate={navigate}
            onOpenMember={openMember}
          />
        );
      case 'members':
        return openMemberRecord ? (
          <MemberDetailScreen
            member={openMemberRecord}
            data={data}
            onBack={() => setOpenMemberId(null)}
            onCheckIn={(id) => {
              setOpenMemberId(null);
              setScreen('attendance');
              void id;
            }}
          />
        ) : (
          <MembersScreen
            data={data}
            onOpenMember={openMember}
            onAddMember={() => setAddMemberOpen(true)}
          />
        );
      case 'attendance':
        return (
          <AttendanceScreen
            data={data}
            store={store}
            onOpenMember={openMember}
          />
        );
      case 'redlist':
        return (
          <RedListScreen
            data={data}
            store={store}
            onOpenMember={openMember}
          />
        );
      case 'renewals':
        return (
          <RenewalsScreen
            data={data}
            store={store}
            onOpenMember={openMember}
          />
        );
      case 'addons':
        return <AddOnsScreen data={data} onOpenTerms={setTermsService} />;
      case 'settings':
        return <SettingsScreen store={store} />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#090b0a]">
        <Sidebar current={screen} onNavigate={navigate} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar onMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8 lg:pt-8">
            <div className="mx-auto max-w-6xl">{renderScreen()}</div>
          </main>
        </div>
        <MobileNav current={screen} onNavigate={navigate} />
        <MobileMenuSheet
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          current={screen}
          onNavigate={navigate}
        />
        <AddMemberModal
          open={addMemberOpen}
          onClose={() => setAddMemberOpen(false)}
          store={store}
        />
        <TermsModal
          service={termsService}
          onClose={() => setTermsService(null)}
        />
      </div>
    </ToastProvider>
  );
}

export default App;
