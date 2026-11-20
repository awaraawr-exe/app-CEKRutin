import React, {useEffect, useMemo, useState} from 'react';
import {
  Award,
  Check,
  Footprints,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {DailyRoutineLog, FamilyMember, StepLogEntry} from '../types/health';
import {getDateOffset} from '../lib/storage';

interface StepTrackerSectionProps {
  activeMember: FamilyMember;
  todayLog: DailyRoutineLog;
  routineLogs: DailyRoutineLog[];
  onAddSteps: (entry: Omit<StepLogEntry, 'id' | 'loggedAt'>) => void;
  onRemoveStepEntry: (entryId: string) => void;
  onUpdateStepTarget: (memberId: string, newTarget: number) => void;
}

interface ActivityPreset {
  id: string;
  label: string;
  stepsPerMinute: number;
  hint: string;
}

const STEP_ACTIVITY_PRESETS: ActivityPreset[] = [
  {
    id: 'jalan_santai',
    label: 'Jalan Santai',
    stepsPerMinute: 90,
    hint: '±90 lkh/mnt · Keliling rumah/taman',
  },
  {
    id: 'rumah_ringan',
    label: 'Aktivitas Rumah Ringan',
    stepsPerMinute: 80,
    hint: '±80 lkh/mnt · Menyapu, berkebun, beres-beres',
  },
  {
    id: 'jalan_cepat',
    label: 'Jalan Cepat / Senam',
    stepsPerMinute: 100,
    hint: '±100 lkh/mnt · Ritme bugar teratur',
  },
  {
    id: 'gerak_aktif',
    label: 'Peregangan & Gerak Aktif',
    stepsPerMinute: 85,
    hint: '±85 lkh/mnt · Mobilitas ringan lansia/keluarga',
  },
];

const DURATION_OPTIONS = [5, 10, 15, 30];
const QUICK_STEP_INCREMENTS = [500, 1000, 2500];

const SHORT_WEEKDAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function estimateDistanceKm(steps: number): number {
  return Number((steps * 0.0007).toFixed(2));
}

function estimateCalories(steps: number): number {
  return Math.round(steps * 0.04);
}

function formatNumberId(val: number): string {
  return val.toLocaleString('id-ID');
}

export const StepTrackerSection: React.FC<StepTrackerSectionProps> = ({
  activeMember,
  todayLog,
  routineLogs,
  onAddSteps,
  onRemoveStepEntry,
  onUpdateStepTarget,
}) => {
  const defaultTarget =
    activeMember.targetSteps ?? (activeMember.role === 'Lansia' ? 4000 : 6000);

  const [inputMode, setInputMode] = useState<'duration' | 'manual'>('duration');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('jalan_santai');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [manualStepInput, setManualStepInput] = useState<string>('');
  const [editingTarget, setEditingTarget] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<string>(String(defaultTarget));
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(6); // default to today (index 6)

  useEffect(() => {
    setEditingTarget(false);
    setTargetInput(String(defaultTarget));
  }, [activeMember.id, defaultTarget]);

  const todaySteps = todayLog.stepsCount ?? 0;
  const stepEntries = todayLog.stepEntries ?? [];
  const stepPct = Math.min(100, Math.round((todaySteps / Math.max(1, defaultTarget)) * 100));
  const targetReached = todaySteps >= defaultTarget && defaultTarget > 0;

  const activePreset =
    STEP_ACTIVITY_PRESETS.find((p) => p.id === selectedActivityId) || STEP_ACTIVITY_PRESETS[0];

  const effectiveMinutes =
    customMinutes.trim() !== ''
      ? Math.max(1, Math.min(240, Number(customMinutes) || selectedMinutes))
      : selectedMinutes;

  const previewSteps = Math.round(effectiveMinutes * activePreset.stepsPerMinute);
  const previewKm = estimateDistanceKm(previewSteps);
  const previewKcal = estimateCalories(previewSteps);

  const handleLogByDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewSteps <= 0) return;
    onAddSteps({
      source: 'duration',
      label: `${activePreset.label} (${effectiveMinutes} mnt)`,
      minutes: effectiveMinutes,
      steps: previewSteps,
    });
    setCustomMinutes('');
  };

  const handleQuickAddSteps = (amount: number) => {
    onAddSteps({
      source: 'manual',
      label: `Catat Cepat (+${formatNumberId(amount)})`,
      steps: amount,
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.round(Number(manualStepInput));
    if (!parsed || parsed <= 0) return;
    const clamped = Math.min(50000, parsed);
    onAddSteps({
      source: 'manual',
      label: `Input Langkah Langsung`,
      steps: clamped,
    });
    setManualStepInput('');
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Math.round(Number(targetInput));
    const clean = Math.max(1000, Math.min(30000, parsed || defaultTarget));
    onUpdateStepTarget(activeMember.id, clean);
    setTargetInput(String(clean));
    setEditingTarget(false);
  };

  // Build 7-day rolling history ending today (clean 0 for any unlogged days)
  const weeklySeries = useMemo(() => {
    const memberLogs = routineLogs.filter((l) => l.memberId === activeMember.id);
    return Array.from({length: 7}, (_, idx) => {
      const daysAgo = 6 - idx;
      const dateStr = getDateOffset(daysAgo);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayLabel = daysAgo === 0 ? 'Hari Ini' : SHORT_WEEKDAYS_ID[dt.getDay()];
      const fullDateLabel = dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
      const log = memberLogs.find((l) => l.date === dateStr);
      const steps = log?.stepsCount ?? 0;
      return {
        dateStr,
        dayLabel,
        fullDateLabel,
        steps,
        reached: steps >= defaultTarget && defaultTarget > 0,
        isToday: daysAgo === 0,
      };
    });
  }, [routineLogs, activeMember.id, defaultTarget]);

  const weeklyTotal = useMemo(
    () => weeklySeries.reduce((acc, item) => acc + item.steps, 0),
    [weeklySeries],
  );
  const weeklyAverage = Math.round(weeklyTotal / 7);
  const daysMetTarget = useMemo(
    () => weeklySeries.filter((item) => item.reached).length,
    [weeklySeries],
  );

  // SVG Bar Chart geometry
  const chartW = 540;
  const chartH = 210;
  const padLeft = 44;
  const padRight = 14;
  const padTop = 20;
  const padBottom = 34;
  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  const maxStepInWeek = Math.max(
    defaultTarget,
    ...weeklySeries.map((d) => d.steps),
    1000,
  );
  const yCeiling = Math.ceil((maxStepInWeek * 1.12) / 1000) * 1000;
  const getBarY = (val: number) => padTop + innerH - (Math.min(yCeiling, val) / yCeiling) * innerH;
  const targetLineY = getBarY(defaultTarget);
  const colWidth = innerW / 7;
  const barWidth = Math.min(36, colWidth * 0.56);

  const yTicks = [0, Math.round(yCeiling / 2), yCeiling];
  const activeBar = weeklySeries[selectedBarIdx] || weeklySeries[6];

  return (
    <section
      aria-labelledby="step-tracker-heading"
      className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-teal-700">
              Step Tracker Anti-Repot · {activeMember.name}
            </p>
            <h2 id="step-tracker-heading" className="text-lg sm:text-xl font-bold text-slate-900">
              Pelacak Langkah Harian & Tren 7 Hari
            </h2>
          </div>
        </div>

        {/* Target Editor Trigger */}
        <div className="flex items-center gap-2">
          {!editingTarget ? (
            <button
              type="button"
              onClick={() => {
                setTargetInput(String(defaultTarget));
                setEditingTarget(true);
              }}
              className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-teal-700" />
              <span>
                Target:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {formatNumberId(defaultTarget)}
                </strong>{' '}
                langkah
              </span>
            </button>
          ) : (
            <form onSubmit={handleSaveTarget} className="flex items-center gap-1.5">
              <label htmlFor="step-target-input" className="sr-only">
                Target langkah harian
              </label>
              <input
                id="step-target-input"
                type="number"
                min={1000}
                max={30000}
                step={500}
                required
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-28 min-h-[40px] rounded-xl border border-teal-500 px-2.5 text-xs font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
              />
              <button
                type="submit"
                className="min-h-[40px] px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setEditingTarget(false)}
                className="min-h-[40px] px-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main 2-Column Body: Left Logger & Progress | Right Weekly 7-Day Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Daily Progress + Dual-Mode Practical Logger */}
        <div className="lg:col-span-6 space-y-5">
          {/* Today's Progress Readout */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-slate-500 block">
                  Total Langkah Hari Ini
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                    {formatNumberId(todaySteps)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono tabular-nums">
                    / {formatNumberId(defaultTarget)} langkah
                  </span>
                </div>
              </div>
              <span
                className={`text-base font-extrabold font-mono tabular-nums ${
                  targetReached ? 'text-teal-700' : 'text-sky-700'
                }`}
              >
                {stepPct}%
              </span>
            </div>

            <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  targetReached ? 'bg-teal-600' : 'bg-sky-600'
                }`}
                style={{width: `${stepPct}%`}}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-0.5">
              <span>
                Estimasi jarak:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {estimateDistanceKm(todaySteps).toLocaleString('id-ID', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  km
                </strong>
              </span>
              <span>
                Estimasi kalori:{' '}
                <strong className="font-mono tabular-nums text-slate-900">
                  {formatNumberId(estimateCalories(todaySteps))} kkal
                </strong>
              </span>
            </div>
          </div>

          {/* Habit Loop Reward Banner when Target Met */}
          {targetReached && (
            <div
              role="status"
              className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5 text-xs text-emerald-950"
            >
              <Award className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  Luar biasa, {activeMember.name}! Target {formatNumberId(defaultTarget)} langkah
                  hari ini tercapai.
                </p>
                <p className="text-emerald-800 mt-0.5">
                  Kebiasaan bergerak rutin membantu menjaga tekanan darah, gula darah, dan kebugaran
                  keluarga tetap optimal.
                </p>
              </div>
            </div>
          )}

          {/* Segmented Tabs: Opsi A (Durasi & Aktivitas) vs Opsi B (Input Angka / Cepat) */}
          <div className="space-y-4">
            <div
              role="tablist"
              aria-label="Metode catat langkah"
              className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl"
            >
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'duration'}
                onClick={() => setInputMode('duration')}
                className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                  inputMode === 'duration'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Durasi & Aktivitas
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'manual'}
                onClick={() => setInputMode('manual')}
                className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                  inputMode === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Angka & Catat Cepat
              </button>
            </div>

            {inputMode === 'duration' ? (
              <form onSubmit={handleLogByDuration} className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    1. Pilih Jenis Gerak Ringan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STEP_ACTIVITY_PRESETS.map((preset) => {
                      const isPicked = preset.id === selectedActivityId;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedActivityId(preset.id)}
                          className={`min-h-[48px] text-left rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${
                            isPicked
                              ? 'bg-teal-50 border-teal-500 text-teal-950'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <p className="text-xs font-bold leading-snug">{preset.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{preset.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    2. Pilih Durasi Aktivitas
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {DURATION_OPTIONS.map((mins) => {
                      const isPicked = customMinutes === '' && selectedMinutes === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            setSelectedMinutes(mins);
                            setCustomMinutes('');
                          }}
                          className={`min-h-[44px] rounded-xl border text-xs font-mono tabular-nums font-bold transition-colors cursor-pointer ${
                            isPicked
                              ? 'bg-slate-900 border-slate-900 text-white'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {mins}m
                        </button>
                      );
                    })}
                    <input
                      type="number"
                      min={1}
                      max={240}
                      placeholder="Lain"
                      aria-label="Durasi menit lainnya"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="min-h-[44px] rounded-xl border border-slate-300 px-2 text-center text-xs font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                    />
                  </div>
                </div>

                {/* Live Automatic Conversion Preview */}
                <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-sky-900 font-semibold block">
                      Estimasi Konversi ({effectiveMinutes} menit):
                    </span>
                    <span className="text-sky-800 font-mono tabular-nums">
                      ±{previewKm.toLocaleString('id-ID', {minimumFractionDigits: 2})} km · ±
                      {previewKcal} kkal
                    </span>
                  </div>
                  <span className="text-base font-extrabold font-mono tabular-nums text-sky-900">
                    +{formatNumberId(previewSteps)} langkah
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat +{formatNumberId(previewSteps)} Langkah</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    Tambah Cepat Satu Ketukan
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_STEP_INCREMENTS.map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleQuickAddSteps(inc)}
                        className="min-h-[46px] rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs sm:text-sm font-mono tabular-nums font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{formatNumberId(inc)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-2">
                  <label
                    htmlFor="manual-step-input"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Atau Masukkan Jumlah Langkah Langsung
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="manual-step-input"
                      type="number"
                      min={1}
                      max={50000}
                      required
                      placeholder="Mis. 2500"
                      value={manualStepInput}
                      onChange={(e) => setManualStepInput(e.target.value)}
                      className="flex-1 min-h-[46px] rounded-xl border border-slate-300 px-3.5 text-sm font-mono tabular-nums focus:outline-2 focus:outline-teal-600"
                    />
                    <button
                      type="submit"
                      className="min-h-[46px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                      Tambah Langkah
                    </button>
                  </div>
                </form>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Catatan: Konversi durasi aktivitas (±80–100 langkah/menit), jarak tempuh, dan kalori
              bersifat estimasi harian praktis agar keluarga tetap termotivasi tanpa perlu jam pintar.
            </p>
          </div>

          {/* Today's Logged Step Entries */}
          {stepEntries.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600">
                Catatan Langkah Hari Ini ({stepEntries.length})
              </p>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                {stepEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{entry.label}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        +{formatNumberId(entry.steps)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveStepEntry(entry.id)}
                        aria-label={`Hapus catatan ${entry.label}`}
                        className="min-h-[32px] min-w-[32px] rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Weekly 7-Day Trend Bar Chart & Consistency Summary */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Tren Langkah 7 Hari Terakhir
                </h3>
                <p className="text-xs text-slate-500">
                  Ketuk batang hari untuk melihat rincian langkah & jarak
                </p>
              </div>
              {activeBar && (
                <div className="text-right font-mono tabular-nums">
                  <p className="text-xs font-semibold text-slate-600">
                    {activeBar.dayLabel} ({activeBar.fullDateLabel})
                  </p>
                  <p
                    className={`text-sm font-extrabold ${
                      activeBar.reached ? 'text-teal-700' : 'text-slate-900'
                    }`}
                  >
                    {formatNumberId(activeBar.steps)} langkah
                  </p>
                </div>
              )}
            </div>

            {/* Interactive SVG Bar Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full min-w-[320px] h-auto select-none"
                role="img"
                aria-label="Grafik batang jumlah langkah 7 hari terakhir"
              >
                {/* Horizontal gridlines & Y labels */}
                {yTicks.map((tick) => {
                  const yPos = getBarY(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={padLeft}
                        y1={yPos}
                        x2={chartW - padRight}
                        y2={yPos}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 6}
                        y={yPos + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {tick === 0 ? '0' : `${(tick / 1000).toFixed(1).replace('.0', '')}rb`}
                      </text>
                    </g>
                  );
                })}

                {/* Target reference dashed line */}
                <line
                  x1={padLeft}
                  y1={targetLineY}
                  x2={chartW - padRight}
                  y2={targetLineY}
                  stroke="#0D9488"
                  strokeWidth="1.3"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <text
                  x={chartW - padRight}
                  y={Math.max(12, targetLineY - 5)}
                  textAnchor="end"
                  className="fill-teal-700 text-[10px] font-mono font-semibold"
                >
                  Target {formatNumberId(defaultTarget)}
                </text>

                {/* 7-Day Bars */}
                {weeklySeries.map((day, idx) => {
                  const cx = padLeft + colWidth * idx + colWidth / 2;
                  const bx = cx - barWidth / 2;
                  const baseBottom = padTop + innerH;
                  const computedY = day.steps > 0 ? getBarY(day.steps) : baseBottom - 4;
                  const barHeight = Math.max(4, baseBottom - computedY);
                  const isSelected = idx === selectedBarIdx;

                  const fillColor =
                    day.steps === 0
                      ? '#E2E8F0'
                      : day.reached
                        ? '#0D9488'
                        : '#94A3B8';

                  return (
                    <g
                      key={day.dateStr}
                      className="cursor-pointer"
                      onClick={() => setSelectedBarIdx(idx)}
                      onMouseEnter={() => setSelectedBarIdx(idx)}
                    >
                      {/* Wide invisible touch target column */}
                      <rect
                        x={padLeft + colWidth * idx}
                        y={padTop}
                        width={colWidth}
                        height={innerH + padBottom}
                        fill="transparent"
                      />
                      {/* Highlight column backdrop on active day */}
                      {isSelected && (
                        <rect
                          x={bx - 4}
                          y={padTop}
                          width={barWidth + 8}
                          height={innerH}
                          rx={8}
                          fill="#F1F5F9"
                          opacity="0.7"
                        />
                      )}
                      <rect
                        x={bx}
                        y={computedY}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        fill={fillColor}
                        stroke={isSelected ? '#0F172A' : 'none'}
                        strokeWidth={isSelected ? 1.5 : 0}
                      />
                      {day.steps > 0 && (
                        <text
                          x={cx}
                          y={Math.max(padTop + 10, computedY - 5)}
                          textAnchor="middle"
                          className={`text-[9px] font-mono ${
                            day.reached ? 'fill-teal-800 font-bold' : 'fill-slate-500 font-medium'
                          }`}
                        >
                          {day.steps >= 1000
                            ? `${(day.steps / 1000).toFixed(1).replace('.0', '')}rb`
                            : day.steps}
                        </text>
                      )}
                      <text
                        x={cx}
                        y={chartH - 10}
                        textAnchor="middle"
                        className={`text-[10px] ${
                          day.isToday || isSelected
                            ? 'fill-slate-900 font-bold'
                            : 'fill-slate-500 font-medium'
                        }`}
                      >
                        {day.dayLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Chart Color Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 inline-block" />
                Mencapai Target
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" />
                Di Bawah Target
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 inline-block" />
                Belum Ada Catatan (0)
              </span>
            </div>

            {/* Weekly Summary Metrics */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                <span className="text-[11px] text-slate-500 block">Total Minggu Ini</span>
                <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-slate-900 mt-0.5 block">
                  {formatNumberId(weeklyTotal)}
                </span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                <span className="text-[11px] text-slate-500 block">Rata-Rata / Hari</span>
                <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-slate-900 mt-0.5 block">
                  {formatNumberId(weeklyAverage)}
                </span>
              </div>
              <div className="rounded-xl bg-teal-50 border border-teal-200 px-3 py-2.5">
                <span className="text-[11px] text-teal-800 block">Capai Target</span>
                <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-teal-900 mt-0.5 block">
                  {daysMetTarget}/7 hari
                </span>
              </div>
            </div>
          </div>

          {/* Promotive Safety & Puskesmas Consultation Reminder */}
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 flex items-start gap-2.5 text-xs text-sky-950 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Panduan Aman Aktivitas Keluarga</p>
              <p className="mt-1 text-sky-900">
                Sesuaikan durasi dan intensitas gerak dengan usia serta kemampuan fisik masing-masing
                anggota keluarga (terutama lansia). Jika timbul keluhan seperti pusing, nyeri dada,
                atau sesak napas saat beraktivitas, segera hentikan dan konsultasikan ke Puskesmas
                atau Fasilitas Kesehatan Primer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
