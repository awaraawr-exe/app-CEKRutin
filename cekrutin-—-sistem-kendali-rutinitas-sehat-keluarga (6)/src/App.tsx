import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Activity,
  BookOpenCheck,
  CalendarClock,
  HeartPulse,
  Home,
  Lock,
  LogOut,
  Smartphone,
  UserPlus,
  Users,
  WifiOff,
} from 'lucide-react';
import {
  AppTab,
  CekRutinStore,
  CertificateRecord,
  FamilyManagerAccount,
  FamilyMember,
  FaskesVisit,
  HealthCheckRecord,
  RoutineReminder,
  StepLogEntry,
} from './types/health';
import {
  calculateMemberStreak,
  createDefaultStore,
  getOrCreateRoutineLog,
  getTodayDateString,
  loadCekRutinStore,
  saveCekRutinStore,
} from './lib/storage';
import {calculateBmi, evaluateFullHealthCheck} from './lib/hbmEvaluator';
import {
  findRegisteredAccountByEmail,
  verifyManagerCredentials,
} from './lib/authCrypto';
import {useOnlineStatus, usePWAInstall} from './hooks/usePWAInstall';
import {PWAInstallModal} from './components/PWAInstallModal';
import {GoogleLoginSplash, LocalGoogleUser} from './components/GoogleLoginSplash';
import {DashboardRoutineView} from './views/DashboardRoutineView';
import {HealthCheckView} from './views/HealthCheckView';
import {RemindersAgendaView} from './views/RemindersAgendaView';
import {EducationQuizView} from './views/EducationQuizView';
import {FamilyProfilesView} from './views/FamilyProfilesView';

const AUTH_SESSION_KEY = 'cekrutin_auth_session_v2';

interface PersistedAuthSession {
  status: 'LoggedIn';
  uid: string;
  name: string;
  email: string;
  loggedInAt: string;
}

function readPersistedSession(): PersistedAuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuthSession;
    if (
      parsed &&
      parsed.status === 'LoggedIn' &&
      parsed.uid &&
      parsed.email &&
      findRegisteredAccountByEmail(parsed.email)
    ) {
      return parsed;
    }
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // Ignore parse error
  }
  return null;
}

const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{className?: string}>;
}> = [
  {id: 'beranda', label: 'Beranda & Rutinitas', shortLabel: 'Beranda', icon: Home},
  {id: 'cek', label: 'Cek Kesehatan', shortLabel: 'Cek Medis', icon: HeartPulse},
  {id: 'agenda', label: 'Pengingat & Faskes', shortLabel: 'Agenda', icon: CalendarClock},
  {id: 'edukasi', label: 'Edukasi & Sertifikat', shortLabel: 'Edukasi', icon: BookOpenCheck},
  {id: 'keluarga', label: 'Profil Keluarga', shortLabel: 'Keluarga', icon: Users},
];

export default function App() {
  const [session, setSession] = useState<PersistedAuthSession | null>(() => readPersistedSession());
  const [store, setStore] = useState<CekRutinStore | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('beranda');
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [prefillAgendaReason, setPrefillAgendaReason] = useState<string | undefined>(undefined);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [cueBanner, setCueBanner] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const {isInstalled} = usePWAInstall();

  // Load persistent local IndexedDB/localStorage workspace whenever user session is LoggedIn
  useEffect(() => {
    if (!session) {
      setStore(null);
      return;
    }
    let active = true;
    loadCekRutinStore({
      uid: session.uid,
      name: session.name,
      email: session.email,
    }).then((loaded) => {
      if (!active) return;
      const hydrated: CekRutinStore = {
        ...loaded,
        manager: {
          ...loaded.manager,
          id: session.uid,
          name: loaded.manager.name || session.name,
          email: session.email,
        },
      };
      setStore(hydrated);
    });
    return () => {
      active = false;
    };
  }, [session]);

  const updateStore = useCallback(
    (updater: (prev: CekRutinStore) => CekRutinStore) => {
      const uid = session?.uid || 'default';
      setStore((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        void saveCekRutinStore(next, uid);
        return next;
      });
    },
    [session],
  );

  // Periodic Habit Loop Reminder Check (Web Notification API + In-App Cue)
  useEffect(() => {
    if (!store || !session) return;
    const checkReminders = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = getTodayDateString();

      const due = store.reminders.filter(
        (r) => r.enabled && r.time === hhmm && r.lastTriggeredDate !== today,
      );

      if (due.length > 0) {
        due.forEach((rem) => {
          const member = store.members.find((m) => m.id === rem.memberId);
          const bodyText = `${rem.title} untuk ${member?.name || 'Keluarga'} — Ingat, Periksa, Jaga Sehat.`;
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('CEKRutin · Waktunya Rutinitas Sehat', {
              body: bodyText,
              icon: '/pwa-192x192.png',
            });
          } else {
            setCueBanner(bodyText);
          }
        });

        updateStore((prev) => ({
          ...prev,
          reminders: prev.reminders.map((r) =>
            due.some((d) => d.id === r.id) ? {...r, lastTriggeredDate: today} : r,
          ),
        }));
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(timer);
  }, [store, session, updateStore]);

  const activeMember = useMemo(() => {
    if (!store || store.members.length === 0) return null;
    return store.members.find((m) => m.id === store.activeMemberId) || store.members[0] || null;
  }, [store]);

  const handleCompleteLogin = (account: LocalGoogleUser) => {
    const newSession: PersistedAuthSession = {
      status: 'LoggedIn',
      uid: account.uid,
      name: account.name,
      email: account.email,
      loggedInAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
    } catch {
      // Ignore storage errors
    }
    setSession(newSession);
    setUnlockEmail('');
    setUnlockPassword('');
    setUnlockError(null);
    setActiveTab('beranda');
  };

  const handleSignOut = () => {
    try {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
    setSession(null);
    setStore(null);
    setUnlockEmail('');
    setUnlockPassword('');
    setUnlockError(null);
    setActiveTab('beranda');
  };

  // Splash Screen / Google Sign-In Gate when not LoggedIn
  if (!session) {
    return (
      <>
        <GoogleLoginSplash
          onCompleteLogin={handleCompleteLogin}
          onOpenPwaGuide={() => setShowPwaModal(true)}
        />
        <PWAInstallModal open={showPwaModal} onClose={() => setShowPwaModal(false)} />
      </>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Activity className="w-8 h-8 text-teal-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Membuka dasbor keluarga {session.name}...
          </p>
        </div>
      </div>
    );
  }

  // Password-Verified Session Lock Screen
  if (store.manager.isLocked) {
    const handleUnlock = async (e: React.FormEvent) => {
      e.preventDefault();
      setUnlockError(null);

      if (unlockEmail.trim().toLowerCase() !== session.email.trim().toLowerCase()) {
        setUnlockError('Email tidak sesuai dengan akun pengelola sesi yang sedang aktif.');
        return;
      }

      setUnlocking(true);
      const res = await verifyManagerCredentials(unlockEmail, unlockPassword);
      setUnlocking(false);

      if (!res.ok) {
        setUnlockError(res.error);
        return;
      }

      setUnlockEmail('');
      setUnlockPassword('');
      updateStore((prev) => ({
        ...prev,
        manager: {...prev.manager, isLocked: false},
      }));
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Sesi CEKRutin Terkunci</h1>
            <p className="text-xs text-slate-500">
              Verifikasi email dan password pengelola ({store.manager.name}) untuk membuka kembali
              dasbor keluarga.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3.5">
            <div>
              <label
                htmlFor="unlock-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Alamat Email Pengelola
              </label>
              <input
                id="unlock-email"
                type="email"
                required
                autoFocus
                placeholder="namaanda@gmail.com"
                value={unlockEmail}
                onChange={(e) => setUnlockEmail(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            <div>
              <label
                htmlFor="unlock-password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <input
                id="unlock-password"
                type="password"
                required
                placeholder="Masukkan password Anda"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-2 focus:outline-teal-600"
              />
            </div>

            {unlockError && (
              <p role="alert" className="text-xs text-red-600 text-center font-medium">
                {unlockError}
              </p>
            )}

            <button
              type="submit"
              disabled={unlocking}
              className="w-full min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {unlocking ? 'Memverifikasi...' : 'Buka Dasbor'}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Keluar & Ganti Akun
            </button>
          </form>
        </div>
      </div>
    );
  }

  const today = getTodayDateString();
  const todayLog = activeMember
    ? getOrCreateRoutineLog(store.routineLogs, activeMember.id, today)
    : null;
  const streakDays = activeMember ? calculateMemberStreak(store.routineLogs, activeMember.id) : 0;

  const memberLatestHealth = activeMember
    ? store.healthChecks
        .filter((h) => h.memberId === activeMember.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]
    : undefined;

  // Mutators
  const upsertTodayRoutine = (
    mutator: (
      log: ReturnType<typeof getOrCreateRoutineLog>,
    ) => ReturnType<typeof getOrCreateRoutineLog>,
  ) => {
    if (!activeMember) return;
    updateStore((prev) => {
      const current = getOrCreateRoutineLog(prev.routineLogs, activeMember.id, today);
      const updated = mutator(current);
      const exists = prev.routineLogs.some((l) => l.id === updated.id);
      return {
        ...prev,
        routineLogs: exists
          ? prev.routineLogs.map((l) => (l.id === updated.id ? updated : l))
          : [...prev.routineLogs, updated],
      };
    });
  };

  const handleUpdateWater = (delta: number) => {
    upsertTodayRoutine((log) => ({
      ...log,
      waterGlasses: Math.max(0, Math.min(24, log.waterGlasses + delta)),
    }));
  };

  const handleUpdateFruit = (delta: number) => {
    upsertTodayRoutine((log) => ({
      ...log,
      fruitPortions: Math.max(0, Math.min(15, log.fruitPortions + delta)),
    }));
  };

  const handleUpdateVegetable = (delta: number) => {
    upsertTodayRoutine((log) => ({
      ...log,
      vegetablePortions: Math.max(0, Math.min(15, log.vegetablePortions + delta)),
    }));
  };

  const handleAddMicroActivity = (label: string, minutes: number) => {
    upsertTodayRoutine((log) => ({
      ...log,
      activities: [
        ...log.activities,
        {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label,
          minutes,
          loggedAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const handleRemoveMicroActivity = (activityId: string) => {
    upsertTodayRoutine((log) => ({
      ...log,
      activities: log.activities.filter((a) => a.id !== activityId),
    }));
  };

  const handleAddSteps = (entry: Omit<StepLogEntry, 'id' | 'loggedAt'>) => {
    upsertTodayRoutine((log) => {
      const created: StepLogEntry = {
        ...entry,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        loggedAt: new Date().toISOString(),
      };
      const nextEntries = [created, ...(log.stepEntries ?? [])];
      const nextTotal = (log.stepsCount ?? 0) + entry.steps;
      return {
        ...log,
        stepsCount: nextTotal,
        stepEntries: nextEntries,
      };
    });
  };

  const handleRemoveStepEntry = (entryId: string) => {
    upsertTodayRoutine((log) => {
      const currentEntries = log.stepEntries ?? [];
      const removed = currentEntries.find((e) => e.id === entryId);
      const nextEntries = currentEntries.filter((e) => e.id !== entryId);
      const nextTotal = Math.max(0, (log.stepsCount ?? 0) - (removed?.steps ?? 0));
      return {
        ...log,
        stepsCount: nextTotal,
        stepEntries: nextEntries,
      };
    });
  };

  const handleUpdateMemberStepTarget = (memberId: string, newTarget: number) => {
    updateStore((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === memberId ? {...m, targetSteps: newTarget} : m,
      ),
    }));
  };

  const handleAddHealthCheck = (
    input: Omit<HealthCheckRecord, 'id' | 'overallStatus' | 'bmi'>,
  ) => {
    const evalResult = evaluateFullHealthCheck(input);
    const bmi = calculateBmi(input.weightKg, input.heightCm);
    const newRecord: HealthCheckRecord = {
      ...input,
      id: `hc-${Date.now()}`,
      bmi,
      overallStatus: evalResult.overallStatus,
    };
    updateStore((prev) => ({
      ...prev,
      healthChecks: [newRecord, ...prev.healthChecks],
    }));
  };

  const handleDeleteHealthCheck = (recordId: string) => {
    updateStore((prev) => ({
      ...prev,
      healthChecks: prev.healthChecks.filter((h) => h.id !== recordId),
    }));
  };

  const handleQuickSchedulePuskesmas = (memberId: string, reason: string) => {
    updateStore((prev) => ({...prev, activeMemberId: memberId}));
    setPrefillAgendaReason(reason);
    setActiveTab('agenda');
  };

  const handleAddReminder = (rem: Omit<RoutineReminder, 'id'>) => {
    const created: RoutineReminder = {...rem, id: `rem-${Date.now()}`};
    updateStore((prev) => ({
      ...prev,
      reminders: [...prev.reminders, created],
    }));
  };

  const handleToggleReminder = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) => (r.id === id ? {...r, enabled: !r.enabled} : r)),
    }));
  };

  const handleDeleteReminder = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== id),
    }));
  };

  const handleAddVisit = (visit: Omit<FaskesVisit, 'id' | 'completed'>) => {
    const created: FaskesVisit = {...visit, id: `vis-${Date.now()}`, completed: false};
    updateStore((prev) => ({
      ...prev,
      faskesVisits: [...prev.faskesVisits, created],
    }));
  };

  const handleToggleVisitComplete = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      faskesVisits: prev.faskesVisits.map((v) =>
        v.id === id ? {...v, completed: !v.completed} : v,
      ),
    }));
  };

  const handleDeleteVisit = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      faskesVisits: prev.faskesVisits.filter((v) => v.id !== id),
    }));
  };

  const handleIssueCertificate = (score: number, totalQuestions: number): CertificateRecord => {
    const cert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      certificateNumber: `CR-${new Date().getFullYear()}-${String(
        Math.floor(1000 + Math.random() * 9000),
      )}`,
      recipientName: activeMember?.name || store.manager.name,
      memberRole: activeMember?.role || 'Pengelola',
      score,
      totalQuestions,
      issuedAt: new Date().toISOString(),
    };
    updateStore((prev) => ({
      ...prev,
      certificates: [cert, ...prev.certificates],
    }));
    return cert;
  };

  const handleSelectMember = (memberId: string) => {
    updateStore((prev) => ({...prev, activeMemberId: memberId}));
  };

  const handleAddMember = (member: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    const created: FamilyMember = {
      ...member,
      id: `mem-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    updateStore((prev) => ({
      ...prev,
      members: [...prev.members, created],
      activeMemberId: created.id,
    }));
  };

  const handleUpdateMember = (updated: FamilyMember) => {
    updateStore((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === updated.id ? updated : m)),
    }));
  };

  const handleDeleteMember = (memberId: string) => {
    const remaining = store.members.filter((m) => m.id !== memberId);
    const nextActiveId =
      remaining.length === 0
        ? ''
        : store.activeMemberId === memberId
          ? remaining[0].id
          : store.activeMemberId;

    updateStore((prev) => ({
      ...prev,
      members: remaining,
      activeMemberId: nextActiveId,
    }));
  };

  const handleUpdateManager = (manager: FamilyManagerAccount) => {
    updateStore((prev) => ({...prev, manager}));
  };

  const handleResetDemoData = () => {
    const fresh = createDefaultStore({
      uid: session.uid,
      name: session.name,
      email: session.email,
    });
    setStore(fresh);
    void saveCekRutinStore(fresh, session.uid);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Logo CEKRutin" className="w-9 h-9 rounded-xl shrink-0" />
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 block leading-none">
                CEKRutin
              </span>
              <span className="text-[11px] font-medium text-teal-700 mt-1 block">
                Ingat, Periksa, Jaga Sehat
              </span>
            </div>
          </div>
        </div>

        {/* Family Member Quick Switcher in Sidebar */}
        <div className="px-4 py-4 border-b border-slate-100 space-y-2">
          <label
            htmlFor="desktop-member-select"
            className="block px-2 text-xs font-semibold text-slate-500"
          >
            Anggota Keluarga Aktif
          </label>
          {store.members.length > 0 && activeMember ? (
            <select
              id="desktop-member-select"
              value={activeMember.id}
              onChange={(e) => handleSelectMember(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 focus:outline-2 focus:outline-teal-600 cursor-pointer"
            >
              {store.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('keluarga')}
              className="w-full min-h-[42px] rounded-xl border border-dashed border-teal-300 bg-teal-50/70 hover:bg-teal-50 px-3 text-xs font-semibold text-teal-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Anggota Pertama</span>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu Utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[46px] px-3.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 border border-teal-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom PWA Install & Google Manager Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {!isInstalled && (
            <button
              type="button"
              onClick={() => setShowPwaModal(true)}
              className="w-full min-h-[42px] px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Instal Aplikasi di HP</span>
            </button>
          )}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {store.manager.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{store.manager.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {store.manager.email || store.manager.puskesmasName || 'Pengelola Keluarga'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Keluar (Logout)"
              aria-label="Keluar (Logout)"
              className="min-h-[36px] min-w-[36px] rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-68 flex flex-col min-h-screen">
        {/* Top Bar (3-zone contract, <=56px on mobile) */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('beranda');
            }}
            className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <img src="/icon.svg" alt="" className="w-6 h-6 rounded-md lg:hidden" />
            <span>CEKRutin</span>
          </a>

          {/* Zone 2: Mobile Member Switcher / Desktop Quick Nav Links */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="lg:hidden w-full max-w-[190px]">
              {store.members.length > 0 && activeMember ? (
                <select
                  aria-label="Pilih Anggota Keluarga"
                  value={activeMember.id}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 truncate"
                >
                  {store.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('keluarga')}
                  className="w-full min-h-[36px] rounded-lg border border-teal-200 bg-teal-50 px-2.5 text-xs font-semibold text-teal-800 truncate cursor-pointer"
                >
                  + Tambah Anggota
                </button>
              )}
            </div>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              {NAV_ITEMS.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? 'text-teal-700 font-semibold underline underline-offset-4'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {item.shortLabel}
                </button>
              ))}
            </nav>
          </div>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            {!isInstalled ? (
              <button
                type="button"
                onClick={() => setShowPwaModal(true)}
                className="min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instal Aplikasi di HP</span>
                <span className="sm:hidden">Instal HP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('cek')}
                className="min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Cek Kesehatan
              </button>
            )}
          </div>
        </header>

        {/* Non-intrusive Offline / In-App Cue Notice */}
        {(!isOnline || cueBanner) && (
          <div className="px-4 sm:px-6 pt-3 space-y-2 max-w-7xl w-full mx-auto">
            {!isOnline && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-medium text-amber-950 flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Mode Offline Aktif — Seluruh perubahan disimpan permanen di perangkat Anda.
                </span>
              </div>
            )}
            {cueBanner && (
              <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-2.5 text-xs font-medium text-teal-950 flex items-center justify-between gap-3">
                <span>{cueBanner}</span>
                <button
                  type="button"
                  onClick={() => setCueBanner(null)}
                  className="font-semibold text-teal-800 hover:underline shrink-0 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 pb-24 lg:pb-10">
          {activeTab === 'beranda' && (
            <DashboardRoutineView
              managerName={store.manager.name}
              managerEmail={store.manager.email}
              familyMembers={store.members}
              activeMember={activeMember}
              todayLog={todayLog}
              routineLogs={store.routineLogs}
              streakDays={streakDays}
              latestHealthCheck={memberLatestHealth}
              upcomingVisits={store.faskesVisits}
              onSelectMember={handleSelectMember}
              onUpdateWater={handleUpdateWater}
              onUpdateFruit={handleUpdateFruit}
              onUpdateVegetable={handleUpdateVegetable}
              onAddMicroActivity={handleAddMicroActivity}
              onRemoveMicroActivity={handleRemoveMicroActivity}
              onAddSteps={handleAddSteps}
              onRemoveStepEntry={handleRemoveStepEntry}
              onUpdateMemberStepTarget={handleUpdateMemberStepTarget}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'cek' && (
            <HealthCheckView
              activeMember={activeMember}
              records={store.healthChecks}
              onAddHealthCheck={handleAddHealthCheck}
              onDeleteHealthCheck={handleDeleteHealthCheck}
              onQuickSchedulePuskesmas={handleQuickSchedulePuskesmas}
              onAddFirstMember={() => setActiveTab('keluarga')}
            />
          )}

          {activeTab === 'agenda' && (
            <RemindersAgendaView
              members={store.members}
              activeMember={activeMember}
              defaultFacilityName={store.manager.puskesmasName}
              reminders={store.reminders}
              faskesVisits={store.faskesVisits}
              prefillReason={prefillAgendaReason}
              onClearPrefillReason={() => setPrefillAgendaReason(undefined)}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onAddVisit={handleAddVisit}
              onToggleVisitComplete={handleToggleVisitComplete}
              onDeleteVisit={handleDeleteVisit}
              onAddFirstMember={() => setActiveTab('keluarga')}
            />
          )}

          {activeTab === 'edukasi' && (
            <EducationQuizView
              managerName={store.manager.name}
              activeMember={activeMember}
              certificates={store.certificates}
              onIssueCertificate={handleIssueCertificate}
            />
          )}

          {activeTab === 'keluarga' && (
            <FamilyProfilesView
              store={store}
              onSelectMember={handleSelectMember}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onUpdateManager={handleUpdateManager}
              onResetDemoData={handleResetDemoData}
              onSignOut={handleSignOut}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Tab Bar (Thumb-Zone Navigation) */}
      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer ${
                  isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Interactive PWA Install Guide Modal */}
      <PWAInstallModal open={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </div>
  );
}
