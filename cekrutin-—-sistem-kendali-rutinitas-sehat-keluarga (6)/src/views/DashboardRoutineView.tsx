import React, {useEffect, useState} from 'react';
import {
  Apple,
  ArrowRight,
  BellRing,
  Check,
  Droplets,
  Flame,
  Footprints,
  Minus,
  Play,
  Plus,
  Salad,
  Square,
  Stethoscope,
  UserPlus,
} from 'lucide-react';
import {
  AppTab,
  DailyRoutineLog,
  FamilyMember,
  FaskesVisit,
  HealthCheckRecord,
  MicroActivityEntry,
  StepLogEntry,
} from '../types/health';
import {evaluateFullHealthCheck, PROMOTIVE_DISCLAIMER} from '../lib/hbmEvaluator';
import {StatusIndicator} from '../components/StatusBadge';
import {StepTrackerSection} from '../components/StepTrackerSection';

interface DashboardRoutineViewProps {
  managerName: string;
  managerEmail?: string;
  familyMembers: FamilyMember[];
  activeMember: FamilyMember | null;
  todayLog: DailyRoutineLog | null;
  routineLogs: DailyRoutineLog[];
  streakDays: number;
  latestHealthCheck?: HealthCheckRecord;
  upcomingVisits: FaskesVisit[];
  onSelectMember: (memberId: string) => void;
  onUpdateWater: (delta: number) => void;
  onUpdateFruit: (delta: number) => void;
  onUpdateVegetable: (delta: number) => void;
  onAddMicroActivity: (label: string, minutes: number) => void;
  onRemoveMicroActivity: (activityId: string) => void;
  onAddSteps: (entry: Omit<StepLogEntry, 'id' | 'loggedAt'>) => void;
  onRemoveStepEntry: (entryId: string) => void;
  onUpdateMemberStepTarget: (memberId: string, newTarget: number) => void;
  onNavigateTab: (tab: AppTab) => void;
}

const MICRO_ACTIVITY_PRESETS = [
  {id: 'stretch', label: 'Peregangan Pagi / Leher', minutes: 5, hint: 'Atasi kaku otot'},
  {id: 'walk10', label: 'Jalan Kaki Ringan', minutes: 10, hint: 'Keliling rumah/teras'},
  {id: 'stairs', label: 'Naik-Turun Tangga / Langkah Cepat', minutes: 5, hint: 'Jantung sehat'},
  {id: 'chair', label: 'Senam Kursi / Lansia', minutes: 10, hint: 'Aman untuk sendi'},
  {id: 'chore', label: 'Bersih Rumah Aktif', minutes: 15, hint: 'Gerak produktif'},
];

export const DashboardRoutineView: React.FC<DashboardRoutineViewProps> = ({
  managerName,
  managerEmail,
  familyMembers,
  activeMember,
  todayLog,
  routineLogs,
  streakDays,
  latestHealthCheck,
  upcomingVisits,
  onSelectMember,
  onUpdateWater,
  onUpdateFruit,
  onUpdateVegetable,
  onAddMicroActivity,
  onRemoveMicroActivity,
  onAddSteps,
  onRemoveStepEntry,
  onUpdateMemberStepTarget,
  onNavigateTab,
}) => {
  const [activeTimer, setActiveTimer] = useState<{
    label: string;
    totalSeconds: number;
    remainingSeconds: number;
  } | null>(null);

  useEffect(() => {
    if (!activeTimer) return;
    if (activeTimer.remainingSeconds <= 0) {
      onAddMicroActivity(activeTimer.label, Math.round(activeTimer.totalSeconds / 60));
      setActiveTimer(null);
      return;
    }
    const id = window.setInterval(() => {
      setActiveTimer((prev) =>
        prev ? {...prev, remainingSeconds: prev.remainingSeconds - 1} : null,
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeTimer, onAddMicroActivity]);

  if (!activeMember || !todayLog || familyMembers.length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 text-center space-y-5 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
            <UserPlus className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-teal-700">
              Pengelola Keluarga: {managerName}
              {managerEmail ? ` · ${managerEmail}` : ''}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Selamat Datang di CEKRutin
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Dasbor Anda masih bersih (0 anggota keluarga, 0 log harian, dan 0 riwayat pemeriksaan).
              Tambahkan profil anggota keluarga pertama Anda—seperti Ayah, Ibu, Anak, atau
              Lansia—untuk mulai mencatat rutinitas sehat dan memantau cek kesehatan.
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('keluarga')}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Anggota Keluarga Pertama</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('edukasi')}
              className="min-h-[48px] px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Baca Edukasi PTM
            </button>
          </div>
        </section>
      </div>
    );
  }

  const waterTarget = activeMember.targetWaterGlasses || 8;
  const waterPct = Math.min(100, Math.round((todayLog.waterGlasses / waterTarget) * 100));
  const waterLiters = (todayLog.waterGlasses * 0.25).toFixed(2);
  const targetLiters = (waterTarget * 0.25).toFixed(1);

  const fruitVegTotal = todayLog.fruitPortions + todayLog.vegetablePortions;
  const fruitVegTarget = activeMember.targetFruitVegPortions || 5;
  const fruitVegPct = Math.min(100, Math.round((fruitVegTotal / fruitVegTarget) * 100));

  const activityMinutesTotal = todayLog.activities.reduce((sum, a) => sum + a.minutes, 0);
  const activityTarget = activeMember.targetActivityMinutes || 15;
  const activityPct = Math.min(100, Math.round((activityMinutesTotal / activityTarget) * 100));

  const stepTarget =
    activeMember.targetSteps ?? (activeMember.role === 'Lansia' ? 4000 : 6000);
  const stepPct = Math.min(
    100,
    Math.round(((todayLog.stepsCount ?? 0) / Math.max(1, stepTarget)) * 100),
  );

  const dailyScorePct = Math.round((waterPct + fruitVegPct + activityPct + stepPct) / 4);

  const healthEval = latestHealthCheck ? evaluateFullHealthCheck(latestHealthCheck) : null;
  const nextVisit = upcomingVisits
    .filter((v) => v.memberId === activeMember.id && !v.completed)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Connected Family Sub-Profiles Switcher under Google Family Health Manager */}
      <section className="rounded-2xl bg-white border border-slate-200 px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-teal-700">
            Pengelola Keluarga: {managerName}
            {managerEmail ? ` · ${managerEmail}` : ''}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih sub-profil anggota keluarga untuk dipantau atau dicatat rutinitasnya:
          </p>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {familyMembers.map((member) => {
            const isSelected = member.id === activeMember.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectMember(member.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {member.role} · {member.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Cue & Daily Habit Summary Hero */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Profil Aktif: {activeMember.name}</span>
              <span aria-hidden="true">·</span>
              <span>{activeMember.role}</span>
              <span aria-hidden="true">·</span>
              <span>{activeMember.age} Tahun</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Rutinitas Sehat Hari Ini
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Catat kebiasaan sehat dengan satu ketukan. Konsistensi kecil setiap hari menjaga
              keluarga tetap bugar dan mencegah risiko Penyakit Tidak Menular (PTM).
            </p>

            {/* Cue Banner for Upcoming Visit or Health Follow-up */}
            {nextVisit ? (
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-sky-900 bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5">
                <BellRing className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Agenda Faskes Terdekat:{' '}
                  <strong className="font-semibold">{nextVisit.facilityName}</strong> pada{' '}
                  <span className="font-mono tabular-nums font-semibold">
                    {new Date(nextVisit.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>{' '}
                  ({nextVisit.time} WIB)
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('agenda')}
                  className="text-sky-700 font-semibold hover:underline ml-auto whitespace-nowrap cursor-pointer"
                >
                  Lihat Agenda
                </button>
              </div>
            ) : null}
          </div>

          {/* Reward Progress & Streak Summary */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 flex flex-col justify-between">
              <span className="text-xs font-semibold text-teal-800">Capaian Harian</span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-teal-900">
                  {dailyScorePct}%
                </span>
                <span className="text-xs text-teal-700">terpenuhi</span>
              </div>
              <div className="mt-3 h-2 w-full bg-teal-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-200"
                  style={{width: `${dailyScorePct}%`}}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Konsistensi</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {streakDays}
                </span>
                <span className="text-xs text-slate-600">hari aktif</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {dailyScorePct >= 100
                  ? 'Target harian tercapai!'
                  : 'Lanjutkan ketuk log harian'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fogg One-Tap Trackers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Water Tracker */}
        <article className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Air Minum Harian</h2>
                  <p className="text-xs text-slate-500">
                    Target {waterTarget} gelas ({targetLiters} liter)
                  </p>
                </div>
              </div>
              <span className="font-mono tabular-nums text-sm font-bold text-sky-700">
                {waterPct}%
              </span>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                  {todayLog.waterGlasses}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    / {waterTarget} gelas
                  </span>
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {waterLiters} L
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all duration-200"
                  style={{width: `${waterPct}%`}}
                />
              </div>
            </div>

            {/* Visual Glass Indicators */}
            <div className="grid grid-cols-8 gap-1.5 pt-1" aria-hidden="true">
              {Array.from({length: waterTarget}, (_, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded-sm transition-colors ${
                    i < todayLog.waterGlasses ? 'bg-sky-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onUpdateWater(-1)}
              disabled={todayLog.waterGlasses <= 0}
              aria-label="Kurangi 1 gelas air"
              className="min-h-[46px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
              <span>1</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateWater(1)}
              className="min-h-[46px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>1 Gelas</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateWater(2)}
              className="min-h-[46px] rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>500 ml</span>
            </button>
          </div>
        </article>

        {/* 2. Fruit & Vegetable Tracker */}
        <article className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Salad className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Buah & Sayur</h2>
                  <p className="text-xs text-slate-500">
                    Target {fruitVegTarget} porsi/hari (Germas)
                  </p>
                </div>
              </div>
              <span className="font-mono tabular-nums text-sm font-bold text-emerald-700">
                {fruitVegPct}%
              </span>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                  {fruitVegTotal}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    / {fruitVegTarget} porsi
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {todayLog.fruitPortions} buah · {todayLog.vegetablePortions} sayur
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                  style={{width: `${fruitVegPct}%`}}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Porsi Buah</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                  {todayLog.fruitPortions}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-center justify-between">
                <span className="text-slate-600 font-medium">Porsi Sayur</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                  {todayLog.vegetablePortions}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onUpdateFruit(1)}
              className="min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Apple className="w-4 h-4" />
              <span>+1 Buah</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateVegetable(1)}
              className="min-h-[46px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Salad className="w-4 h-4" />
              <span>+1 Sayur</span>
            </button>
          </div>
        </article>

        {/* 3. Micro Physical Activity (5-15 min to overcome Perceived Barriers) */}
        <article className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shrink-0">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Aktivitas Fisik Mikro</h2>
                  <p className="text-xs text-slate-500">
                    Sesi singkat 5–15 menit anti-mager
                  </p>
                </div>
              </div>
              <span className="font-mono tabular-nums text-sm font-bold text-teal-700">
                {activityPct}%
              </span>
            </div>

            <div className="pt-1">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                  {activityMinutesTotal}{' '}
                  <span className="text-sm font-semibold text-slate-500">
                    / {activityTarget} menit
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {todayLog.activities.length} sesi hari ini
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-200"
                  style={{width: `${activityPct}%`}}
                />
              </div>
            </div>

            {activeTimer && (
              <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-teal-900">{activeTimer.label}</p>
                  <p className="text-lg font-extrabold font-mono tabular-nums text-teal-700">
                    {formatTimer(activeTimer.remainingSeconds)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTimer(null)}
                  className="min-h-[40px] px-3 rounded-lg bg-white border border-teal-200 text-xs font-semibold text-teal-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  Batal
                </button>
              </div>
            )}

            {/* Logged today list */}
            {todayLog.activities.length > 0 && (
              <ul className="space-y-1.5 max-h-24 overflow-y-auto">
                {todayLog.activities.map((act: MicroActivityEntry) => (
                  <li
                    key={act.id}
                    className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="font-medium text-slate-700 flex items-center gap-1.5 truncate">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{act.label}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono tabular-nums text-slate-600">
                        {act.minutes} mnt
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveMicroActivity(act.id)}
                        className="text-slate-400 hover:text-red-600 font-semibold px-1 cursor-pointer"
                        aria-label={`Hapus ${act.label}`}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600">Pilih tugas mikro cepat:</p>
            <div className="space-y-1.5">
              {MICRO_ACTIVITY_PRESETS.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.label}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.minutes} menit · {item.hint}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTimer({
                          label: item.label,
                          totalSeconds: item.minutes * 60,
                          remainingSeconds: item.minutes * 60,
                        })
                      }
                      aria-label={`Mulai timer ${item.label}`}
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                      title="Mulai Timer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddMicroActivity(item.label, item.minutes)}
                      className="min-h-[36px] px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Catat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Step Tracker Anti-Repot + Weekly 7-Day Trend Bar Chart */}
      <StepTrackerSection
        activeMember={activeMember}
        todayLog={todayLog}
        routineLogs={routineLogs}
        onAddSteps={onAddSteps}
        onRemoveStepEntry={onRemoveStepEntry}
        onUpdateStepTarget={onUpdateMemberStepTarget}
      />

      {/* Health Check Summary & Puskesmas Bridge */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Status Cek Kesehatan Terakhir — {activeMember.name}
              </h2>
              <p className="text-xs text-slate-500">
                {latestHealthCheck
                  ? `Diperiksa pada ${new Date(latestHealthCheck.recordedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`
                  : 'Belum ada catatan pemeriksaan medis untuk profil ini.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {healthEval && <StatusIndicator status={healthEval.overallStatus} />}
            <button
              type="button"
              onClick={() => onNavigateTab('cek')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Periksa Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {latestHealthCheck && healthEval ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="text-xs text-slate-500">Tekanan Darah</span>
                <p className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
                  {latestHealthCheck.systolic}/{latestHealthCheck.diastolic}{' '}
                  <span className="text-xs font-medium text-slate-500">mmHg</span>
                </p>
                <StatusIndicator status={healthEval.bloodPressure.status} compact />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="text-xs text-slate-500">
                  Gula Darah ({latestHealthCheck.glucoseType === 'puasa' ? 'Puasa' : 'Sewaktu'})
                </span>
                <p className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
                  {latestHealthCheck.glucose}{' '}
                  <span className="text-xs font-medium text-slate-500">mg/dL</span>
                </p>
                <StatusIndicator status={healthEval.glucose.status} compact />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="text-xs text-slate-500">Kolesterol Total</span>
                <p className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
                  {latestHealthCheck.cholesterol}{' '}
                  <span className="text-xs font-medium text-slate-500">mg/dL</span>
                </p>
                <StatusIndicator status={healthEval.cholesterol.status} compact />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="text-xs text-slate-500">IMT (Indeks Massa Tubuh)</span>
                <p className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
                  {latestHealthCheck.bmi}{' '}
                  <span className="text-xs font-medium text-slate-500">kg/m²</span>
                </p>
                <StatusIndicator status={healthEval.bmi.status} compact />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="text-sm font-medium text-slate-800">{healthEval.summaryRecommendation}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{PROMOTIVE_DISCLAIMER}</p>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-5 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Belum ada pemeriksaan kesehatan untuk {activeMember.name}
            </p>
            <p className="text-xs text-slate-500">{PROMOTIVE_DISCLAIMER}</p>
          </div>
        )}
      </section>
    </div>
  );
};
